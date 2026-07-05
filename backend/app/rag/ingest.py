import os
import json
from sqlalchemy.orm import Session
from app.db.database import RAGDocument, SessionLocal, init_db
from app.services.gemini_service import get_embedding

def chunk_text(text: str, chunk_size: int = 600) -> list:
    paragraphs = text.split("\n\n")
    chunks = []
    current_chunk = ""
    for para in paragraphs:
        para = para.strip()
        if not para:
            continue
        if len(current_chunk) + len(para) <= chunk_size:
            current_chunk += para + "\n\n"
        else:
            if current_chunk:
                chunks.append(current_chunk.strip())
            current_chunk = para + "\n\n"
    if current_chunk:
        chunks.append(current_chunk.strip())
    return chunks

def ingest_guidelines():
    db = SessionLocal()
    try:
        # Check if already ingested to avoid re-embedding on every reload
        if db.query(RAGDocument).count() > 0:
            print("Guidelines already ingested. Skipping RAG ingestion.")
            return

        # Build absolute path to data/guidelines
        base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        guidelines_dir = os.path.join(base_dir, "data", "guidelines")
        
        if not os.path.exists(guidelines_dir):
            print(f"Guidelines directory {guidelines_dir} not found.")
            return

        for filename in os.listdir(guidelines_dir):
            if filename.endswith(".txt"):
                filepath = os.path.join(guidelines_dir, filename)
                with open(filepath, "r", encoding="utf-8") as f:
                    text = f.read()
                
                chunks = chunk_text(text)
                print(f"Ingesting {filename} ({len(chunks)} chunks)...")
                
                for chunk in chunks:
                    emb = get_embedding(chunk, is_query=False)
                    doc = RAGDocument(
                        filename=filename,
                        chunk_text=chunk,
                        embedding=json.dumps(emb)
                    )
                    db.add(doc)
                db.commit()
        print("Guidelines ingestion complete.")
    except Exception as e:
        db.rollback()
        print(f"Error during ingestion: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    init_db()
    ingest_guidelines()
