# Sarthi AI

Sarthi AI is a full-stack, multi-agent decision intelligence platform for community health and environmental decision support. It combines live telemetry, guideline-based reasoning, and explainable AI to help citizens and public agencies make safer, faster decisions.

## Why this project matters

Sarthi AI brings together three core capabilities:
- Live environmental intelligence for AQI, temperature, and rainfall
- Health guidance grounded in WHO, ICMR, and CPCB standards
- An explainable chat experience that shows which agents and data sources were used

## What the system does

- Routes user queries through a chief coordinator agent
- Invokes specialized health and environment sub-agents
- Uses RAG over guideline documents for evidence-backed answers
- Presents results through a modern Next.js frontend and FastAPI backend

## Project structure

- backend: FastAPI service, agent orchestration, database, and RAG logic
- frontend: Next.js app for dashboard, chat, health, and environment views
- data: guideline documents and sample datasets

## Tech stack

- Backend: FastAPI, SQLAlchemy, Pydantic, Uvicorn
- Frontend: Next.js, React, TypeScript
- AI/data: Gemini APIs, OpenAQ, Open-Meteo, local RAG ingestion

## Local setup

### 1. Backend

```bash
cd backend
python -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt

# Optional for local compatibility
$env:PROTOCOL_BUFFERS_PYTHON_IMPLEMENTATION="python"

uvicorn app.main:app --host 127.0.0.1 --port 8000
```

The backend will automatically initialize the database, seed sample data, and ingest guidelines on startup.

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

Open the app at http://localhost:3000 or the next assigned port.

## Environment variables

Create a backend .env file with values such as:

```env
GEMINI_API_KEY=your_key_here
OPENAQ_API_KEY=your_key_here
ENV=development
```

## Deployment

The backend is configured for Render deployment with a Render web service using:

```bash
cd backend && uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

## Demo flow

1. Open the dashboard to view live AQI, temperature, and weather insights.
2. Use the chat experience to ask health or environment questions.
3. Review the reasoning chain to see which agents and sources contributed to the answer.
4. Explore the health and environment pages for more structured decision support.

## Notes

- Environmental data is live where available through OpenAQ and Open-Meteo.
- Health and guideline responses are grounded in local RAG-backed reference documents.
- Gemini-based generation can gracefully fall back to deterministic mock logic when the API is unavailable.
