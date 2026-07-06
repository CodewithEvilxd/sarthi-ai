from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from app.db.database import get_db, Complaint
from app.models.schemas import ComplaintResponse
from app.services.gemini_service import generate_text
from app.services.prompt_utils import compact_prompt, short_system_instruction
import app.services.vision_service as vision_service
from typing import Optional, List, cast
import json
import os
import datetime

router = APIRouter(prefix="/api/complaints", tags=["complaints"])

@router.post("", response_model=ComplaintResponse)
async def submit_complaint(
    description: str = Form(...),
    file: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db)
):
    if not description.strip():
        raise HTTPException(status_code=400, detail="Description cannot be empty")
        
    image_path = None
    
    # Save file if uploaded
    if file and file.filename:
        try:
            os.makedirs("uploads", exist_ok=True)
            timestamp = datetime.datetime.now().strftime("%Y%m%d%H%M%S")
            filename = f"{timestamp}_{file.filename}"
            filepath = os.path.join("uploads", filename)
            contents = await file.read()
            with open(filepath, "wb") as f:
                f.write(contents)
            image_path = filepath
        except Exception as file_ex:
            print(f"Failed to save uploaded file: {file_ex}")

    # Use Gemini to classify the complaint text
    classification_prompt = f"""
    You are an AI citizen complaint dispatcher. Classify the following description:
    "{description}"
    
    Categorize the complaint into one of: Sanitation, Water Quality, Air Pollution, Vector Control, General.
    Rate the severity: Low, Medium, High, Critical.
    Suggest routing to one of: Municipal Waste Department, Water Supply Board, Pollution Control Board, Public Health Inspectorate.
    
    Provide your classification as a valid JSON object ONLY (no markdown, no ```json formatting):
    {{
        "category": "Category",
        "severity": "Severity",
        "suggested_routing": "Suggested Routing Department",
        "why": "Explain why this was routed here, referencing key problem keywords in the description."
    }}
    """
    
    compacted = compact_prompt(classification_prompt)
    response = generate_text(compacted, system_instruction=short_system_instruction("chief"))
    try:
        text = response.strip()
        if text.startswith("```json"):
            text = text[7:]
        if text.endswith("```"):
            text = text[:-3]
        text = text.strip()
        data = json.loads(text)
    except Exception as e:
        print(f"Failed to parse complaint classification JSON: {e}")
        # Heuristic fallbacks
        desc_lower = description.lower()
        category = "General"
        severity = "Medium"
        routing = "Municipal Department"
        why = "Classified via keyword-based routing matching."
        
        if "garbage" in desc_lower or "trash" in desc_lower or "sewage" in desc_lower or "drain" in desc_lower:
            category = "Sanitation"
            severity = "High"
            routing = "Municipal Waste Department"
            why = "Routed to Municipal Waste Department due to references to waste, sewage or drainage systems."
        elif "water" in desc_lower or "dirty" in desc_lower or "supply" in desc_lower:
            category = "Water Quality"
            severity = "High"
            routing = "Water Supply Board"
            why = "Routed to Water Supply Board due to complaints of drinking water quality."
        elif "smoke" in desc_lower or "smog" in desc_lower or "air" in desc_lower or "dust" in desc_lower:
            category = "Air Pollution"
            severity = "Medium"
            routing = "Pollution Control Board"
            why = "Routed to Pollution Control Board due to air pollution/dust observations."
        elif "mosquito" in desc_lower or "dengue" in desc_lower or "standing water" in desc_lower:
            category = "Vector Control"
            severity = "Critical"
            routing = "Public Health Inspectorate"
            why = "Routed to Public Health Inspectorate due to high dengue risk from standing water and vector breeding."
            
        data = {
            "category": category,
            "severity": severity,
            "suggested_routing": routing,
            "why": why
        }

    # Save to SQLite db
    complaint = Complaint(
        description=description,
        category=data.get("category", "General"),
        severity=data.get("severity", "Medium"),
        suggested_routing=data.get("suggested_routing", "Municipal Department"),
        why=data.get("why", ""),
        image_path=image_path
    )
    
    db.add(complaint)
    db.commit()
    db.refresh(complaint)
    
    return ComplaintResponse(
        id=cast(int, complaint.id),
        description=cast(str, complaint.description),
        category=cast(str, complaint.category),
        severity=cast(str, complaint.severity),
        suggested_routing=cast(str, complaint.suggested_routing),
        why=cast(str, complaint.why),
        created_at=str(complaint.created_at)
    )

@router.get("", response_model=List[ComplaintResponse])
async def list_complaints(db: Session = Depends(get_db)):
    try:
        complaints = db.query(Complaint).order_by(Complaint.created_at.desc()).all()
        return [
            ComplaintResponse(
                id=cast(int, c.id),
                description=cast(str, c.description),
                category=cast(str, c.category),
                severity=cast(str, c.severity),
                suggested_routing=cast(str, c.suggested_routing),
                why=cast(str, c.why),
                created_at=str(c.created_at)
            ) for c in complaints
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

