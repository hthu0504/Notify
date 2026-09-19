from fastapi import APIRouter, Depends
from app.schemas.dashboard import DashboardState
from app.dependencies import get_current_user

router = APIRouter(prefix="/dashboard-state", tags=["dashboard"])

dashboard_state = DashboardState(
    widgets=[]
)

@router.get("/")
def get_dashboard_state():
    return dashboard_state

@router.patch("/")
def update_dashboard_state(new_state: DashboardState):
    global dashboard_state
    dashboard_state = new_state
    return dashboard_state

@router.post("/reset")
def reset_dashboard_state():
    global dashboard_state
    dashboard_state = DashboardState(
        widgets=[]
    )
    return dashboard_state

@router.get("/me")
def get_me(current_user: dict = Depends(get_current_user)):
    return {
        "sub": current_user.get("sub"),
        "username": current_user.get("preferred_username"),
        "email": current_user.get("email"),
    }