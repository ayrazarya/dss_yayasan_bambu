from sqlalchemy.orm import Session
from models import Product, ProductRanking
from utils.vikor_helper import VikorHelper
from datetime import datetime


class VikorController:
    def __init__(self, db: Session):
        self.db = db

    def _calculate_sales_score(self, product):
        try:
            return sum(txn.quantity for mp in product.marketed_products for txn in mp.transactions)
        except Exception:
            return 0.0

    def _calculate_survey_score(self, product: Product):
        try:
            all_ratings = []
            for survey in product.surveys:
                ratings = [response.rating for response in survey.responses if response.rating is not None]
                all_ratings.extend(ratings)
            return sum(all_ratings) / len(all_ratings) if all_ratings else 0.0
        except Exception:
            return 0.0

    def calculate_rankings(self):
        products = self.db.query(Product).all()

        data = []
        for p in products:
            try:
                sales_score = self._calculate_sales_score(p)
                survey_score = self._calculate_survey_score(p)

                data.append({
                    "name": p.name,
                    "product_id": p.product_id,
                    "C1": float(p.development_cost),
                    "C2": float(p.production_cost_per_unit),
                    "C3": sales_score,
                    "C4": survey_score,
                })
            except Exception as e:
                raise Exception(f"Gagal memproses produk {p.name}: {str(e)}")

        if not data:
            raise Exception("Tidak ada data produk untuk dihitung")

        vikor = VikorHelper(data)
        result = vikor.calculate()

        calculation_time = datetime.now()

        for i, r in enumerate(result):
            self.db.add(ProductRanking(
                product_id=r['product_id'],
                score=r['Q'],
                rank=i + 1,
                evaluated_at=calculation_time  # Menggunakan waktu yang sama untuk satu batch perhitungan
            ))

        self.db.commit()
        return result

    def get_latest_rankings(self):
        """Mendapatkan ranking terbaru berdasarkan evaluated_at"""
        latest_evaluation = self.db.query(ProductRanking.evaluated_at).order_by(
            ProductRanking.evaluated_at.desc()).first()

        if not latest_evaluation:
            return []

        latest_time = latest_evaluation[0]
        rankings = (self.db.query(ProductRanking)
                    .join(Product)
                    .filter(ProductRanking.evaluated_at == latest_time)
                    .order_by(ProductRanking.rank)
                    .all())

        return rankings

    def get_rankings_history(self, limit: int = None):
        """Mendapatkan history semua perhitungan ranking"""
        query = (self.db.query(ProductRanking)
                 .join(Product)
                 .order_by(ProductRanking.evaluated_at.desc(), ProductRanking.rank))

        if limit:
            query = query.limit(limit)

        return query.all()

    def get_rankings_by_date(self, evaluation_date: datetime):
        """Mendapatkan ranking berdasarkan tanggal evaluasi tertentu"""
        rankings = (self.db.query(ProductRanking)
                    .join(Product)
                    .filter(ProductRanking.evaluated_at == evaluation_date)
                    .order_by(ProductRanking.rank)
                    .all())

        return rankings