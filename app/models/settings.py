from sqlalchemy import Column, Integer, String, Float, Text
from app.db.session import Base

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
