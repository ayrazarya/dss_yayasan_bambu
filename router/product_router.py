from fastapi import APIRouter, Depends, HTTPException
from typing import List
from sqlalchemy.orm import Session

from schemas.product_schema import ProductSchema, ProductCreateSchema, ProductUpdateSchema
from controllers import product_controller
from utils.database import get_db
from utils.sheets_service import SheetService
from dependencies.auth import get_current_admin  # Validasi token admin

router = APIRouter()

# ✅ GET all products (admin only)
@router.get("/", response_model=List[ProductSchema])
def get_products(
    db: Session = Depends(get_db),
    current_admin=Depends(get_current_admin)
):
    return product_controller.get_all_products(db)

# ✅ GET product by ID (admin only)
@router.get("/{product_id}", response_model=ProductSchema)
def get_product(
    product_id: int,
    db: Session = Depends(get_db),
    current_admin=Depends(get_current_admin)
):
    return product_controller.get_product_by_id(product_id, db)

# ✅ CREATE new product (admin only)
@router.post("/", response_model=ProductSchema)
def create_product(
    product: ProductCreateSchema,
    db: Session = Depends(get_db),
    current_admin=Depends(get_current_admin)
):
    return product_controller.create_product(product, db)

# ✅ UPDATE product (admin only)
@router.put("/{product_id}", response_model=ProductSchema)
def update_product(
    product_id: int,
    product: ProductUpdateSchema,
    db: Session = Depends(get_db),
    current_admin=Depends(get_current_admin)
):
    return product_controller.update_product(product_id, product, db)

# ✅ DELETE product (admin only)
@router.delete("/{product_id}")
def delete_product(
    product_id: int,
    db: Session = Depends(get_db),
    current_admin=Depends(get_current_admin)
):
    return product_controller.delete_product(product_id, db)

# ✅ Check Google Sheet ID validity (admin only)
@router.get("/api/survey/check-id/{spreadsheet_id}")
def check_form_id_valid(
    spreadsheet_id: str,
    current_admin=Depends(get_current_admin)
):
    try:
        service = SheetService()
        spreadsheet = service.client.open_by_key(spreadsheet_id)
        worksheet = spreadsheet.get_worksheet(0)
        if worksheet:
            return {"valid": True}
        raise HTTPException(status_code=404, detail="Worksheet not found")
    except Exception:
        raise HTTPException(status_code=404, detail="Invalid spreadsheet ID or no access")
