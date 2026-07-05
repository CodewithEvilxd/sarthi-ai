from fastapi import FastAPI, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os
from contextlib import asynccontextmanager

from app.db.database import init_db
from app.db.seed_data import seed_database
from app.rag.ingest import ingest_guidelines
from app.routers import chat, health, environment, complaints

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Initializing Database...")
    init_db()
    print("Seeding Sample Data...")
    seed_database()
    print("Ingesting Health/AQI Guidelines for RAG...")
    ingest_guidelines()
    print("Sarthi AI Backend Started Successfully.")
    yield

app = FastAPI(
    title="Sarthi AI — Unified Community Decision Intelligence Platform",
    description="FastAPI Backend for Health + Environment Agent Decision Intelligence",
    version="1.0.0",
    lifespan=lifespan
)

# CORS configuration
cors_origins = [
    "http://localhost:3000", "http://127.0.0.1:3000",
    "http://localhost:3001", "http://127.0.0.1:3001",
    "http://localhost:3002", "http://127.0.0.1:3002",
    "https://sarthi-ai-rose.vercel.app",
    "https://www.sarthi-ai-rose.vercel.app",
]
extra_origins = os.getenv("CORS_ORIGINS", "")
if extra_origins:
    cors_origins.extend([origin.strip() for origin in extra_origins.split(",") if origin.strip()])

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Ensure uploads directory exists and mount it
os.makedirs("uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

app.include_router(chat.router)
app.include_router(health.router)
app.include_router(environment.router)
app.include_router(complaints.router)

@app.get("/favicon.ico", include_in_schema=False)
def favicon():
    return Response(status_code=204)

@app.get("/")
def read_root():
    return {"status": "healthy", "service": "Sarthi AI Decision Engine"}
