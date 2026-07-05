from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.schemas import EnvCurrentResponse, EnvForecastResponse
import app.agents.environment_personal_agent as environment_personal_agent
import app.agents.environment_community_agent as environment_community_agent

router = APIRouter(prefix="/api/environment", tags=["environment"])

@router.get("/current", response_model=EnvCurrentResponse)
async def get_current_environment(city: str):
    try:
        result = await environment_personal_agent.run(city)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/forecast", response_model=EnvForecastResponse)
async def get_environment_forecast(city: str, db: Session = Depends(get_db)):
    try:
        result = await environment_community_agent.run(city, db)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
