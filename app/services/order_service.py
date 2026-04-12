from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime
from app.models.models import Order, OrderItem, Product


class OrderService:
    def __init__(self, db: Session):
        self.db = db

    def list_all(self):
        return self.db.query(Order).order_by(Order.date_created.desc()).all()

    def get(self, order_id: int):
        return self.db.query(Order).filter(Order.id == order_id).first()

    def create(
        self,
        items: list,
        payment_method: str = "Cash",
        order_type: str = "dine-in",
        table_number: int = None,
        customer_name: str = None,
        customer_phone: str = None,
        notes: str = None,
    ):
        order_num  = f"ORD-{int(datetime.utcnow().timestamp())}"
        subtotal   = sum(i["price"] * i["quantity"] for i in items)
        tax        = subtotal * 0.05
        total      = round(subtotal + tax, 2)

        order = Order(
            order_number=order_num,
            total_amount=total,
            payment_method=payment_method,
            status="open",               # NEW: all orders start as open
            order_type=order_type,
            table_number=table_number,
            customer_name=customer_name,
            customer_phone=customer_phone,
            notes=notes,
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

    def delete(self, order_id: int):
        o = self.get(order_id)
        if not o:
            return False
        self.db.delete(o)
        self.db.commit()
        return True

    def analytics(self):
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

    def dashboard_metrics(self, start=None, end=None):
        q = self.db.query(Order)
        if start and end:
            q = q.filter(Order.date_created.between(start, end))
        orders = q.all()
        return {
            "total_orders":   len(orders),
            "total_revenue":  sum(o.total_amount for o in orders),
            "recent_orders":  q.order_by(Order.date_created.desc()).limit(5).all(),
        }