from fastapi import APIRouter, Depends, File, Form, UploadFile, Request, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.services.product_service import ProductService
from app.core.config import settings
from app.utils.responses import success_response

router = APIRouter(tags=["products"])

@router.get("")
def list_products(db: Session = Depends(get_db)):
    """List all products"""
    svc = ProductService(db)
    products = svc.list_all_service()
    return success_response(
        data=[p.to_dict() for p in products],
        message="Products fetched successfully"
    )

@router.post("", status_code=status.HTTP_201_CREATED)
async def create_product(
    name: str = Form(...), category: str = Form(...), price: float = Form(...),
    image: UploadFile = File(None), db: Session = Depends(get_db)
):
    """Create new product with optional image"""
    svc = ProductService(db)
    image_path = await svc.save_image_service(image, settings.upload_folder)
    product = svc.create_product_service(name, category, price, image_path)
    return success_response(
        data=product.to_dict(),
        message="Product added successfully",
        status_code=status.HTTP_201_CREATED
    )

@router.put("/{product_id}")
async def update_product(product_id: int, request: Request, db: Session = Depends(get_db)):
    """Update product details or image"""
    svc = ProductService(db)
    content_type = request.headers.get("content-type", "")
    kwargs = {}
    
    if "multipart/form-data" in content_type:
        form = await request.form()
        kwargs["name"] = form.get("name")
        kwargs["category"] = form.get("category")
        raw_price = form.get("price")
        if raw_price: kwargs["price"] = float(raw_price)
        
        file = form.get("image")
        if file and hasattr(file, "filename") and file.filename:
            kwargs["image"] = await svc.save_image_service(file, settings.upload_folder)
    else:
        data = await request.json()
        kwargs = {k: v for k, v in data.items() if v is not None}
        
    product = svc.update_product_service(product_id, **kwargs)
    return success_response(
        data=product.to_dict(),
        message="Product updated successfully"
    )

@router.delete("/{product_id}")
def delete_product(product_id: int, db: Session = Depends(get_db)):
    """Delete product"""
    ProductService(db).delete_product_service(product_id)
    return success_response(message="Product deleted successfully")
