from sqlalchemy.orm import Session
from app.services.gemini_service import generate_text
import app.agents.health_patient_agent as health_patient_agent
import app.agents.environment_personal_agent as environment_personal_agent
import json
import asyncio
import re


def _is_general_chat(query: str) -> bool:
    q = query.strip().lower()
    if not q:
        return False
    greetings = {
        "hi", "hello", "hey", "hey there", "hi there", "hello there", "good morning",
        "good afternoon", "good evening", "thanks", "thank you", "bye", "bye!",
        "how are you", "what can you do", "who are you", "help", "help me"
    }
    if q in greetings:
        return True
    if re.fullmatch(r"(?:hi|hello|hey|thanks|thank you|bye)(?:[.!? ,'-]*)", q):
        return True
    return False


def analyze_query(query: str) -> dict:
    """
    Analyze the query and return routing decisions for the chat agent.
    """
    if _is_general_chat(query):
        return {
            "domains": [],
            "reason": "Recognized a general greeting or open-ended chat.",
            "extracted_city": "None"
        }

    classification_prompt = f"""
    You are the Chief Coordinator for Sarthi AI.
    Analyze the user query: "{query}"
    Identify if it pertains to "health" (symptoms, blood pressure, platelets, RAG guidelines), 
    "environment" (weather, AQI, outdoor safety, cities like Patna, Delhi, Mumbai, Bengaluru), 
    or "both".
    
    Return ONLY a valid JSON string (no markdown, no ```json formatting) matching this schema:
    {{
        "domains": ["health"] or ["environment"] or ["health", "environment"],
        "reason": "Brief explanation for the routing decision.",
        "extracted_city": "Delhi" or "Patna" or "Mumbai" or "Bengaluru" or "None"
    }}
    """

    routing_decision = generate_text(classification_prompt)
    try:
        text = routing_decision.strip()
        if text.startswith("```json"):
            text = text[7:]
        if text.endswith("```"):
            text = text[:-3]
        text = text.strip()
        decision_data = json.loads(text)
    except Exception as e:
        print(f"Chief Agent classification failed: {e}. Defaulting routing.")
        q_lower = query.lower()
        domains = []
        city = "None"
        for c in ["delhi", "patna", "mumbai", "bengaluru"]:
            if c in q_lower:
                city = c.capitalize()

        if "aqi" in q_lower or "air" in q_lower or "weather" in q_lower or "rain" in q_lower or city != "None":
            domains.append("environment")
        if "bp" in q_lower or "symptom" in q_lower or "pressure" in q_lower or "platelet" in q_lower or "dengue" in q_lower or "health" in q_lower:
            domains.append("health")

        if not domains:
            domains = ["health"]

        decision_data = {
            "domains": domains,
            "reason": "Determined via heuristic keywords.",
            "extracted_city": city
        }

    return {
        "domains": decision_data.get("domains", ["health"]),
        "reason": decision_data.get("reason", "Analyzed query keywords."),
        "extracted_city": decision_data.get("extracted_city", "None")
    }


def is_generic_answer(answer: str) -> bool:
    normalized = (answer or "").lower().strip()
    generic_signals = [
        "welcome to sarthi ai",
        "i am sarthi",
        "ask me something specific",
        "please verify your sensor feeds",
        "let me know if you need",
        "i have analyzed your query",
        "defaulting routing",
        "chief decision intelligence coordinator",
    ]
    return any(signal in normalized for signal in generic_signals) or len(normalized) < 40


def build_fallback_answer(sub_responses: dict) -> str:
    parts = []
    if sub_responses.get("health"):
        parts.append(f"Health Assessment:\n{sub_responses['health']}")
    if sub_responses.get("environment"):
        parts.append(f"Environment Monitoring:\n{sub_responses['environment']}")
    if parts:
        return "\n\n".join(parts)
    return "I could not generate a detailed answer from the sub-agents. Please ask a more specific health or environment question."


async def run(query: str, db: Session) -> dict:
    """
    Chief Decision Agent: Classifies query domains, invokes corresponding sub-agents,
    and returns a combined answer with an audit trail (agent_trace).
    """
    trace = []
    sources = []

    if _is_general_chat(query):
        return {
            "answer": "Hello! I’m Sarthi, your decision-support assistant. I can help with health questions, AQI and weather checks, outdoor safety, and community disease trends. Ask me something specific and I’ll route it to the right agent.",
            "agent_trace": [{
                "agent_name": "Chief Decision Agent",
                "reason": "Recognized a general greeting or open-ended chat.",
                "decision": "Responded with a friendly introduction instead of routing to a specialist agent."
            }],
            "sources": []
        }

    decision_data = analyze_query(query)
    domains_routed = decision_data["domains"]
    routing_reason = decision_data["reason"]
    extracted_city = decision_data["extracted_city"]

    trace.append({
        "agent_name": "Chief Decision Agent",
        "reason": "Classified user query topic.",
        "decision": f"Routed to: {', '.join(domains_routed)}. Reasoning: {routing_reason}"
    })

    sub_responses = {}
    tasks = []
    
    # 2. Invoke Sub-agents
    if "health" in domains_routed:
        trace.append({
            "agent_name": "Health Patient Agent",
            "reason": "Triggered to assess symptoms/vitals and retrieve medical guidelines.",
            "decision": "Executing RAG lookup and patient advice generation."
        })
        async def run_health():
            health_res = await health_patient_agent.run(query, db)
            sub_responses["health"] = health_res.get("answer", "")
            if health_res.get("sources"):
                sources.extend(health_res["sources"])
        tasks.append(run_health())
            
    if "environment" in domains_routed:
        city = str(extracted_city) if extracted_city != "None" else "Patna"
        trace.append({
            "agent_name": "Personal Environment Agent",
            "reason": f"Triggered to pull live AQI & weather sensors for {city}.",
            "decision": "Querying local OpenAQ and Open-Meteo services."
        })
        async def run_env():
            env_res = await environment_personal_agent.run(city)
            sub_responses["environment"] = f"Environment data for {city}: AQI is {env_res.get('aqi')} ({env_res.get('category')}). Temperature: {env_res.get('temperature')}°C. Recommendations: {', '.join(env_res.get('recommendations', []))}"
        tasks.append(run_env())
        
    if tasks:
        await asyncio.gather(*tasks)
        
    # 3. Consolidate responses
    consolidated_prompt = f"""
    You are Sarthi's Chief Decision Intelligence Agent.
    Summarize and merge the following sub-agent inputs into a unified, user-friendly, cohesive final answer.
    
    USER QUERY:
    {query}
    
    SUB-AGENT ANSWERS:
    {json.dumps(sub_responses, indent=2)}
    
    Make sure you preserve all critical facts (such as CPCB categories, AQI levels, blood pressure classifications, or safety recommendations).
    Do NOT include a "Why" section here, as the sub-agents' reasoning is already captured in Sarthi's explainability UI.
    """
    
    final_answer = generate_text(consolidated_prompt)
    if is_generic_answer(final_answer):
        final_answer = build_fallback_answer(sub_responses)

    return {
        "answer": final_answer,
        "agent_trace": trace,
        "sources": list(set(sources))
    }
