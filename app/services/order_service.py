from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime
from app.models import Order, OrderItem, Product
from app.exceptions.order_exception import OrderException, OrderExceptionCase


class OrderService:
    def __init__(self, db: Session):
        self.db = db

    def list_all_service(self):
        """Get all orders"""
        return self.db.query(Order).order_by(Order.date_created.desc()).all()

    def get_order_service(self, order_id: int):
        """Get order by ID"""
        order = self.db.query(Order).filter(Order.id == order_id).first()
        if not order:
            raise OrderException(OrderExceptionCase.ORDER_NOT_FOUND)
        return order

    def create_order_service(
        self,
        items: list,
        payment_method: str = "Cash",
        order_type: str = "dine-in",
        table_number: int = None,
        customer_name: str = None,
        customer_phone: str = None,
        notes: str = None,
        served_by: str = None,
        date_created: str = None,
    ):
        """Create new order"""
        order_num  = f"ORD-{int(datetime.utcnow().timestamp())}"
        subtotal   = sum(i["price"] * i["quantity"] for i in items)
        tax        = subtotal * 0.05
        total      = round(subtotal + tax, 2)

        # Parse date_created if provided, otherwise use now
        creation_date = datetime.utcnow()
        if date_created:
            try:
                # Expecting ISO format from JS: YYYY-MM-DDTHH:mm:ss.sssZ
                # We'll just take the first 19 chars for YYYY-MM-DD HH:mm:ss
                dt_str = date_created.replace('T', ' ').split('.')[0]
                creation_date = datetime.strptime(dt_str, "%Y-%m-%d %H:%M:%S")
            except Exception:
                creation_date = datetime.utcnow()

        order = Order(
            order_number=order_num,
            date_created=creation_date,
            total_amount=total,
            payment_method=payment_method,
            status="open",               # NEW: all orders start as open
            order_type=order_type,
            table_number=table_number,
            customer_name=customer_name,
            customer_phone=customer_phone,
            notes=notes,
            served_by=served_by,
        )
        self.db.add(order)
        self.db.flush()

        for i in items:
            p = self.db.query(Product).filter(Product.id == i["product_id"]).first()
            self.db.add(OrderItem(
                order_id=order.id,
                product_id=i["product_id"],
                product_name=p.name if p else "Unknown",
                quantity=i["quantity"],
                price=i["price"],
            ))

        self.db.commit()
        self.db.refresh(order)
        return order

    def delete_order_service(self, order_id: int):
        """Delete order"""
        order = self.get_order_service(order_id)
        self.db.delete(order)
        self.db.commit()
        return True

    def analytics_service(self):
        """Get order analytics"""
        rows = (
            self.db.query(
                func.date(Order.date_created).label("date"),
                func.sum(Order.total_amount).label("total"),
            )
            .filter(Order.status == "paid")          # only count paid orders
            .group_by(func.date(Order.date_created))
            .order_by(func.date(Order.date_created))
            .limit(7)
            .all()
        )
        labels = [str(r.date) for r in rows]
        data   = [float(r.total) for r in rows]
        return {
            "labels": labels or ["No Data"],
            "data":   data   or [0],
        }

    def dashboard_metrics_service(self, start=None, end=None):
        """Get dashboard metrics"""
        q = self.db.query(Order)
        if start and end:
            q = q.filter(Order.date_created.between(start, end))
        orders = q.all()
        return {
            "total_orders":   len(orders),
            "total_revenue":  sum(o.total_amount for o in orders),
            "recent_orders":  q.order_by(Order.date_created.desc()).limit(5).all(),
        }

    def update_order_service(self, order_id: int, update_data: dict, items: list = None):
        """Update order details and items"""
        order = self.get_order_service(order_id)
        
        # Update scalar fields
        allowed_fields = ['status', 'payment_method', 'customer_name', 'customer_phone', 'table_number', 'discount', 'notes']
        for key, value in update_data.items():
            if key in allowed_fields and value is not None:
                setattr(order, key, value)
        
        if items is not None:
            # Delete existing items
            for old in list(order.items):
                self.db.delete(old)
            self.db.flush()

            new_subtotal = 0.0
            for item_data in items:
                if item_data.get("quantity", 0) <= 0:
                    continue
                self.db.add(OrderItem(
                    order_id=order.id,
                    product_id=item_data["product_id"],
                    product_name=item_data.get("product_name", "Unknown"),
                    quantity=item_data["quantity"],
                    price=item_data["price"],
                ))
                new_subtotal += item_data["price"] * item_data["quantity"]

            tax  = new_subtotal * 0.05
            disc = update_data.get("discount", order.discount or 0.0)
            order.total_amount = round(new_subtotal + tax - disc, 2)

        self.db.commit()
        self.db.refresh(order)
        return order

    def void_order_service(self, order_id: int):
        """Mark order as void"""
        order = self.get_order_service(order_id)
        order.status = "void"
        self.db.commit()
        self.db.refresh(order)
        return order

    def checkout_order_service(self, order_id: int, payment_method: str = None):
        """Checkout an order"""
        order = self.get_order_service(order_id)
        if order.status == "void":
            raise OrderException(OrderExceptionCase.INVALID_INPUT, "Cannot checkout a voided order")
        
        order.status = "paid"
        if payment_method:
            order.payment_method = payment_method
            
        self.db.commit()
        self.db.refresh(order)
        return order