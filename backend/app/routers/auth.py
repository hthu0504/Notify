from fastapi import APIRouter, HTTPException

from app.schemas.auth import LoginRequest, LoginResponse

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=LoginResponse)
def login(credentials: LoginRequest):
    if not credentials.email or not credentials.password:
        raise HTTPException(status_code=400, detail="Email and password are required")

    name = credentials.email.split("@")[0]

    return LoginResponse(
        access_token=f"dev-token-{name}",
        user={
            "email": credentials.email,
            "name": name,
        },
    )
