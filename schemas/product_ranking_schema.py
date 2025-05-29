from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class ProductRankingSchema(BaseModel):
    product_id: int
    score: float
    rank: int
    evaluated_at: datetime
    name: Optional[str] = None  # Jika kamu ingin sertakan nama produk

    class Config:
        orm_mode = True
