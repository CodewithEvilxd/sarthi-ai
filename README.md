# Sarthi AI — Unified Community Decision Intelligence Platform

Sarthi AI is a full-stack, multi-agent decision intelligence system designed for community health and environmental decision support. It coordinates cooperative domain agents (Health, Environment, and Citizen Services) using a Chief Decision Agent to synthesize explainable, data-grounded recommendations for citizens and municipal administrators.

---

## 🏗️ Multi-Agent Architecture

```
                       +------------------------+
                       |   Citizen User Query   |
                       +------------------------+
                                    |
                                    v (Semantic Classification)
                       +------------------------+
                       |   Chief Agent (Core)   |
                       +------------------------+
                                    |
            +-----------------------+-----------------------+
            | (Live)                | (Live)                | (Roadmap Phase 2)
            v                       v                       v
+-----------------------+ +-----------------------+ +-----------------------+
|  Health Domain Agents  | |  Environment Agents   | | Other Departmental   |
| - Patient RAG Agent   | | - Personal Sensors    | |   Services Agents     |
| - Community Outbreaks | | - Community Forecast  | | (Citizen, Safety, Ed) |
+-----------------------+ +-----------------------+ +-----------------------+
            |                       |                       |
            +-----------------------+-----------------------+
                                    |
                                    v (Synthesized Output)
                       +------------------------+
                       | Explainable AI Response|
                       | & Semantic Citation Tr  |
                       +------------------------+
```

---

## 🚀 Quick Start Guide

### 1. Start the FastAPI Backend
Ensure you are in the `backend` directory, activate the environment, and boot the server on port 8000:
```bash
cd backend

# Create virtual environment if not already initialized
python -m venv .venv
.\.venv\Scripts\activate

# Install dependencies

pip install -r requirements.txt

# Run backend (with Python 3.14 compatibility override)
$env:PROTOCOL_BUFFERS_PYTHON_IMPLEMENTATION="python"
uvicorn app.main:app --host 127.0.0.1 --port 8000
```
*The database is automatically created (`sarthi_ai.db`), seeded with historical records, and RAG guidelines are ingested on startup.*

### 2. Start the Next.js Frontend
In a separate terminal, navigate to the `frontend` folder and boot the Next.js dev server:
```bash
cd frontend
npm install
npm run dev
```
*Open [http://localhost:3000](http://localhost:3000) (or the assigned port, e.g., 3001) in your browser.*

---

## 📊 What's Real vs. Sample Data (Judges Briefing)

*Read this section aloud to judges to showcase software transparency:*
- **Live Environmental Sensor Data (Real)**: Air quality values are shown in two forms: AQI-US for internet-style comparison and CPCB AQI for Indian standards. Temperature and rain levels are pulled directly from Open-Meteo, and AQI is derived from live OpenAQ sensor readings when available, with Open-Meteo air-quality as fallback.
- **WHO / ICMR / CPCB Guidelines (Real)**: The RAG corpus is grounded in official literature including WHO Hypertension Classifications (2023), CPCB Ambient Air Quality safe limits (PM2.5 < 60 µg/m³), and ICMR Dengue reference standards.
- **Disease Surveillance case tracking (Sample/Mocked)**: To respect citizen privacy, ward-level dengue and influenza cases are simulated using a realistic model reflecting dengue case surges following a 7-14 day incubation window after waterlogging events.

---

## 🎙️ 5-Minute Pitch Demo Script

Follow these steps for a polished presentation:

1. **Slide 1: Landing Page (0:00 - 1:00)**
   - *Click on:* `http://localhost:3001/`
   - *Say:* "Welcome to Sarthi AI—One AI for Every Department. Instead of building isolated chatbots, Sarthi utilizes a Chief Agent that semantically routes requests to specialized, cooperative sub-agents. Here is our architecture mapping our live Health and Environment agents and our phase-2 department roadmaps."

2. **Slide 2: Telemetry Dashboard (1:00 - 2:15)**
   - *Click on:* "Launch Dashboard"
   - *Say:* "Here is the active Command Center. If I toggle our station selector to Patna, we pull live sensor telemetry: temperature, rainfall, and current AQI. We can see our Leaflet map rendering city health markers, alongside our 2-day linear regression forecast projecting AQI trends. Below, we see ward disease surveillance showing an outbreak in Ward 3."

3. **Slide 3: Citizen Grievance Portal (2:15 - 3:15)**
   - *Click on:* "Citizen Complaints" tab on the dashboard.
   - *Action:* Type *"Heavy garbage pileup in Patna Ward 3 block, causing severe stagnation and mosquito nesting"* and click "Submit Log".
   - *Say:* "If a citizen reports a sewage leak, Sarthi doesn't just log it—our AI instantly classifies it. In real-time, the complaint is tagged as 'Vector Control' or 'Sanitation', severity marked 'High', and routed directly to the 'Public Health Inspectorate' or 'Municipal Waste Department' with explicit classification reasoning."

4. **Slide 4: Explainable AI Chat (3:15 - 4:15)**
   - *Click on:* "AI Chat" in the navbar.
   - *Action:* Click the suggestion chip *"Is the air quality safe in Patna today?"*.
   - *Say:* "Let's ask Sarthi about air safety. Sarthi responds with CPCB guidelines. But here is the differentiator—our Explainability Trail. If I expand this dropdown, it renders the exact trace of which agents were called (Chief -> Environment) and the exact WHO and CPCB RAG text files cited."

5. **Slide 5: Clinical Diagnostics (4:15 - 5:00)**
   - *Click on:* "Health" in the navbar.
   - *Say:* "Citizens can also upload prescription sheets or lab reports. Using Gemini Vision, Sarthi extracts clinical vitals, matches them against indexed guidelines, and prints plain-language explanations. This completes the loop: enabling explainable, safe decision support from individual patients up to entire municipal wards."
