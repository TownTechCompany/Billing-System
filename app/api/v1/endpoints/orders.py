from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.schemas.schemas import OrderCreate
from app.services.order_service import OrderService
from app.ttutils.logwritter import LogWriter
log_writer_ = LogWriter()

router = APIRouter(prefix="/api/orders", tags=["orders"])

@router.get("")
def list_orders(db: Session = Depends(get_db)):
    try:
        return [o.to_dict() for o in OrderService(db).list_all()]
    except Exception as e:
        log_writer_.log_exception("Orders", "list_orders", e)
        raise HTTPException(500, "Error fetching orders")

@router.post("", status_code=201)
async def create_order(payload: OrderCreate, db: Session = Depends(get_db)):
    try:
        items = [{"product_id": i.product_id, "quantity": i.quantity, "price": i.price} for i in payload.items]
        order = OrderService(db).create(items, payload.payment_method)
        return JSONResponse({"message": "Order created", "order_number": order.order_number}, status_code=201)
    except Exception as e:
        log_writer_.log_exception("Orders", "create_order", e)
        raise HTTPException(500, "Error creating order")

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

@router.get("/analytics")
def analytics(db: Session = Depends(get_db)):
    try:
        return OrderService(db).analytics()
    except Exception as e:
        log_writer_.log_exception("Orders", "analytics", e)
        raise HTTPException(500, "Error fetching analytics")
