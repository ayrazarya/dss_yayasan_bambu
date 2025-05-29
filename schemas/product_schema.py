from datetime import datetime
from typing import Optional
from pydantic import BaseModel, validator


class ProductCreateSchema(BaseModel):
    name: str
    description: Optional[str] = None
    development_cost: float
    production_cost_per_unit: float
    status: Optional[str] = None

    @validator("status")
    def validate_status(cls, v):
        allowed = {"calon", "disetujui", "ditolak"}
        if v is not None and v.lower() not in allowed:
            raise ValueError(f"status must be one of {allowed}")
        return v.lower() if v else v




class ProductSchema(ProductCreateSchema):
    product_id: int
    created_at: Optional[datetime]
    updated_at: Optional[datetime]

    class Config:
        orm_mode = True
