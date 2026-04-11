from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.schemas.schemas import OrderCreate
from app.services.order_service import OrderService

router = APIRouter(prefix="/api/orders", tags=["orders"])

@router.get("")
def list_orders(db: Session = Depends(get_db)):
    return [o.to_dict() for o in OrderService(db).list_all()]

@router.post("", status_code=201)
async def create_order(payload: OrderCreate, db: Session = Depends(get_db)):
    items = [{"product_id": i.product_id, "quantity": i.quantity, "price": i.price} for i in payload.items]
    order = OrderService(db).create(items, payload.payment_method)
    return JSONResponse({"message": "Order created", "order_number": order.order_number}, status_code=201)

@router.delete("/{order_id}")
def delete_order(order_id: int, db: Session = Depends(get_db)):
    if not OrderService(db).delete(order_id):
        raise HTTPException(404, "Order not found")
    return {"message": "Order deleted"}

@router.get("/analytics")
def analytics(db: Session = Depends(get_db)):
    return OrderService(db).analytics()
