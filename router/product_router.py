from fastapi import APIRouter, Depends, HTTPException
from typing import List
from sqlalchemy.orm import Session

from schemas.product_schema import ProductSchema, ProductCreateSchema, ProductUpdateSchema
from controllers import product_controller
from utils.database import get_db
from utils.sheets_service import SheetService

router = APIRouter()

@router.get("/", response_model=List[ProductSchema])
def get_products(db: Session = Depends(get_db)):
    return product_controller.get_all_products(db)

@router.get("/{product_id}", response_model=ProductSchema)
def get_product(product_id: int, db: Session = Depends(get_db)):
    return product_controller.get_product_by_id(product_id, db)

@router.post("/", response_model=ProductSchema)
def create(product: ProductCreateSchema, db: Session = Depends(get_db)):  # <-- ganti di sini
    return product_controller.create_product(product, db)

@router.put("/{product_id}", response_model=ProductSchema)
def update(product_id: int, product: ProductUpdateSchema, db: Session = Depends(get_db)):
    return product_controller.update_product(product_id, product, db)

@router.delete("/{product_id}")
def delete(product_id: int, db: Session = Depends(get_db)):
    return product_controller.delete_product(product_id, db)


#checking sruvey response from database
@router.get("/api/survey/check-id/{spreadsheet_id}")
def check_form_id_valid(spreadsheet_id: str):
    try:
        service = SheetService()
        spreadsheet = service.client.open_by_key(spreadsheet_id)
        worksheet = spreadsheet.get_worksheet(0)
        if worksheet:
            return {"valid": True}
        raise HTTPException(status_code=404, detail="Worksheet not found")
    except Exception as e:
        raise HTTPException(status_code=404, detail="Invalid spreadsheet ID or no access")