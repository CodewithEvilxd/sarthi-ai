import json
import math
from sqlalchemy.orm import Session
from app.db.database import RAGDocument
from app.services.gemini_service import get_embedding

def dot_product(v1, v2):
    return sum(x * y for x, y in zip(v1, v2))

def magnitude(v):
    return math.sqrt(sum(x * x for x in v))

def cosine_similarity(v1, v2):
    mag1 = magnitude(v1)
    mag2 = magnitude(v2)
    if not mag1 or not mag2:
        return 0.0
    return dot_product(v1, v2) / (mag1 * mag2)

def retrieve_relevant_chunks(query: str, db: Session, top_k: int = 3) -> list:
    """
    Retrieves the top_k most semantically similar guideline chunks for a query.
    Returns a list of dicts: {"text": str, "source": str, "similarity": float}
    """
    try:
        query_emb = get_embedding(query, is_query=True)
        if not query_emb:
            return []

        docs = db.query(RAGDocument).all()
        if not docs:
            return []

        scored_chunks = []
        for doc in docs:
            try:
                doc_emb = json.loads(str(doc.embedding))
                sim = cosine_similarity(query_emb, doc_emb)
                scored_chunks.append({
                    "text": doc.chunk_text,
                    "source": doc.filename,
                    "similarity": sim
                })
            except Exception as inner_ex:
                print(f"Error processing document ID {doc.id}: {inner_ex}")
                continue

        scored_chunks.sort(key=lambda x: x["similarity"], reverse=True)
        return scored_chunks[:top_k]
    except Exception as e:
        print(f"Error retrieving RAG chunks: {e}")
        return []
