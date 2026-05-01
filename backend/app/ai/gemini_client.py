import google.generativeai as genai
import json
from app.config import settings

genai.configure(api_key=settings.gemini_api_key)
model = genai.GenerativeModel("gemini-2.5-flash")


async def generate_analysis(event_data: dict, event_stream: list) -> dict:
    stream_text = json.dumps(event_stream[-50:], indent=2, default=str)

    prompt = f"""You are a professional sports analyst AI. Analyze this live sports event data and return a structured JSON analysis.

EVENT INFO:
Sport: {event_data.get('sport')}
Match: {event_data.get('home_team')} vs {event_data.get('away_team')}
Score: {event_data.get('home_score')} - {event_data.get('away_score')}
Status: {event_data.get('status')}
Venue: {event_data.get('venue')}

RECENT EVENT STREAM (last 50 updates):
{stream_text}

Return ONLY valid JSON with this exact structure:
{{
  "updated_summary": "2-3 sentence summary of what is happening",
  "key_moments": ["moment 1", "moment 2", "moment 3", "moment 4", "moment 5"],
  "trend": "momentum" or "stable" or "reversal",
  "prediction": "Who will win and why in 2 sentences",
  "confidence": 0.0 to 1.0
}}"""

    response = model.generate_content(prompt)
    text = response.text.strip()

    if text.startswith("```"):
        text = text.split("```")[1]
        if text.startswith("json"):
            text = text[4:]
    text = text.strip()

    try:
        result = json.loads(text)
        if result["trend"] not in ["momentum", "stable", "reversal"]:
            result["trend"] = "stable"
        result["confidence"] = max(0.0, min(1.0, float(result["confidence"])))
        return result
    except Exception:
        return {
            "updated_summary": "Analysis in progress for this event.",
            "key_moments": ["Game underway", "Teams competing", "Score developing"],
            "trend": "stable",
            "prediction": f"{event_data.get('home_team')} and {event_data.get('away_team')} in a close contest.",
            "confidence": 0.5,
        }


async def generate_post_event_report(event_data: dict, full_history: list, predictions: list) -> dict:
    history_text = json.dumps(full_history[-100:], indent=2, default=str)

    prompt = f"""You are a sports journalist. Write a complete post-event report for this finished match.

MATCH: {event_data.get('home_team')} vs {event_data.get('away_team')}
SPORT: {event_data.get('sport')}
FINAL SCORE: {event_data.get('home_score')} - {event_data.get('away_score')}
VENUE: {event_data.get('venue')}

FULL EVENT HISTORY:
{history_text}

Return ONLY valid JSON:
{{
  "narrative_summary": "3-4 paragraph narrative of the entire match",
  "top_5_key_moments": ["moment 1", "moment 2", "moment 3", "moment 4", "moment 5"],
  "prediction_accuracy_score": 0.0 to 1.0,
  "winning_team": "team name or Draw",
  "match_rating": "1-10 rating of how exciting this match was",
  "model_performance": {{
    "groq_accuracy": 0.0 to 1.0,
    "gemini_accuracy": 0.0 to 1.0,
    "better_model": "groq or gemini"
  }}
}}"""

    response = model.generate_content(prompt)
    text = response.text.strip()
    if text.startswith("```"):
        text = text.split("```")[1]
        if text.startswith("json"):
            text = text[4:]
    text = text.strip()

    try:
        return json.loads(text)
    except Exception:
        return {
            "narrative_summary": f"A competitive match between {event_data.get('home_team')} and {event_data.get('away_team')} concluded with a final score of {event_data.get('home_score')}-{event_data.get('away_score')}.",
            "top_5_key_moments": ["Match concluded", "Final whistle blown", "Teams shook hands"],
            "prediction_accuracy_score": 0.5,
            "winning_team": event_data.get("home_team") if event_data.get("home_score", 0) > event_data.get("away_score", 0) else event_data.get("away_team"),
            "match_rating": "7",
            "model_performance": {"groq_accuracy": 0.5, "gemini_accuracy": 0.5, "better_model": "gemini"},
        }