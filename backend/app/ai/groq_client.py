from groq import Groq
from app.config import settings

client = Groq(api_key=settings.groq_api_key)


async def generate_commentary(event_data: dict) -> str:
    prompt = f"""You are a live sports commentator. Generate ONE exciting, punchy commentary sentence (max 20 words) for this sports event update.

Sport: {event_data.get('sport')}
Match: {event_data.get('home_team')} vs {event_data.get('away_team')}
Score: {event_data.get('home_score')} - {event_data.get('away_score')}
Latest update: {event_data.get('latest_update', 'Game in progress')}

Respond with ONLY the commentary sentence. No quotes, no labels."""

    response = client.chat.completions.create(
        model="llama-3.1-8b-instant",
        messages=[{"role": "user", "content": prompt}],
        max_tokens=60,
        temperature=0.8,
    )
    return response.choices[0].message.content.strip()


async def generate_groq_prediction(event_data: dict) -> dict:
    prompt = f"""You are a sports analyst. Based on this match data, predict the outcome in 2 sentences maximum.

Sport: {event_data.get('sport')}
Match: {event_data.get('home_team')} vs {event_data.get('away_team')}
Current Score: {event_data.get('home_score')} - {event_data.get('away_score')}
Status: {event_data.get('status')}

Respond with JSON only: {{"prediction": "your prediction", "confidence": 0.0 to 1.0}}"""

    response = client.chat.completions.create(
        model="llama-3.1-8b-instant",
        messages=[{"role": "user", "content": prompt}],
        max_tokens=100,
        temperature=0.5,
    )
    import json
    text = response.choices[0].message.content.strip()
    try:
        return json.loads(text)
    except Exception:
        return {"prediction": text, "confidence": 0.5}