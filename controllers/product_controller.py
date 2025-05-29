from fastapi import HTTPException
from sqlalchemy.orm import Session
from models.product import Product
from schemas.product_schema import ProductSchema, ProductCreateSchema
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

def update_product(product_id: int, product: ProductSchema, db: Session):
    existing_product = db.query(Product).filter(Product.product_id == product_id).first()
    if not existing_product:
        raise HTTPException(status_code=404, detail="Product not found")

    existing_product.name = product.name
    existing_product.description = product.description
    existing_product.development_cost = product.development_cost
    existing_product.production_cost_per_unit = product.production_cost_per_unit
    existing_product.status = product.status
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
