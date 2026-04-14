from fastapi import APIRouter

from app.api.routers.pages import router as page_router
from app.api.routers.auth import router as auth_router
from app.api.routers.employees import router as employee_router
from app.api.routers.orders import router as order_router
from app.api.routers.products import router as product_router
from app.api.routers.settings import router as settings_router

router = APIRouter()

router.include_router(page_router)
router.include_router(auth_router, prefix="/auth")
router.include_router(employee_router, prefix="/employees")
router.include_router(order_router, prefix="/orders")
router.include_router(product_router, prefix="/products")
router.include_router(settings_router, prefix="/settings")