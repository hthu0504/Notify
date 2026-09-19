from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models import Widget
from app.schemas.dashboard import DashboardState


router = APIRouter(
    prefix="/dashboard-state",
    tags=["dashboard"]
)


@router.get("/")
def get_dashboard_state(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    user_id = current_user["sub"]

    widgets = (
        db.query(Widget)
        .filter(Widget.user_id == user_id)
        .order_by(Widget.id)
        .all()
    )

    result = []

    for widget in widgets:
        widget_data = {
            "id": widget.id,
            "type": widget.type,
            "title": widget.title,
            **(widget.config or {}),
        }

        result.append(widget_data)

    return {
        "widgets": result
    }


@router.patch("/")
def update_dashboard_state(
    new_state: DashboardState,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    user_id = current_user["sub"]

    existing_widgets = (
        db.query(Widget)
        .filter(Widget.user_id == user_id)
        .all()
    )

    existing_by_id = {
        widget.id: widget
        for widget in existing_widgets
    }

    incoming_ids = set()

    for widget_data in new_state.widgets:
        frontend_id = widget_data.get("id")

        # Existing DB widget
        if isinstance(frontend_id, int) and frontend_id in existing_by_id:
            widget = existing_by_id[frontend_id]

            widget.type = widget_data.get("type", widget.type)
            widget.title = widget_data.get("title", widget.title)

            config = {
                key: value
                for key, value in widget_data.items()
                if key not in {"id", "type", "title"}
            }

            widget.config = config
            incoming_ids.add(frontend_id)

        # New frontend widget
        else:
            widget_type = widget_data.get("type")

            if not widget_type:
                continue

            title = widget_data.get(
                "title",
                widget_type
            )

            config = {
                key: value
                for key, value in widget_data.items()
                if key != "id"
                and key != "type"
                and key != "title"
            }

            new_widget = Widget(
                user_id=user_id,
                type=widget_type,
                title=title,
                config=config
            )

            db.add(new_widget)

    # Delete widgets that are no longer present
    # in the frontend state
    for widget in existing_widgets:
        if widget.id not in incoming_ids:
            db.delete(widget)

    db.commit()

    # Return the latest DB state
    widgets = (
        db.query(Widget)
        .filter(Widget.user_id == user_id)
        .order_by(Widget.id)
        .all()
    )

    result = []

    for widget in widgets:
        widget_data = {
            "id": widget.id,
            "type": widget.type,
            "title": widget.title,
            **(widget.config or {}),
        }

        result.append(widget_data)

    return {
        "widgets": result
    }


@router.post("/reset")
def reset_dashboard_state(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    user_id = current_user["sub"]

    db.query(Widget).filter(
        Widget.user_id == user_id
    ).delete(
        synchronize_session=False
    )

    db.commit()

    return {
        "widgets": []
    }


@router.get("/me")
def get_me(
    current_user: dict = Depends(get_current_user)
):
    return {
        "sub": current_user.get("sub"),
        "username": current_user.get("preferred_username"),
        "email": current_user.get("email"),
    }