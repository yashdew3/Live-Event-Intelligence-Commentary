from datetime import datetime
from typing import Optional
from motor.motor_asyncio import AsyncIOMotorDatabase

STAGE_NAMES = {
    1: "Event Ingestion",
    2: "Stream Accumulation",
    3: "Groq Commentary",
    4: "Gemini Flash Analysis",
    5: "Redis Pub/Sub Publish",
    6: "WebSocket Push",
    7: "Alert Rule Evaluation",
    8: "Post-Event Report",
}


async def initialize_pipeline_stages(event_id: str, db: AsyncIOMotorDatabase):
    existing = await db["pipeline_stages"].find_one({"event_id": event_id})
    if existing:
        return
    stages = []
    for stage_num in range(1, 9):
        stages.append({
            "event_id": event_id,
            "stage_number": stage_num,
            "stage_name": STAGE_NAMES[stage_num],
            "status": "pending",
            "started_at": None,
            "completed_at": None,
        })
    await db["pipeline_stages"].insert_many(stages)


async def update_pipeline_stage(
    event_id: str,
    stage_number: int,
    status: str,
    db: AsyncIOMotorDatabase,
    error_message: Optional[str] = None,
):
    update_data: dict = {"status": status}
    if status == "active":
        update_data["started_at"] = datetime.utcnow()
    elif status in ("done", "failed"):
        update_data["completed_at"] = datetime.utcnow()
    if error_message:
        update_data["error_message"] = error_message

    await db["pipeline_stages"].update_one(
        {"event_id": event_id, "stage_number": stage_number},
        {"$set": update_data},
    )


async def get_event_stages(event_id: str, db: AsyncIOMotorDatabase):
    cursor = db["pipeline_stages"].find({"event_id": event_id}).sort("stage_number", 1)
    stages = []
    async for stage in cursor:
        stage["_id"] = str(stage["_id"])
        stages.append(stage)
    return stages


async def append_to_event_stream(event_id: str, update_data: dict, db: AsyncIOMotorDatabase):
    update_data["event_id"] = event_id
    update_data["timestamp"] = datetime.utcnow()
    await db["event_stream"].insert_one(update_data)

    count = await db["event_stream"].count_documents({"event_id": event_id})
    if count > 50:
        oldest = await db["event_stream"].find_one(
            {"event_id": event_id}, sort=[("timestamp", 1)]
        )
        if oldest:
            await db["event_stream"].delete_one({"_id": oldest["_id"]})


async def get_event_stream(event_id: str, db: AsyncIOMotorDatabase, limit: int = 50):
    cursor = db["event_stream"].find({"event_id": event_id}).sort("timestamp", -1).limit(limit)
    stream = []
    async for doc in cursor:
        doc["_id"] = str(doc["_id"])
        stream.append(doc)
    return stream