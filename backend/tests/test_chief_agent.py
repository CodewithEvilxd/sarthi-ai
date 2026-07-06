from app.agents.chief_agent import analyze_query


def test_analyze_query_detects_environment_queries():
    result = analyze_query("What is the AQI in Patna today?")
    assert result["domains"] == ["environment"]
    assert result["extracted_city"] == "Patna"


def test_analyze_query_detects_health_queries():
    result = analyze_query("My blood pressure is 145/95, what should I do?")
    assert result["domains"] == ["health"]
    assert result["extracted_city"] == "None"


def test_analyze_query_detects_both_domains():
    result = analyze_query("Is it safe to go outside in Delhi with my blood pressure 145/95?")
    assert "environment" in result["domains"]
    assert "health" in result["domains"]
