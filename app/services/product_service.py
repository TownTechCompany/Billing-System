from sqlalchemy.orm import Session
from app.models import Product
from app.exceptions.product_exception import ProductException, ProductExceptionCase

class ProductService:
    def __init__(self, db: Session):
        self.db = db

    def list_all_service(self):
        """Get all products"""
        return self.db.query(Product).all()

    def get_product_service(self, product_id: int):
        """Get product by ID"""
        product = self.db.query(Product).filter(Product.id == product_id).first()
        if not product:
            raise ProductException(ProductExceptionCase.PRODUCT_NOT_FOUND)
        return product

    def create_product_service(self, name: str, category: str, price: float, image: str = "placeholder.png"):
        """Create new product"""
        p = Product(name=name, category=category, price=price, image=image)
        self.db.add(p)
        self.db.commit()
        self.db.refresh(p)
        return p

    def update_product_service(self, product_id: int, **kwargs):
        """Update product"""
        p = self.get_product_service(product_id)
        for k, v in kwargs.items():
            if v is not None:
                setattr(p, k, v)
        self.db.commit()
        self.db.refresh(p)
        return p

    def delete_product_service(self, product_id: int):
        """Delete product"""
        p = self.get_product_service(product_id)
        self.db.delete(p)
        self.db.commit()
        return True

    async def save_image_service(self, image, upload_folder):
        """Helper to save uploaded image"""
        import os
        from werkzeug.utils import secure_filename
        if not image or not image.filename:
            return "https://via.placeholder.com/150"
        
        os.makedirs(upload_folder, exist_ok=True)
        filename = secure_filename(image.filename)
        dest = os.path.join(upload_folder, filename)
        with open(dest, "wb") as f:
            f.write(await image.read())
        return f"/static/uploads/{filename}"
