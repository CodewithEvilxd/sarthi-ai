from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.schemas import ChatRequest, ChatResponse
import app.agents.chief_agent as chief_agent

router = APIRouter(prefix="/api", tags=["chat"])

@router.post("/chat", response_model=ChatResponse)
async def chat_endpoint(req: ChatRequest, db: Session = Depends(get_db)):
    if not req.query.strip():
        raise HTTPException(status_code=400, detail="Query cannot be empty")
    try:
        response = await chief_agent.run(req.query, db)
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
