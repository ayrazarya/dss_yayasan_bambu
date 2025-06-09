from fastapi import HTTPException
from sqlalchemy.orm import Session
from models.product import Product
from schemas.product_schema import ProductSchema, ProductCreateSchema, ProductUpdateSchema
from datetime import datetime


def get_all_products(db: Session):
    return db.query(Product).all()


def get_product_by_id(product_id: int, db: Session):
    product = db.query(Product).filter(Product.product_id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product


def create_product(product: ProductCreateSchema, db: Session):  # gunakan tipe ini
    new_product = Product(
        name=product.name,
        description=product.description,
        development_cost=product.development_cost,
        production_cost_per_unit=product.production_cost_per_unit,
        status=product.status,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    db.add(new_product)
    db.commit()
    db.refresh(new_product)
    return new_product

def update_product(product_id: int, product: ProductUpdateSchema, db: Session):
    existing_product = db.query(Product).filter(Product.product_id == product_id).first()
    if not existing_product:
        raise HTTPException(status_code=404, detail="Product not found")

    # Update hanya field yang disediakan (exclude_unset=True penting!)
    for key, value in product.dict(exclude_unset=True).items():
        setattr(existing_product, key, value)

    existing_product.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(existing_product)
    return existing_product



def delete_product(product_id: int, db: Session):
    product = db.query(Product).filter(Product.product_id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    db.delete(product)
    db.commit()
    return {"message": "Product deleted successfully"}
