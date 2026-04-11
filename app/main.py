from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from app.api.v1.api import router as api_router
from app.db.session import Base, engine
from app.db.seed import seed_database

Base.metadata.create_all(bind=engine)
seed_database()

app = FastAPI(title="BillPOS", version="2.0.0")
app.mount("/static", StaticFiles(directory="app/static"), name="static")
app.include_router(api_router)
