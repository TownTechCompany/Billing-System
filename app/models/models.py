from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from app.db.session import Base

class Customer(Base):
    __tablename__ = "customer"
    id       = Column(Integer, primary_key=True, index=True)
    first_name = Column(String(50), unique=True, nullable=False, index=True)
    last_name = Column(String(50), unique=True, nullable=False, index=True)
    email    = Column(String(100), unique=True, nullable=False, index=True)
    customer_type = Column(String(20))
    password = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    created_on = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    updated_on = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "first_name": self.first_name,
            "last_name": self.last_name,
            "email": self.email,
            "customer_type": self.customer_type,
            "full_name": f"{self.first_name} {self.last_name}",
            "is_active": self.is_active,
            "created_at": self.created_at.isoformat(),
            "created_on": self.created_on.isoformat(),
            "updated_at": self.updated_at.isoformat(),
            "updated_on": self.updated_on.isoformat(),
        }

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
