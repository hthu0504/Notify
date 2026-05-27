from fastapi import APIRouter
from app.schemas.dashboard import DashboardState

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
