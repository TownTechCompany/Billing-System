from pathlib import Path
from datetime import datetime
from fastapi import APIRouter, Request, Depends, HTTPException
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.models import Product
from app.services.order_service import OrderService
from app.ttutils.logwritter import LogWriter
log_writer_ = LogWriter()

router = APIRouter()
APP_ROOT = Path(__file__).resolve().parents[3]
templates = Jinja2Templates(directory=str(APP_ROOT / "templates"))

@router.get("/dashboard", response_class=HTMLResponse)
async def dashboard(request: Request, start_date: str = None, end_date: str = None, db: Session = Depends(get_db)):
    try:
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
    except Exception as e:
        log_writer_.log_exception("Pages", "dashboard", e)
        raise HTTPException(500, "Error loading dashboard")

@router.get("/pos", response_class=HTMLResponse)
async def pos(request: Request, db: Session = Depends(get_db)):
    try:
        products = db.query(Product).all()
        categories = sorted(set(p.category for p in products))
        return templates.TemplateResponse("pos.html", {
            "request": request, "active_page": "pos",
            "products": products, "categories": categories,
        })
    except Exception as e:
        log_writer_.log_exception("Pages", "pos", e)
        raise HTTPException(500, "Error loading POS")

@router.get("/products", response_class=HTMLResponse)
async def products_page(request: Request):
    try:
        return templates.TemplateResponse("products.html", {"request": request, "active_page": "products"})
    except Exception as e:
        log_writer_.log_exception("Pages", "products_page", e)
        raise HTTPException(500, "Error loading products page")

@router.get("/orders", response_class=HTMLResponse)
async def orders_page(request: Request):
    try:
        return templates.TemplateResponse("orders.html", {"request": request, "active_page": "orders"})
    except Exception as e:
        log_writer_.log_exception("Pages", "orders_page", e)
        raise HTTPException(500, "Error loading orders page")

@router.get("/", response_class=HTMLResponse)
async def login_page(request: Request):
    return templates.TemplateResponse("login.html", {"request": request})
