import os
import re
from datetime import date, datetime, timedelta
import time
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit

import httpx
from fastapi import APIRouter, Depends, HTTPException, Query
from jose import JWTError, jwt
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models import IntegrationConnection


router = APIRouter(prefix="/integrations", tags=["integrations"])
NOTION_VERSION = "2026-03-11"
NOTION_TASK_CACHE = {}


def _notion_settings():
    settings = {
        "client_id": os.getenv("NOTION_CLIENT_ID"),
        "client_secret": os.getenv("NOTION_CLIENT_SECRET"),
        "redirect_uri": os.getenv("NOTION_REDIRECT_URI"),
        "auth_url": os.getenv("NOTION_AUTH_URL", "https://api.notion.com/v1/oauth/authorize"),
        "token_url": os.getenv("NOTION_TOKEN_URL", "https://api.notion.com/v1/oauth/token"),
    }
    missing = [key for key in ("client_id", "client_secret", "redirect_uri") if not settings[key]]
    if missing:
        raise HTTPException(status_code=503, detail="Notion OAuth is not configured in the backend environment")
    return settings


def _get_connection(db: Session, user_id: str):
    return (
        db.query(IntegrationConnection)
        .filter(
            IntegrationConnection.user_id == user_id,
            IntegrationConnection.provider == "notion",
        )
        .first()
    )


class NotionCallback(BaseModel):
    code: str
    state: str


class NotionTaskUpdate(BaseModel):
    completed: bool


@router.get("/notion/authorize-url")
def notion_authorize_url(current_user=Depends(get_current_user)):
    settings = _notion_settings()
    state = jwt.encode(
        {"sub": current_user["sub"], "exp": int(datetime.utcnow().timestamp()) + 600},
        settings["client_secret"],
        algorithm="HS256",
    )

    parts = urlsplit(settings["auth_url"])
    query = dict(parse_qsl(parts.query, keep_blank_values=True))
    query.update({
        "client_id": settings["client_id"],
        "redirect_uri": settings["redirect_uri"],
        "response_type": "code",
        "owner": "user",
        "state": state,
    })
    return {"authorization_url": urlunsplit(parts._replace(query=urlencode(query)))}


