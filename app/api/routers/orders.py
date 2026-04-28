from fastapi import APIRouter, Depends, Request, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.schemas.order_schema import OrderCreate, OrderUpdate, CheckoutRequest
from app.services.order_service import OrderService
from app.utils.responses import success_response

router = APIRouter(tags=["orders"])

@router.get("/get-orders")
def list_orders(db: Session = Depends(get_db)):
    """List all orders"""
    orders = OrderService(db).list_all_service()
    return success_response(
        data=[o.to_dict() for o in orders],
        message="Orders fetched successfully"
    )

@router.post("/create-order", status_code=status.HTTP_201_CREATED)
async def create_order(payload: OrderCreate, request: Request, db: Session = Depends(get_db)):
    """Create new order"""
    items = [{"product_id": i.product_id, "quantity": i.quantity, "price": i.price} for i in payload.items]
    
    # Get current user email from session for served_by
    served_by = request.session.get("email")
    
    order = OrderService(db).create_order_service(
        items, 
        payload.payment_method,
        order_type=payload.order_type,
        table_number=payload.table_number,
        served_by=served_by or payload.served_by,
        date_created=payload.date_created
    )
    return success_response(
        data={"order_number": order.order_number},
        message="Order created successfully",
        status_code=status.HTTP_201_CREATED
    )

# NOTE: /analytics/data MUST be registered before /{order_id}
# to prevent FastAPI matching "analytics" as an integer order_id.
@router.get("/analytics/data")
def analytics(db: Session = Depends(get_db)):
    """Order analytics"""
    data = OrderService(db).analytics_service()
    return success_response(data=data, message="Analytics fetched successfully")

@router.get("/get-order-detail/{order_id}")
def get_order(order_id: int, db: Session = Depends(get_db)):
    """Get order detail"""
    order = OrderService(db).get_order_service(order_id)
    return success_response(
        data={
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
        },
        message="Order details fetched successfully"
    )

@router.patch("/update-order/{order_id}")
async def update_order(order_id: int, payload: OrderUpdate, db: Session = Depends(get_db)):
    """Partial update order"""
    items = None
    if payload.items is not None:
        items = [{"product_id": i.product_id, "product_name": i.product_name, "quantity": i.quantity, "price": i.price} for i in payload.items]
    
    order = OrderService(db).update_order_service(
        order_id, 
        payload.dict(exclude={'items'}, exclude_unset=True),
        items=items
    )
    return success_response(
        data={"total_amount": order.total_amount},
        message="Order updated successfully"
    )

@router.patch("/void-order/{order_id}")
def void_order(order_id: int, db: Session = Depends(get_db)):
    """Void order"""
    order = OrderService(db).void_order_service(order_id)
    return success_response(
        data={"order_number": order.order_number},
        message="Order voided successfully"
    )

@router.patch("/checkout-order/{order_id}")
async def checkout_order(order_id: int, payload: CheckoutRequest, db: Session = Depends(get_db)):
    """Checkout order"""
    order = OrderService(db).checkout_order_service(order_id, payload.payment_method)
    return success_response(
        data={"order_number": order.order_number},
        message="Order checked out successfully"
    )

@router.delete("/delete-order/{order_id}")
def delete_order(order_id: int, db: Session = Depends(get_db)):
    """Delete order"""
    OrderService(db).delete_order_service(order_id)
    return success_response(message="Order deleted successfully")
