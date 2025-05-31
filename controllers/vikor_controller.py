from sqlalchemy.orm import Session
from models import Product, ProductRanking
from utils.vikor_helper import VikorHelper
from datetime import datetime

class VikorController:
    def __init__(self, db: Session):
        self.db = db

    def _calculate_sales_score(self, product):
        return sum(txn.quantity for mp in product.marketed_products for txn in mp.transactions) #Ini ngakses produk yang udah dirilis lewat calon produk baru??

    def _calculate_survey_score(self, product: Product):
    #    ratings = [s.rating for s in product.surveys if s.rating is not None] // survey sudah tidak memiliki rating tapi di survey_response
        return 1 #sum(ratings) / len(ratings) if ratings else 0.0 // perlu dipastikan data respon survey terbaru sebelum dijalankan

    def calculate_rankings(self):
        products = self.db.query(Product).all()

        data = []
        for p in products:
            data.append({
                "name": p.name,
                "product_id": p.product_id,
                "C1": float(p.development_cost),
                "C2": float(p.production_cost_per_unit),
                "C3": self._calculate_sales_score(p),
                "C4": self._calculate_survey_score(p),
            })

        vikor = VikorHelper(data)  # Tidak perlu input weights & types
        result = vikor.calculate()

        self.db.query(ProductRanking).delete()
        self.db.commit()

        for i, r in enumerate(result):
            self.db.add(ProductRanking(
                product_id=r['product_id'],
                score=r['Q'],
                rank=i + 1,
                evaluated_at=datetime.now()
            ))

        self.db.commit()
        return result
