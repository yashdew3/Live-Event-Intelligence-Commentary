from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from app.auth.service import decode_token
from app.database import get_database
import json
import asyncio

router = APIRouter()

active_connections: dict[str, list[WebSocket]] = {}
user_connections: dict[str, list[WebSocket]] = {}


async def broadcast_to_event(event_id: str, message: dict):
    connections = active_connections.get(event_id, [])
    disconnected = []
    for ws in connections:
        try:
            await ws.send_json(message)
        except Exception:
            disconnected.append(ws)
    for ws in disconnected:
        if ws in connections:
            connections.remove(ws)


async def broadcast_to_user(user_id: str, message: dict):
    connections = user_connections.get(user_id, [])
    disconnected = []
    for ws in connections:
        try:
            await ws.send_json(message)
        except Exception:
            disconnected.append(ws)
    for ws in disconnected:
        if ws in connections:
            connections.remove(ws)


async def get_catchup_payload(event_id: str, db):
    commentary_cursor = db["commentary"].find(
        {"event_id": event_id}
    ).sort("created_at", -1).limit(10)

    analysis_cursor = db["gemini_analyses"].find(
        {"event_id": event_id}
    ).sort("created_at", -1).limit(5)

    commentary_list = []
    async for doc in commentary_cursor:
        commentary_list.append({
            "type": "commentary",
            "event_id": event_id,
            "commentary": doc.get("commentary_text", ""),
            "timestamp": doc.get("created_at", "").isoformat() if doc.get("created_at") else "",
        })

    analysis_list = []
    async for doc in analysis_cursor:
        analysis_list.append({
            "type": "analysis",
            "event_id": event_id,
            "updated_summary": doc.get("updated_summary", ""),
            "key_moments": doc.get("key_moments", []),
            "trend": doc.get("trend", "stable"),
            "prediction": doc.get("prediction", ""),
            "confidence": doc.get("confidence", 0.5),
            "timestamp": doc.get("created_at", "").isoformat() if doc.get("created_at") else "",
        })

    stages_cursor = db["pipeline_stages"].find(
        {"event_id": event_id}
    ).sort("stage_number", 1)

    stages_list = []
    async for doc in stages_cursor:
        stages_list.append({
            "stage_number": doc.get("stage_number"),
            "stage_name": doc.get("stage_name"),
            "status": doc.get("status"),
            "started_at": doc.get("started_at", "").isoformat() if doc.get("started_at") else None,
            "completed_at": doc.get("completed_at", "").isoformat() if doc.get("completed_at") else None,
        })

    return {
        "type": "catchup",
        "event_id": event_id,
        "commentary": commentary_list,
        "analysis": analysis_list,
        "stages": stages_list,
    }


@router.websocket("/events/{event_id}")
async def websocket_event_endpoint(
    websocket: WebSocket,
    event_id: str,
    token: str = Query(...),
):
    payload = decode_token(token)
    if not payload:
        await websocket.close(code=4001)
        return

    user_id = payload.get("user_id", "anonymous")

    await websocket.accept()

    if event_id not in active_connections:
        active_connections[event_id] = []
    active_connections[event_id].append(websocket)

    if user_id not in user_connections:
        user_connections[user_id] = []
    user_connections[user_id].append(websocket)

    try:
        db = await get_database()
        catchup = await get_catchup_payload(event_id, db)
        await websocket.send_json(catchup)
    except Exception as e:
        print(f"[WS] Catchup failed for {event_id}: {e}")

    await websocket.send_json({
        "type": "connected",
        "event_id": event_id,
        "message": "Connected to live event feed",
        "active_connections": len(active_connections.get(event_id, [])),
    })

    try:
        while True:
            data = await websocket.receive_text()
            try:
                msg = json.loads(data)
                if msg.get("type") == "ping":
                    await websocket.send_json({"type": "pong"})
            except Exception:
                pass
    except WebSocketDisconnect:
        if event_id in active_connections and websocket in active_connections[event_id]:
            active_connections[event_id].remove(websocket)
        if user_id in user_connections and websocket in user_connections[user_id]:
            user_connections[user_id].remove(websocket)
        print(f"[WS] Client disconnected from event {event_id}")


@router.websocket("/user/{user_id}")
async def websocket_user_endpoint(
    websocket: WebSocket,
    user_id: str,
    token: str = Query(...),
):
    payload = decode_token(token)
    if not payload or payload.get("user_id") != user_id:
        await websocket.close(code=4001)
        return

    await websocket.accept()

    if user_id not in user_connections:
        user_connections[user_id] = []
    user_connections[user_id].append(websocket)

    await websocket.send_json({
        "type": "connected",
        "user_id": user_id,
        "message": "Connected to personal alert feed",
    })

    try:
        while True:
            data = await websocket.receive_text()
            try:
                msg = json.loads(data)
                if msg.get("type") == "ping":
                    await websocket.send_json({"type": "pong"})
            except Exception:
                pass
    except WebSocketDisconnect:
        if user_id in user_connections and websocket in user_connections[user_id]:
            user_connections[user_id].remove(websocket)
        print(f"[WS] User {user_id} disconnected from personal feed")


@router.get("/stats")
async def websocket_stats():
    return {
        "event_connections": {eid: len(conns) for eid, conns in active_connections.items() if conns},
        "total_event_connections": sum(len(c) for c in active_connections.values()),
        "total_user_connections": sum(len(c) for c in user_connections.values()),
    }