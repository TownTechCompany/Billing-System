from fastapi import APIRouter
from app.api.v1.endpoints import pages, products, orders, auth, settings, employees

router = APIRouter()
router.include_router(auth.router)
router.include_router(employees.router)
router.include_router(pages.router)
router.include_router(products.router)
router.include_router(orders.router)
router.include_router(settings.router)

# analytics lives under /api/orders/analytics — already registered above
# but we also expose it at /api/analytics for the dashboard JS
from fastapi.responses import JSONResponse
from fastapi import Depends
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.services.order_service import OrderService

@router.get("/api/analytics")
def analytics_alias(db: Session = Depends(get_db)):
    return OrderService(db).analytics()
