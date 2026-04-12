from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from starlette.middleware.sessions import SessionMiddleware  # ✅ ADD THIS

from app.api.v1.api import router as api_router
from app.db.session import Base, engine
from app.db.seed import seed_database

Base.metadata.create_all(bind=engine)
seed_database()

app = FastAPI(title="BillPOS", version="2.0.0")

app.add_middleware(
    SessionMiddleware,
    secret_key="kx8XzFvXbG9KpY9q5Wm3Xc8V9QnZl2W6R0dYwFhTj8A=",
)

app.mount("/static", StaticFiles(directory="app/static"), name="static")
app.include_router(api_router)