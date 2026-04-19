from fastapi import APIRouter, Depends, Body
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.services.settings_service import SettingsService
from app.utils.responses import success_response
from app.schemas.settings_schema import (
    ShopSettingsUpdate, TaxSettingsUpdate, 
    PaymentSettingsUpdate, ReceiptSettingsUpdate, 
    TableSettingsUpdate
)

router = APIRouter(tags=["settings"])

@router.get("/get-settings")
def get_settings(db: Session = Depends(get_db)):
    """Retrieve all shop settings"""
    svc = SettingsService(db)
    settings = svc.get_settings_service()
    return success_response(data=settings.to_dict(), message="Settings fetched successfully")

@router.post("/update-shop")
async def update_shop_settings(payload: ShopSettingsUpdate, db: Session = Depends(get_db)):
    """Update shop identity settings"""
    svc = SettingsService(db)
    settings = svc.update_settings_service(payload.dict(exclude_unset=True))
    return success_response(data=settings.to_dict(), message="Shop settings updated")

@router.post("/update-tax")
async def update_tax_settings(payload: TaxSettingsUpdate, db: Session = Depends(get_db)):
    """Update tax and discount settings"""
    svc = SettingsService(db)
    settings = svc.update_settings_service(payload.dict(exclude_unset=True))
    return success_response(data=settings.to_dict(), message="Tax settings updated")

@router.post("/update-payments")
async def update_payment_settings(payload: PaymentSettingsUpdate, db: Session = Depends(get_db)):
    """Update payment configuration"""
    svc = SettingsService(db)
    settings = svc.update_settings_service(payload.dict(exclude_unset=True))
    return success_response(data=settings.to_dict(), message="Payment settings updated")

@router.post("/update-receipt")
async def update_receipt_settings(payload: ReceiptSettingsUpdate, db: Session = Depends(get_db)):
    """Update receipt appearance settings"""
    svc = SettingsService(db)
    settings = svc.update_settings_service(payload.dict(exclude_unset=True))
    return success_response(data=settings.to_dict(), message="Receipt settings updated")

@router.post("/update-tables")
async def update_table_settings(payload: TableSettingsUpdate, db: Session = Depends(get_db)):
    """Update table and dine-in settings"""
    svc = SettingsService(db)
    settings = svc.update_settings_service(payload.dict(exclude_unset=True))
    return success_response(data=settings.to_dict(), message="Table settings updated")
