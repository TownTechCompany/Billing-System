from pathlib import Path
from datetime import datetime
from fastapi import APIRouter, Request, Depends
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.models import Product, Order, OrderItem, ShopSettings
from app.services.order_service import OrderService

router = APIRouter()
APP_ROOT = Path(__file__).resolve().parents[3]
templates = Jinja2Templates(directory=str(APP_ROOT / "templates"))

@router.get("/", response_class=HTMLResponse)
async def dashboard(request: Request, start_date: str = None, end_date: str = None, db: Session = Depends(get_db)):
    svc = OrderService(db)
    start = end = None
    if start_date and end_date:
        try:
            start = datetime.strptime(start_date, "%Y-%m-%d")
            end = datetime.strptime(end_date, "%Y-%m-%d").replace(hour=23, minute=59, second=59)
        except ValueError:
            pass
    metrics = svc.dashboard_metrics(start, end)
    return templates.TemplateResponse("dashboard.html", {
        "request": request,
        "active_page": "dashboard",
        "start_date": start_date or "",
        "end_date": end_date or "",
        "total_products": db.query(Product).count(),
        **metrics,
    })

@router.get("/pos", response_class=HTMLResponse)
async def pos(request: Request, db: Session = Depends(get_db)):
    products = db.query(Product).all()
    categories = sorted(set(p.category for p in products))
    return templates.TemplateResponse("pos.html", {
        "request": request, "active_page": "pos",
        "products": products, "categories": categories,
    })

@router.get("/products", response_class=HTMLResponse)
async def products_page(request: Request):
    return templates.TemplateResponse("products.html", {"request": request, "active_page": "products"})

@router.get("/orders", response_class=HTMLResponse)
async def orders_page(request: Request, db: Session = Depends(get_db)):
    all_orders = db.query(Order).order_by(Order.date_created.desc()).all()
    return templates.TemplateResponse(
        "orders.html",
        {"request": request, "orders": all_orders, "active_page": "orders"},
    )

@router.get("/settings", response_class=HTMLResponse)
async def settings_page(request: Request, db: Session = Depends(get_db)):
    settings = db.query(ShopSettings).first()
    if not settings:
        settings = ShopSettings()
        db.add(settings)
        db.commit()
        db.refresh(settings)
    return templates.TemplateResponse(
        "settings.html",
        {"request": request, "settings": settings, "active_page": "settings"},
    )