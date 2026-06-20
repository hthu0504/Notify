import hashlib
import secrets
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User
from app.schemas.auth import (
    LoginRequest,
    LoginResponse,
    RegisterRequest,
    SocialLoginRequest,
)

router = APIRouter(prefix="/auth", tags=["auth"])


def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode("utf-8")).hexdigest()


def build_response(user: User) -> LoginResponse:
    return LoginResponse(
        access_token=f"dev-token-{secrets.token_urlsafe(24)}",
        user={
            "email": user.email,
            "name": user.name,
        },
    )


@router.post("/login", response_model=LoginResponse)
def login(credentials: LoginRequest, db: Session = Depends(get_db)):
    if not credentials.email or not credentials.password:
        raise HTTPException(status_code=400, detail="Email and password are required")

    user = db.query(User).filter(User.email == credentials.email).first()
    password_hash = hash_password(credentials.password)

    if user and user.password_hash and user.password_hash != password_hash:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    if not user:
        user = User(
            email=credentials.email,
            name=credentials.email.split("@")[0],
            password_hash=password_hash,
            provider="email",
        )
        db.add(user)
    elif not user.password_hash:
        user.password_hash = password_hash

    user.last_login_at = datetime.utcnow()
    db.commit()
    db.refresh(user)

    return build_response(user)


@router.post("/register", response_model=LoginResponse)
def register(payload: RegisterRequest, db: Session = Depends(get_db)):
    existing_user = db.query(User).filter(User.email == payload.email).first()

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email is already registered",
        )

    name = payload.name.strip() if payload.name and payload.name.strip() else payload.email.split("@")[0]

    user = User(
        email=payload.email,
        name=name,
        password_hash=hash_password(payload.password),
        provider="email",
        last_login_at=datetime.utcnow(),
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    return build_response(user)


@router.post("/social-login", response_model=LoginResponse)
def social_login(payload: SocialLoginRequest, db: Session = Depends(get_db)):
    provider = payload.provider.strip().lower()

    if provider not in {"google", "facebook"}:
        raise HTTPException(status_code=400, detail="Unsupported social provider")

    email = f"{provider}_user@notify.local"
    user = db.query(User).filter(User.email == email).first()

    if not user:
        user = User(
            email=email,
            name=f"{provider.title()} User",
            provider=provider,
        )
        db.add(user)

    user.last_login_at = datetime.utcnow()
    db.commit()
    db.refresh(user)

    return build_response(user)
