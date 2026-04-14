from sqlalchemy import Column, Integer, String, Float
from app.db.session import Base

class Product(Base):
    __tablename__ = "product"
    id       = Column(Integer, primary_key=True, index=True)
    name     = Column(String(100), nullable=False)
    category = Column(String(50), nullable=False)
    price    = Column(Float, nullable=False)
    image    = Column(String(200), default="placeholder.png")

    def to_dict(self):
        return {
            "id": self.id, 
            "name": self.name, 
            "category": self.category,
            "price": self.price, 
            "image": self.image
        }
