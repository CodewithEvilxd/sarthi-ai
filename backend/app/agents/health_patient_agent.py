from sqlalchemy.orm import Session
from app.rag.retriever import retrieve_relevant_chunks
from app.services.gemini_service import generate_text

async def run(query: str, db: Session) -> dict:
    """
    Patient Health Agent: Accepts clinical queries, retrieves WHO/ICMR references via RAG,
    and returns explainable health advice.
    """
    chunks = retrieve_relevant_chunks(query, db, top_k=2)
    sources = list(set([c["source"] for c in chunks]))
    
    context = "\n\n".join([f"[Source: {c['source']}]\n{c['text']}" for c in chunks])
    
    prompt = f"""
    You are Sarthi's Patient Health Agent. Provide clear, patient-friendly guidance on the query.
    You MUST ground your response in the reference standards below:
    
    REFERENCE STANDARDS:
    {context}
    
    USER QUERY:
    {query}
    
    Provide your guidance. Your response MUST end with a clear "**Why?**" section detailing 
    which exact guideline parameter, range, or threshold was matched (e.g. WHO blood pressure thresholds, 
    normal platelet range of 150k-450k).
    """
    
    system_instruction = "You are an expert patient-support bot referencing WHO and ICMR standards."
    response = generate_text(prompt, system_instruction=system_instruction)
    
    why_text = "Based on guideline comparisons."
    if "**Why?**" in response:
        why_text = response.split("**Why?**")[1].strip()
    elif "Why:" in response:
        why_text = response.split("Why:")[1].strip()
        
    return {
        "answer": response,
        "why": why_text,
        "sources": sources
    }
