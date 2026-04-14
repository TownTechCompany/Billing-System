from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.services.settings_service import SettingsService
from app.utils.responses import success_response

router = APIRouter(tags=["settings"])

@router.get("")
def get_settings(db: Session = Depends(get_db)):
    """Retrieve shop settings"""
    svc = SettingsService(db)
    settings = svc.get_settings_service()
    return success_response(data=settings.to_dict(), message="Settings fetched successfully")
 
@router.post("")
async def save_settings(request: Request, db: Session = Depends(get_db)):
    """Update shop settings"""
    data = await request.json()
    svc = SettingsService(db)
    settings = svc.update_settings_service(data)
    return success_response(data=settings.to_dict(), message="Settings saved successfully")