@router.post("/notion/callback")
def notion_callback(
    payload: NotionCallback,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    settings = _notion_settings()
    try:
        state_data = jwt.decode(payload.state, settings["client_secret"], algorithms=["HS256"])
    except JWTError as exc:
        raise HTTPException(status_code=400, detail="Notion authorization state is invalid or expired") from exc

    if state_data.get("sub") != current_user["sub"]:
        raise HTTPException(status_code=403, detail="Notion authorization belongs to another user")

    try:
        response = httpx.post(
            settings["token_url"],
            auth=(settings["client_id"], settings["client_secret"]),
            json={
                "grant_type": "authorization_code",
                "code": payload.code,
                "redirect_uri": settings["redirect_uri"],
            },
            timeout=15,
        )
        response.raise_for_status()
        token_data = response.json()
    except (httpx.HTTPError, ValueError) as exc:
        raise HTTPException(status_code=502, detail="Notion could not complete authorization") from exc

    connection = _get_connection(db, current_user["sub"])
    if connection is None:
        connection = IntegrationConnection(user_id=current_user["sub"], provider="notion")
        db.add(connection)

    connection.access_token = token_data["access_token"]
    connection.refresh_token = token_data.get("refresh_token")
    connection.workspace_id = token_data.get("workspace_id")
    connection.workspace_name = token_data.get("workspace_name")
    connection.metadata_json = {
        "bot_id": token_data.get("bot_id"),
        "owner": token_data.get("owner"),
        "workspace_icon": token_data.get("workspace_icon"),
    }
    db.commit()
    return {"connected": True, "workspace_name": connection.workspace_name}


@router.get("/notion/status")
def notion_status(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    connection = _get_connection(db, current_user["sub"])
    return {
        "connected": connection is not None,
        "workspace_name": connection.workspace_name if connection else None,
    }


def _refresh_connection(connection: IntegrationConnection, settings: dict, db: Session):
    if not connection.refresh_token:
        raise HTTPException(status_code=401, detail="Reconnect your Notion account")
    try:
        response = httpx.post(
            settings["token_url"],
            auth=(settings["client_id"], settings["client_secret"]),
            json={"grant_type": "refresh_token", "refresh_token": connection.refresh_token},
            timeout=15,
        )
        response.raise_for_status()
        token_data = response.json()
    except (httpx.HTTPError, ValueError) as exc:
        raise HTTPException(status_code=401, detail="Reconnect your Notion account") from exc

    connection.access_token = token_data["access_token"]
    connection.refresh_token = token_data.get("refresh_token", connection.refresh_token)
    db.commit()


def _rich_text(block: dict, key: str) -> str:
    return "".join(part.get("plain_text", "") for part in block.get(key, []))


def _page_title(page: dict) -> str:
    if page.get("object") == "data_source":
        return _rich_text(page, "title")
    for prop in page.get("properties", {}).values():
        if prop.get("type") == "title":
            return _rich_text(prop, "title")
    return ""


def _date_from_title(value: str, default_year: int | date):
    reference_date = default_year if isinstance(default_year, date) else date(default_year, 1, 1)
    fallback_year = reference_date.year
    text = value.strip()
    if not re.fullmatch(r"\d{4}[-/.]\d{1,2}[-/.]\d{1,2}", text) and not re.fullmatch(
        r"\d{1,2}[-/.]\d{1,2}(?:[-/.]\d{2,4})?", text
    ):
        embedded_date = re.search(
            r"(?<!\d)(?:\d{4}[-/.]\d{1,2}[-/.]\d{1,2}|\d{1,2}[-/.]\d{1,2}(?:[-/.]\d{2,4})?)(?!\d)",
            text,
        )
        if embedded_date:
            text = embedded_date.group(0)
        else:
            named_date = re.search(r"\b[A-Za-z]+\s+\d{1,2}(?:,?\s+\d{4})?\b", text)
            if named_date:
                text = named_date.group(0)
    match = re.fullmatch(r"(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})", text)
    if match:
        year, month, day = map(int, match.groups())
    else:
        match = re.fullmatch(r"(\d{1,2})[-/.](\d{1,2})(?:[-/.](\d{2,4}))?", text)
        if match:
            month, day = int(match.group(1)), int(match.group(2))
            year = int(match.group(3)) if match.group(3) else fallback_year
            if year < 100:
                year += 2000
            if not match.group(3):
                if month - reference_date.month > 6:
                    year -= 1
                elif reference_date.month - month > 6:
                    year += 1
        else:
            match = re.fullmatch(r"([A-Za-z]+)\s+(\d{1,2})(?:,?\s+(\d{4}))?", text)
            if not match:
                return None
            try:
                month = datetime.strptime(match.group(1)[:3], "%b").month
            except ValueError:
                return None
            day = int(match.group(2))
            year = int(match.group(3)) if match.group(3) else fallback_year

    try:
        return date(year, month, day)
    except ValueError:
        return None


def _notion_children(access_token: str, block_id: str):
    headers = {"Authorization": f"Bearer {access_token}", "Notion-Version": NOTION_VERSION}
    blocks = []
    cursor = None
    for _ in range(20):
        params = {"page_size": 100}
        if cursor:
            params["start_cursor"] = cursor
        response = httpx.get(
            f"https://api.notion.com/v1/blocks/{block_id}/children",
            headers=headers,
            params=params,
            timeout=15,
        )
        response.raise_for_status()
        data = response.json()
        blocks.extend(data.get("results", []))
        if not data.get("has_more"):
            break
        cursor = data.get("next_cursor")
    return blocks


def _collect_todos(
    access_token: str,
    block_id: str,
    inherited_date: date | None,
    fallback_date: date,
    depth: int = 0,
):
    if depth > 3:
        return []
    found = []
    current_date = inherited_date
    for block in _notion_children(access_token, block_id):
        block_type = block.get("type", "")
        content = block.get(block_type, {})
        if block_type in {"heading_1", "heading_2", "heading_3"}:
            heading_date = _date_from_title(
                _rich_text(content, "rich_text"),
                current_date or fallback_date,
            )
            if heading_date:
                current_date = heading_date
        elif block_type == "to_do":
            text = _rich_text(content, "rich_text").strip()
            if text:
                found.append({
                    "id": block.get("id"),
                    "text": text,
                    "completed": bool(content.get("checked")),
                    "date": current_date.isoformat() if current_date else None,
                })
        if block.get("has_children"):
            found.extend(
                _collect_todos(
                    access_token,
                    block["id"],
                    current_date,
                    fallback_date,
                    depth + 1,
                )
            )
    return found


@router.get("/notion/search")
def notion_search(
    query: str = Query(default="", max_length=200),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    connection = _get_connection(db, current_user["sub"])
    if connection is None:
        raise HTTPException(status_code=409, detail="Connect a Notion workspace first")

    headers = {
        "Authorization": f"Bearer {connection.access_token}",
        "Notion-Version": NOTION_VERSION,
        "Content-Type": "application/json",
    }
    body = {"page_size": 100}
    if query.strip():
        body["query"] = query.strip()

    try:
        response = httpx.post("https://api.notion.com/v1/search", headers=headers, json=body, timeout=15)
        if response.status_code == 401 and connection.refresh_token:
            _refresh_connection(connection, _notion_settings(), db)
            headers["Authorization"] = f"Bearer {connection.access_token}"
            response = httpx.post("https://api.notion.com/v1/search", headers=headers, json=body, timeout=15)
        response.raise_for_status()
        data = response.json()
    except httpx.HTTPError as exc:
        raise HTTPException(status_code=502, detail="Could not read shared pages from Notion") from exc

    resources = []
    for item in data.get("results", []):
        title = ""
        if item.get("object") == "data_source":
            title = "".join(part.get("plain_text", "") for part in item.get("title", []))
        elif item.get("object") == "database":
            title = "".join(part.get("plain_text", "") for part in item.get("title", []))
        elif item.get("object") == "page":
            for prop in item.get("properties", {}).values():
                if prop.get("type") == "title":
                    title = "".join(part.get("plain_text", "") for part in prop.get("title", []))
                    break
        resources.append({"id": item.get("id"), "object": item.get("object"), "title": title, "url": item.get("url")})
    return {"results": resources, "has_more": data.get("has_more", False)}


@router.get("/notion/tasks")
def notion_tasks(
    today: str = Query(default=None),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    connection = _get_connection(db, current_user["sub"])
    if connection is None:
        raise HTTPException(status_code=409, detail="Connect a Notion workspace first")

    try:
        local_today = date.fromisoformat(today) if today else date.today()
    except ValueError as exc:
        raise HTTPException(status_code=400, detail="today must use YYYY-MM-DD format") from exc

    cache_key = (current_user["sub"], local_today.isoformat())
    cached = NOTION_TASK_CACHE.get(cache_key)
    if cached and cached[0] > time.monotonic():
        return cached[1]

    settings = _notion_settings()
    headers = {
        "Authorization": f"Bearer {connection.access_token}",
        "Notion-Version": NOTION_VERSION,
        "Content-Type": "application/json",
    }
    pages = []
    cursor = None
    try:
        for _ in range(5):
            body = {"page_size": 100, "filter": {"property": "object", "value": "page"}}
            if cursor:
                body["start_cursor"] = cursor
            response = httpx.post("https://api.notion.com/v1/search", headers=headers, json=body, timeout=20)
            if response.status_code == 401 and connection.refresh_token:
                _refresh_connection(connection, settings, db)
                headers["Authorization"] = f"Bearer {connection.access_token}"
                response = httpx.post("https://api.notion.com/v1/search", headers=headers, json=body, timeout=20)
            response.raise_for_status()
            data = response.json()
            pages.extend(data.get("results", []))
            if not data.get("has_more"):
                break
            cursor = data.get("next_cursor")

        known_page_ids = {page.get("id") for page in pages}
        for offset in (-1, 0, 1):
            lookup_date = local_today + timedelta(days=offset)
            lookup_title = f"{lookup_date.month}/{lookup_date.day}"
            response = httpx.post(
                "https://api.notion.com/v1/search",
                headers=headers,
                json={
                    "page_size": 100,
                    "query": lookup_title,
                    "filter": {"property": "object", "value": "page"},
                },
                timeout=20,
            )
            if response.status_code == 401 and connection.refresh_token:
                _refresh_connection(connection, settings, db)
                headers["Authorization"] = f"Bearer {connection.access_token}"
                response = httpx.post(
                    "https://api.notion.com/v1/search",
                    headers=headers,
                    json={
                        "page_size": 100,
                        "query": lookup_title,
                        "filter": {"property": "object", "value": "page"},
                    },
                    timeout=20,
                )
            response.raise_for_status()
            for page in response.json().get("results", []):
                if page.get("id") not in known_page_ids:
                    pages.append(page)
                    known_page_ids.add(page.get("id"))

        candidates = []
        for page_index, page in enumerate(pages):
            title = _page_title(page)
            page_date = _date_from_title(title, local_today)
            if page_date:
                candidates.append((page, title, page_date))
            elif (
                any(word in title.casefold() for word in ("todo", "to-do", "task", "daily", "planner"))
                or page_index < 30
            ):
                candidates.append((page, title, None))

        tasks = []
        seen_task_ids = set()
        for page, title, page_date in candidates[:120]:
            for task in _collect_todos(connection.access_token, page["id"], page_date, local_today):
                if task["id"] in seen_task_ids:
                    continue
                seen_task_ids.add(task["id"])
                task["page_title"] = title or "Untitled page"
                task["page_url"] = page.get("url")
                tasks.append(task)
    except httpx.HTTPError as exc:
        raise HTTPException(status_code=502, detail="Could not read to-do blocks from Notion") from exc

    tasks_by_date = {}
    for task in tasks:
        if task["date"]:
            tasks_by_date.setdefault(task["date"], []).append(task)
    result = {"tasks_by_date": tasks_by_date}
    NOTION_TASK_CACHE[cache_key] = (time.monotonic() + 45, result)
    return result


@router.patch("/notion/tasks/{block_id}")
def update_notion_task(
    block_id: str,
    payload: NotionTaskUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    connection = _get_connection(db, current_user["sub"])
    if connection is None:
        raise HTTPException(status_code=409, detail="Connect a Notion workspace first")

    headers = {
        "Authorization": f"Bearer {connection.access_token}",
        "Notion-Version": NOTION_VERSION,
        "Content-Type": "application/json",
    }
    try:
        response = httpx.patch(
            f"https://api.notion.com/v1/blocks/{block_id}",
            headers=headers,
            json={"to_do": {"checked": payload.completed}},
            timeout=15,
        )
        if response.status_code == 401 and connection.refresh_token:
            _refresh_connection(connection, _notion_settings(), db)
            headers["Authorization"] = f"Bearer {connection.access_token}"
            response = httpx.patch(
                f"https://api.notion.com/v1/blocks/{block_id}",
                headers=headers,
                json={"to_do": {"checked": payload.completed}},
                timeout=15,
            )
        if response.status_code == 403:
            raise HTTPException(
                status_code=403,
                detail="Enable Update content for the Notion integration to change task checkboxes.",
            )
        response.raise_for_status()
    except httpx.HTTPError as exc:
        raise HTTPException(status_code=502, detail="Could not update the Notion task") from exc

    for cache_key in list(NOTION_TASK_CACHE):
        if cache_key[0] == current_user["sub"]:
            NOTION_TASK_CACHE.pop(cache_key, None)
    return {"updated": True, "completed": payload.completed}
