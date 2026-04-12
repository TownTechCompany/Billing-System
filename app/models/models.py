from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy import Text
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
    id             = Column(Integer, primary_key=True)
    order_number   = Column(String(20), unique=True, nullable=False)
    date_created   = Column(DateTime, default=datetime.utcnow)
    total_amount   = Column(Float, nullable=False)
    payment_method = Column(String(20), default="Cash")
    
    # ── NEW COLUMNS ──
    status         = Column(String(20), default="open")     # open | paid | void
    order_type     = Column(String(20), default="dine-in")  # dine-in | takeaway | delivery
    table_number   = Column(Integer, nullable=True)
    customer_name  = Column(String(100), nullable=True)
    customer_phone = Column(String(20), nullable=True)
    discount       = Column(Float, default=0.0)
    notes          = Column(String(500), nullable=True)
    served_by      = Column(String(100), nullable=True)     # staff name
    
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

class ShopSettings(Base):
    __tablename__ = "shop_settings"
 
    id            = Column(Integer, primary_key=True, default=1)
    shop_name     = Column(String(100), default="My Shop")
    shop_tagline  = Column(String(200), nullable=True)
    shop_address  = Column(Text, nullable=True)
    shop_phone    = Column(String(30), nullable=True)
    shop_email    = Column(String(100), nullable=True)
    gstin         = Column(String(20), nullable=True)
    cgst          = Column(Float, default=2.5)
    sgst          = Column(Float, default=2.5)
    tax_inclusive = Column(Integer, default=0)   # 0=False, 1=True
    round_total   = Column(Integer, default=1)
    currency      = Column(String(5), default="₹")
    primary_color = Column(String(10), default="#3498db")
    upi_id        = Column(String(100), nullable=True)
    thank_you_msg = Column(String(300), default="Thank you for visiting!")
    receipt_footer = Column(String(500), nullable=True)
    paper_width   = Column(String(10), default="80")
    admin_pin     = Column(String(10), default="1234")
    date_format   = Column(String(20), default="DD/MM/YYYY")
    enable_tables = Column(Integer, default=1)
    table_count   = Column(Integer, default=10)
    allow_discount = Column(Integer, default=1)
    max_discount  = Column(Float, default=20.0)
 
    def to_dict(self):
        return {c.name: getattr(self, c.name) for c in self.__table__.columns}