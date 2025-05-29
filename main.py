from itertools import product

from sqlalchemy import text
from fastapi import FastAPI, Depends
from sqlalchemy.orm import Session
from starlette.middleware.cors import CORSMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse
from starlette.staticfiles import StaticFiles

from router import vikor_router, admin_router, product_router, user_router

from utils.database import Base, engine, get_db

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Ganti jika frontend jalan di port berbeda
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Inisialisasi database
Base.metadata.create_all(bind=engine)

# Include the router with a prefix
app.include_router(vikor_router.router, prefix="/vikor", tags=["vikor"])

app.include_router(admin_router.router, prefix="/admin", tags=["admin"])

app.include_router(product_router.router, prefix="/products", tags=["product"])

app.include_router(user_router.router, prefix="/users", tags=["user"])


app.mount("/template", StaticFiles(directory="template"), name="template")


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    import traceback
    trace = traceback.format_exc()  # Ambil traceback
    print(f"Error occurred: {trace}")  # Cetak traceback di konsol
    return JSONResponse(
        status_code=500,
        content={
            "detail": str(exc),
            "trace": trace
        },
    )


@app.get("/check-db")
def check_database_connection(db: Session = Depends(get_db)):
    try:
        db.execute(text("SELECT 1"))
        return {"status": "success", "message": "Database connected successfully."}
    except Exception as e:
        return {"status": "error", "message": str(e)}