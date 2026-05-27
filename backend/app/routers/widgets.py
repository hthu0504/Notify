from fastapi import APIRouter, HTTPException
from app.schemas.widget import WidgetCreate, WidgetUpdate

router = APIRouter(prefix="/widgets", tags=["widgets"])

widgets = [
    {"id": 1, "type": "clock", "title": "My Clock", "config": {}},
    {"id": 2, "type": "todo", "title": "Study Todo", "config": {}},
]

@router.get("/")
def get_widgets():
    return widgets

@router.get("/{widget_id}")
def get_widget(widget_id: int):
    for widget in widgets:
        if widget["id"] == widget_id:
            return widget
    raise HTTPException(status_code=404, detail="Widget not found")

@router.post("/")
def create_widget(widget: WidgetCreate):
    new_widget = {
        "id": len(widgets) + 1,
        **widget.model_dump()
    }
    widgets.append(new_widget)
    return new_widget

@router.patch("/{widget_id}")
def update_widget(widget_id: int, data: WidgetUpdate):
    for widget in widgets:
        if widget["id"] == widget_id:
            update_data = data.model_dump(exclude_unset=True)
            widget.update(update_data)
            return widget
    raise HTTPException(status_code=404, detail="Widget not found")

@router.delete("/{widget_id}")
def delete_widget(widget_id: int):
    for widget in widgets:
        if widget["id"] == widget_id:
            widgets.remove(widget)
            return {"message": "Widget deleted"}
    raise HTTPException(status_code=404, detail="Widget not found")