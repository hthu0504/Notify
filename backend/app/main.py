import time

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.exc import OperationalError

from app.database import engine
from app.models import Base
from app.routers import auth, dashboard, widgets


def create_tables_with_retry():
    for attempt in range(10):
        try:
            Base.metadata.create_all(bind=engine)
            return
        except OperationalError:
            if attempt == 9:
                raise

            time.sleep(2)


create_tables_with_retry()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(widgets.router)
app.include_router(dashboard.router)


@app.get("/")
def root():
    return {"message": "Notify backend running"}
