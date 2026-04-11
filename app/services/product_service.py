from sqlalchemy.orm import Session
from app.models.models import Product

class ProductService:
    def __init__(self, db: Session):
        self.db = db

    def list_all(self):
        return self.db.query(Product).all()

    def get(self, product_id: int):
        return self.db.query(Product).filter(Product.id == product_id).first()

    def create(self, name: str, category: str, price: float, image: str = "placeholder.png"):
        p = Product(name=name, category=category, price=price, image=image)
        self.db.add(p); self.db.commit(); self.db.refresh(p)
        return p

    def update(self, product_id: int, **kwargs):
        p = self.get(product_id)
        if not p:
            return None
        for k, v in kwargs.items():
            if v is not None:
                setattr(p, k, v)
        self.db.commit(); self.db.refresh(p)
        return p

    def delete(self, product_id: int):
        p = self.get(product_id)
        if not p:
            return False
        self.db.delete(p); self.db.commit()
        return True
