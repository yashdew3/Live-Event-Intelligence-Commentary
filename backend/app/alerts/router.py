from fastapi import APIRouter, Depends, HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId
from datetime import datetime
from typing import List

from app.database import get_database
from app.auth.dependencies import get_current_user, require_analyst
from app.alerts.models import AlertRuleCreate, AlertRuleOut, AlertOut

router = APIRouter()


@router.post("/rules", response_model=AlertRuleOut, status_code=status.HTTP_201_CREATED)
async def create_rule(
    rule_data: AlertRuleCreate,
    db: AsyncIOMotorDatabase = Depends(get_database),
    current_user: dict = Depends(require_analyst),
):
    existing_count = await db["alert_rules"].count_documents(
        {"user_id": current_user["id"], "event_id": rule_data.event_id, "is_active": True}
    )
    if existing_count >= 5:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Maximum 5 rules per event allowed")

    rule_doc = {
        "user_id": current_user["id"],
        "event_id": rule_data.event_id,
        "rule_type": rule_data.rule_type,
        "keyword": rule_data.keyword,
        "threshold": rule_data.threshold,
        "description": rule_data.description,
        "is_active": True,
        "created_at": datetime.utcnow(),
    }
    result = await db["alert_rules"].insert_one(rule_doc)
    rule_doc["id"] = str(result.inserted_id)
    return AlertRuleOut(**rule_doc)


@router.get("/rules", response_model=List[AlertRuleOut])
async def list_rules(
    db: AsyncIOMotorDatabase = Depends(get_database),
    current_user: dict = Depends(get_current_user),
):
    cursor = db["alert_rules"].find({"user_id": current_user["id"], "is_active": True})
    rules = []
    async for rule in cursor:
        rule["id"] = str(rule["_id"])
        rules.append(AlertRuleOut(**rule))
    return rules


@router.delete("/rules/{rule_id}")
async def delete_rule(
    rule_id: str,
    db: AsyncIOMotorDatabase = Depends(get_database),
    current_user: dict = Depends(require_analyst),
):
    result = await db["alert_rules"].update_one(
        {"_id": ObjectId(rule_id), "user_id": current_user["id"]},
        {"$set": {"is_active": False}},
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Rule not found")
    return {"message": "Rule deleted successfully"}


@router.get("/history", response_model=List[AlertOut])
async def alert_history(
    db: AsyncIOMotorDatabase = Depends(get_database),
    current_user: dict = Depends(get_current_user),
):
    cursor = db["alerts"].find({"user_id": current_user["id"]}).sort("triggered_at", -1).limit(50)
    alerts = []
    async for alert in cursor:
        alert["id"] = str(alert["_id"])
        alerts.append(AlertOut(**alert))
    return alerts