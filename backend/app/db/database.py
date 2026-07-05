from sqlalchemy import create_engine, Column, Integer, String, Float, Text, DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import datetime

def get_utc_now():
    return datetime.datetime.now(datetime.timezone.utc).replace(tzinfo=None)

from app.config import settings

DATABASE_URL = settings.database_url
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql+pg8000://", 1)
elif DATABASE_URL.startswith("postgresql://") and "+pg8000" not in DATABASE_URL:
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+pg8000://", 1)

connect_args = {}
if DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}
else:
    if "sslmode" in DATABASE_URL or "ssl" in DATABASE_URL:
        import ssl
        if "?" in DATABASE_URL:
            DATABASE_URL = DATABASE_URL.split("?")[0]
        ssl_context = ssl.create_default_context()
        # NeonDB might use self-signed certs or AWS certificate verification,
        # but a default context is standard and secures connection.
        connect_args["ssl_context"] = ssl_context

engine = create_engine(DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class Complaint(Base):
    __tablename__ = "complaints"
    id = Column(Integer, primary_key=True, index=True)
    description = Column(Text, nullable=False)
    category = Column(String, default="General")
    severity = Column(String, default="Medium")
    suggested_routing = Column(String, default="Municipal Department")
    why = Column(Text, default="")
    image_path = Column(String, nullable=True)
    created_at = Column(DateTime, default=get_utc_now)

class DiseaseData(Base):
    __tablename__ = "disease_data"
    id = Column(Integer, primary_key=True, index=True)
    ward = Column(String, index=True)
    week = Column(String)  # e.g., "Week 1", "Week 2"
    cases = Column(Integer)
    rainfall_mm = Column(Float)

class AQIHistory(Base):
    __tablename__ = "aqi_history"
    id = Column(Integer, primary_key=True, index=True)
    city = Column(String, index=True)
    date = Column(String)  # e.g., "2026-06-29"
    aqi = Column(Float)

class RAGDocument(Base):
    __tablename__ = "rag_documents"
    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String)
    chunk_text = Column(Text)
    embedding = Column(Text)  # JSON-serialized list of floats

def init_db():
    Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
