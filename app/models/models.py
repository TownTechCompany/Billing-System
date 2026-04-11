from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.db.session import Base

class Product(Base):
    __tablename__ = "product"
    id       = Column(Integer, primary_key=True, index=True)
    name     = Column(String(100), nullable=False)
    category = Column(String(50), nullable=False)
    price    = Column(Float, nullable=False)
    image    = Column(String(200), default="placeholder.png")

    def to_dict(self):
        return {"id": self.id, "name": self.name, "category": self.category,
                "price": self.price, "image": self.image}

class Order(Base):
    __tablename__ = "order"
    id             = Column(Integer, primary_key=True, index=True)
    order_number   = Column(String(20), unique=True, nullable=False)
    date_created   = Column(DateTime, default=datetime.utcnow)
    total_amount   = Column(Float, nullable=False)
    payment_method = Column(String(20), default="Cash")
    items          = relationship("OrderItem", backref="order", lazy=True, cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "id": self.id,
            "order_number": self.order_number,
            "date_created": self.date_created.strftime("%Y-%m-%d %H:%M:%S"),
            "total_amount": self.total_amount,
            "payment_method": self.payment_method,
            "item_count": len(self.items),
        }

class OrderItem(Base):
    __tablename__ = "order_item"
    id           = Column(Integer, primary_key=True, index=True)
    order_id     = Column(Integer, ForeignKey("order.id"), nullable=False)
    product_id   = Column(Integer, ForeignKey("product.id"), nullable=True)
    product_name = Column(String(100), nullable=False)
    quantity     = Column(Integer, nullable=False)
    price        = Column(Float, nullable=False)
