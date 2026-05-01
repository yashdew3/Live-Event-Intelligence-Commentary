from fastapi import APIRouter, Depends, HTTPException, Query, status
from motor.motor_asyncio import AsyncIOMotorDatabase
from typing import List, Optional

from app.database import get_database
from app.auth.dependencies import get_current_user
from app.events.models import EventOut, PipelineStageOut, SubscribeResponse
from app.events.service import get_event_stages, initialize_pipeline_stages

router = APIRouter()


@router.get("", response_model=List[EventOut])
async def list_events(
    sport: Optional[str] = Query(None),
    event_status: Optional[str] = Query(None, alias="status"),
    db: AsyncIOMotorDatabase = Depends(get_database),
    current_user: dict = Depends(get_current_user),
):
    query = {}
    if sport:
        query["sport"] = sport
    if event_status:
        query["status"] = event_status

    cursor = db["events"].find(query).sort("date", -1).limit(100)
    events = []
    user_subs = set(current_user.get("subscriptions", []))
    async for event in cursor:
        event["is_subscribed"] = event["event_id"] in user_subs
        events.append(EventOut(**event))
    return events

@router.get("/predictions/model-accuracy")
async def get_model_accuracy(
    db: AsyncIOMotorDatabase = Depends(get_database),
    current_user: dict = Depends(get_current_user),
):
    final_events_cursor = db["events"].find({"status": "Final"})
    final_events = []
    async for ev in final_events_cursor:
        final_events.append(ev)

    if not final_events:
        return {
            "groq": {"total": 0, "correct": 0, "accuracy": 0.0},
            "gemini": {"total": 0, "correct": 0, "accuracy": 0.0},
            "better_model": "tie",
            "events_analyzed": 0,
        }

    groq_correct = 0
    groq_total = 0
    gemini_correct = 0
    gemini_total = 0

    for event in final_events:
        event_id = event["event_id"]
        home_score = event.get("home_score", 0)
        away_score = event.get("away_score", 0)

        if home_score > away_score:
            actual_winner = event["home_team"]
        elif away_score > home_score:
            actual_winner = event["away_team"]
        else:
            actual_winner = "Draw"

        groq_pred = await db["groq_predictions"].find_one(
            {"event_id": event_id}, sort=[("created_at", -1)]
        )
        if groq_pred:
            groq_total += 1
            prediction_text = groq_pred.get("prediction", "").lower()
            if actual_winner.lower() in prediction_text or "draw" in prediction_text and actual_winner == "Draw":
                groq_correct += 1

        gemini_analysis = await db["gemini_analyses"].find_one(
            {"event_id": event_id}, sort=[("created_at", -1)]
        )
        if gemini_analysis:
            gemini_total += 1
            prediction_text = gemini_analysis.get("prediction", "").lower()
            if actual_winner.lower() in prediction_text or "draw" in prediction_text and actual_winner == "Draw":
                gemini_correct += 1

    groq_accuracy = round(groq_correct / groq_total, 2) if groq_total > 0 else 0.0
    gemini_accuracy = round(gemini_correct / gemini_total, 2) if gemini_total > 0 else 0.0

    if groq_accuracy > gemini_accuracy:
        better_model = "groq"
    elif gemini_accuracy > groq_accuracy:
        better_model = "gemini"
    else:
        better_model = "tie"

    return {
        "groq": {"total": groq_total, "correct": groq_correct, "accuracy": groq_accuracy},
        "gemini": {"total": gemini_total, "correct": gemini_correct, "accuracy": gemini_accuracy},
        "better_model": better_model,
        "events_analyzed": len(final_events),
    }


@router.get("/{event_id}", response_model=EventOut)
async def get_event(
    event_id: str,
    db: AsyncIOMotorDatabase = Depends(get_database),
    current_user: dict = Depends(get_current_user),
):
    event = await db["events"].find_one({"event_id": event_id})
    if not event:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")
    event["is_subscribed"] = event_id in set(current_user.get("subscriptions", []))
    return EventOut(**event)


@router.get("/{event_id}/stages", response_model=List[PipelineStageOut])
async def get_stages(
    event_id: str,
    db: AsyncIOMotorDatabase = Depends(get_database),
    current_user: dict = Depends(get_current_user),
):
    stages = await get_event_stages(event_id, db)
    if not stages:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No pipeline stages found for this event")
    return [PipelineStageOut(**s) for s in stages]


@router.post("/{event_id}/subscribe", response_model=SubscribeResponse)
async def subscribe_event(
    event_id: str,
    db: AsyncIOMotorDatabase = Depends(get_database),
    current_user: dict = Depends(get_current_user),
):
    event = await db["events"].find_one({"event_id": event_id})
    if not event:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")

    subs = current_user.get("subscriptions", [])
    if event_id in subs:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Already subscribed to this event")

    if current_user.get("role") == "viewer" and len(subs) >= 3:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Viewers can subscribe to maximum 3 events. Upgrade to Analyst for unlimited subscriptions.",
        )

    from bson import ObjectId
    await db["users"].update_one(
        {"_id": ObjectId(current_user["id"])},
        {"$push": {"subscriptions": event_id}},
    )
    await initialize_pipeline_stages(event_id, db)
    return SubscribeResponse(message="Subscribed successfully", event_id=event_id, subscriptions_count=len(subs) + 1)


@router.delete("/{event_id}/subscribe")
async def unsubscribe_event(
    event_id: str,
    db: AsyncIOMotorDatabase = Depends(get_database),
    current_user: dict = Depends(get_current_user),
):
    from bson import ObjectId
    await db["users"].update_one(
        {"_id": ObjectId(current_user["id"])},
        {"$pull": {"subscriptions": event_id}},
    )
    return {"message": "Unsubscribed successfully", "event_id": event_id}

@router.get("/{event_id}/analysis")
async def get_latest_analysis(
    event_id: str,
    db: AsyncIOMotorDatabase = Depends(get_database),
    current_user: dict = Depends(get_current_user),
):
    analysis = await db["gemini_analyses"].find_one(
        {"event_id": event_id}, sort=[("created_at", -1)]
    )
    if not analysis:
        raise HTTPException(status_code=404, detail="No analysis available yet")
    analysis["id"] = str(analysis["_id"])
    del analysis["_id"]
    return analysis


@router.get("/{event_id}/predictions")
async def get_event_predictions(
    event_id: str,
    db: AsyncIOMotorDatabase = Depends(get_database),
    current_user: dict = Depends(get_current_user),
):
    groq_pred = await db["groq_predictions"].find_one(
        {"event_id": event_id}, sort=[("created_at", -1)]
    )
    gemini_analysis = await db["gemini_analyses"].find_one(
        {"event_id": event_id}, sort=[("created_at", -1)]
    )

    return {
        "event_id": event_id,
        "groq": {
            "prediction": groq_pred.get("prediction") if groq_pred else None,
            "confidence": groq_pred.get("confidence") if groq_pred else None,
            "model": "llama-3.1-8b-instant",
            "generated_at": groq_pred.get("created_at").isoformat() if groq_pred and groq_pred.get("created_at") else None,
        } if groq_pred else None,
        "gemini": {
            "prediction": gemini_analysis.get("prediction") if gemini_analysis else None,
            "confidence": gemini_analysis.get("confidence") if gemini_analysis else None,
            "trend": gemini_analysis.get("trend") if gemini_analysis else None,
            "model": "gemini-2.5-flash",
            "generated_at": gemini_analysis.get("created_at").isoformat() if gemini_analysis and gemini_analysis.get("created_at") else None,
        } if gemini_analysis else None,
    }