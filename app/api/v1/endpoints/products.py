import os
from fastapi import APIRouter, Depends, HTTPException, File, Form, UploadFile, Request
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from werkzeug.utils import secure_filename
from app.db.session import get_db
from app.services.product_service import ProductService
from app.core.config import settings

router = APIRouter(prefix="/api/products", tags=["products"])

os.makedirs(settings.upload_folder, exist_ok=True)

@router.get("")
def list_products(db: Session = Depends(get_db)):
    svc = ProductService(db)
    return [p.to_dict() for p in svc.list_all()]

@router.post("", status_code=201)
async def create_product(
    name: str = Form(...), category: str = Form(...), price: float = Form(...),
    image: UploadFile = File(None), db: Session = Depends(get_db)
):
    image_path = "https://via.placeholder.com/150"
    if image and image.filename:
        filename = secure_filename(image.filename)
        dest = os.path.join(settings.upload_folder, filename)
        with open(dest, "wb") as f:
            f.write(await image.read())
        image_path = f"/static/uploads/{filename}"
    p = ProductService(db).create(name, category, price, image_path)
    return JSONResponse({"message": "Product added!", "product": p.to_dict()}, status_code=201)

@router.put("/{product_id}")
async def update_product(product_id: int, request: Request, db: Session = Depends(get_db)):
    svc = ProductService(db)
    content_type = request.headers.get("content-type", "")
    kwargs = {}
    if "multipart/form-data" in content_type or "application/x-www-form-urlencoded" in content_type:
        form = await request.form()
        kwargs["name"] = form.get("name")
        kwargs["category"] = form.get("category")
        raw_price = form.get("price")
        if raw_price: kwargs["price"] = float(raw_price)
        file = form.get("image")
        if file and hasattr(file, "filename") and file.filename:
            filename = secure_filename(file.filename)
            dest = os.path.join(settings.upload_folder, filename)
            with open(dest, "wb") as f:
                f.write(await file.read())
            kwargs["image"] = f"/static/uploads/{filename}"
    else:
        data = await request.json()
        kwargs = {k: v for k, v in data.items() if v is not None}
    p = svc.update(product_id, **kwargs)
    if not p:
        raise HTTPException(404, "Product not found")
    return {"message": "Product updated", "product": p.to_dict()}

@router.delete("/{product_id}")
def delete_product(product_id: int, db: Session = Depends(get_db)):
    if not ProductService(db).delete(product_id):
        raise HTTPException(404, "Product not found")
    return {"message": "Product deleted"}
