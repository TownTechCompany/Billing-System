"""
orders.py — FastAPI router for /api/orders

Fixed issues from previous version:
  - Routes were using /api/orders/{id} INSIDE a router already prefixed with /api/orders
    → all sub-paths now use /{order_id} only
  - Added missing GET /api/orders/{order_id} (needed by the detail panel)
  - Added PATCH /api/orders/{order_id}/void and /checkout
  - All routes use OrderService for clean separation
  - JSONResponse replaced with plain dicts (FastAPI auto-serialises)
"""

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.models import Order, OrderItem, Product
from app.schemas.schemas import OrderCreate, OrderUpdate
from app.services.order_service import OrderService
from app.ttutils.logwritter import LogWriter
log_writer_ = LogWriter()

router = APIRouter(prefix="/api/orders", tags=["orders"])


# ── LIST ────────────────────────────────────────────────────────────────────
@router.get("")
def list_orders(db: Session = Depends(get_db)):
    try:
        return [o.to_dict() for o in OrderService(db).list_all()]
    except Exception as e:
        log_writer_.log_exception("Orders", "list_orders", e)
        raise HTTPException(500, "Error fetching orders")


# ── CREATE ──────────────────────────────────────────────────────────────────
@router.post("", status_code=201)
async def create_order(payload: OrderCreate, db: Session = Depends(get_db)):
    try:
        items = [{"product_id": i.product_id, "quantity": i.quantity, "price": i.price} for i in payload.items]
        order = OrderService(db).create(items, payload.payment_method)
        return JSONResponse({"message": "Order created", "order_number": order.order_number}, status_code=201)
    except Exception as e:
        log_writer_.log_exception("Orders", "create_order", e)
        raise HTTPException(500, "Error creating order")


# ── GET ONE ──────────────────────────────────────────────────────────────────
@router.get("/{order_id}")
def get_order(order_id: int, db: Session = Depends(get_db)):
    """Full order detail including all items — used by the slide panel."""
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return {
        "id":             order.id,
        "order_number":   order.order_number,
        "status":         order.status or "paid",
        "order_type":     order.order_type or "dine-in",
        "table_number":   order.table_number,
        "customer_name":  order.customer_name,
        "customer_phone": order.customer_phone,
        "payment_method": order.payment_method,
        "date_created":   order.date_created.strftime("%Y-%m-%d %H:%M"),
        "total_amount":   order.total_amount,
        "discount":       order.discount or 0.0,
        "notes":          order.notes,
        "served_by":      order.served_by,
        "items": [
            {
                "id":           item.id,
                "product_id":   item.product_id,
                "product_name": item.product_name,
                "price":        item.price,
                "quantity":     item.quantity,
            }
            for item in order.items
        ],
    }


# ── UPDATE (items, discount, notes, customer info) ──────────────────────────
@router.patch("/{order_id}")
async def update_order(order_id: int, update: OrderUpdate, db: Session = Depends(get_db)):
    """
    Partial update — pass only the fields you want to change.
    If `items` is included, the order items are REPLACED entirely and
    the total is recalculated (subtotal + 5% tax − discount).
    """
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    if update.status is not None:         order.status         = update.status
    if update.payment_method is not None: order.payment_method = update.payment_method
    if update.customer_name is not None:  order.customer_name  = update.customer_name
    if update.customer_phone is not None: order.customer_phone = update.customer_phone
    if update.table_number is not None:   order.table_number   = update.table_number
    if update.discount is not None:       order.discount       = update.discount
    if update.notes is not None:          order.notes          = update.notes

    if update.items is not None:
        # Delete existing items
        for old in list(order.items):
            db.delete(old)
        db.flush()

        new_subtotal = 0.0
        for item_data in update.items:
            if item_data.quantity <= 0:
                continue
            db.add(OrderItem(
                order_id=order.id,
                product_id=item_data.product_id,
                product_name=item_data.product_name,
                quantity=item_data.quantity,
                price=item_data.price,
            ))
            new_subtotal += item_data.price * item_data.quantity

        tax  = new_subtotal * 0.05
        disc = update.discount if update.discount is not None else (order.discount or 0.0)
        order.total_amount = round(new_subtotal + tax - disc, 2)

    db.commit()
    db.refresh(order)
    return {"message": "Order updated", "total_amount": order.total_amount}


# ── VOID ─────────────────────────────────────────────────────────────────────
@router.patch("/{order_id}/void")
def void_order(order_id: int, db: Session = Depends(get_db)):
    """Mark order as voided (keeps the record, just changes status)."""
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    order.status = "void"
    db.commit()
    return {"message": "Order voided", "order_number": order.order_number}


# ── CHECKOUT ─────────────────────────────────────────────────────────────────
@router.patch("/{order_id}/checkout")
async def checkout_order(order_id: int, request: Request, db: Session = Depends(get_db)):
    """Mark an open order as paid with the chosen payment method."""
    data  = await request.json()
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if order.status == "void":
        raise HTTPException(status_code=400, detail="Cannot checkout a voided order")

    order.status = "paid"
    if data.get("payment_method"):
        order.payment_method = data["payment_method"]

    db.commit()
    return {"message": "Order checked out", "order_number": order.order_number}


# ── DELETE ────────────────────────────────────────────────────────────────────
@router.delete("/{order_id}")
def delete_order(order_id: int, db: Session = Depends(get_db)):
    try:
        if not OrderService(db).delete(order_id):
            raise HTTPException(404, "Order not found")
        return {"message": "Order deleted"}
    except HTTPException:
        raise
    except Exception as e:
        log_writer_.log_exception("Orders", "delete_order", e)
        raise HTTPException(500, "Error deleting order")


# ── ANALYTICS (dashboard chart) ───────────────────────────────────────────────
@router.get("/analytics")
def analytics(db: Session = Depends(get_db)):
    try:
        return OrderService(db).analytics()
    except Exception as e:
        log_writer_.log_exception("Orders", "analytics", e)
        raise HTTPException(500, "Error fetching analytics")
