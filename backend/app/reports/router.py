from fastapi import APIRouter, Depends, HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.database import get_database
from app.auth.dependencies import get_current_user

router = APIRouter()


@router.get("/{event_id}")
async def get_report(
    event_id: str,
    db: AsyncIOMotorDatabase = Depends(get_database),
    current_user: dict = Depends(get_current_user),
):
    report = await db["event_reports"].find_one({"event_id": event_id})
    if not report:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report not yet available for this event")
    report["id"] = str(report["_id"])
    del report["_id"]
    return report