from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Widget
from app.schemas.widget import WidgetCreate, WidgetUpdate

router = APIRouter(prefix="/widgets", tags=["widgets"])

@router.get("/")
def get_widgets(db: Session = Depends(get_db)):
    return db.query(Widget).all()

@router.get("/{widget_id}")
def get_widget(widget_id: int, db: Session = Depends(get_db)):
    widget = db.query(Widget).filter(Widget.id == widget_id).first()
    if not widget:
        raise HTTPException(status_code=404, detail="Widget not found")
    return widget

@router.post("/")
def create_widget(widget: WidgetCreate, db: Session = Depends(get_db)):
    new_widget = Widget(**widget.model_dump())
    db.add(new_widget)
    db.commit()
    db.refresh(new_widget)
    return new_widget

@router.patch("/{widget_id}")
def update_widget(widget_id: int, data: WidgetUpdate, db: Session = Depends(get_db)):
    widget = db.query(Widget).filter(Widget.id == widget_id).first()
    if not widget:
        raise HTTPException(status_code=404, detail="Widget not found")

    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(widget, key, value)

    db.commit()
    db.refresh(widget)
    return widget

@router.delete("/{widget_id}")
def delete_widget(widget_id: int, db: Session = Depends(get_db)):
    widget = db.query(Widget).filter(Widget.id == widget_id).first()
    if not widget:
        raise HTTPException(status_code=404, detail="Widget not found")

    db.delete(widget)
    db.commit()
    return {"message": "Widget deleted"}