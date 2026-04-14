from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.db.session import Base

class Order(Base):
    __tablename__ = "order"
    id             = Column(Integer, primary_key=True)
    order_number   = Column(String(20), unique=True, nullable=False)
    date_created   = Column(DateTime, default=datetime.utcnow)
    total_amount   = Column(Float, nullable=False)
    payment_method = Column(String(20), default="Cash")
    
    status         = Column(String(20), default="open")     # open | paid | void
    order_type     = Column(String(20), default="dine-in")  # dine-in | takeaway | delivery
    table_number   = Column(Integer, nullable=True)
    customer_name  = Column(String(100), nullable=True)
    customer_phone = Column(String(20), nullable=True)
    discount       = Column(Float, default=0.0)
    notes          = Column(String(500), nullable=True)
    served_by      = Column(String(100), nullable=True)
    
    items = relationship("OrderItem", backref="order", lazy=True, cascade="all, delete-orphan")
    
    def to_dict(self):
        return {
            "id":             self.id,
            "order_number":   self.order_number,
            "date_created":   self.date_created.strftime("%Y-%m-%d %H:%M:%S"),
            "total_amount":   self.total_amount,
            "payment_method": self.payment_method,
            "status":         self.status or "paid",
            "order_type":     self.order_type or "dine-in",
            "table_number":   self.table_number,
            "customer_name":  self.customer_name,
            "customer_phone": self.customer_phone,
            "discount":       self.discount or 0.0,
            "notes":          self.notes,
            "served_by":      self.served_by,
            "item_count":     len(self.items),
        }

class OrderItem(Base):
    __tablename__ = "order_item"
    id           = Column(Integer, primary_key=True, index=True)
    order_id     = Column(Integer, ForeignKey("order.id"), nullable=False)
    product_id   = Column(Integer, ForeignKey("product.id"), nullable=True)
    product_name = Column(String(100), nullable=False)
    quantity     = Column(Integer, nullable=False)
    price        = Column(Float, nullable=False)
