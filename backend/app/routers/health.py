from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.schemas import HealthReportResponse, HealthCommunityResponse
import app.services.vision_service as vision_service
import app.agents.health_community_agent as health_community_agent

router = APIRouter(prefix="/api/health", tags=["health"])

@router.post("/analyze-report", response_model=HealthReportResponse)
async def analyze_report(file: UploadFile = File(...)):
    if not file.filename:
        raise HTTPException(status_code=400, detail="Uploaded file must have a filename")
        
    contents = await file.read()
    mime = file.content_type or "image/jpeg"
    try:
        result = vision_service.analyze_report_image(contents, mime)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Vision analysis failed: {e}")

@router.get("/community-trend", response_model=HealthCommunityResponse)
async def get_community_trend(ward: str, db: Session = Depends(get_db)):
    try:
        result = await health_community_agent.run(ward, db)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
