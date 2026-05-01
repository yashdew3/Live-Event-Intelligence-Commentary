from fastapi import APIRouter, Depends
from app.auth.dependencies import require_analyst
from app.database import get_database
from motor.motor_asyncio import AsyncIOMotorDatabase
import httpx

router = APIRouter()

WORKER_BASE_URL = "http://localhost:3001"


@router.get("/stats")
async def get_admin_stats(
    db: AsyncIOMotorDatabase = Depends(get_database),
    current_user: dict = Depends(require_analyst),
):
    total_events = await db["events"].count_documents({})
    live_events = await db["events"].count_documents({"status": "Live"})
    total_users = await db["users"].count_documents({})
    total_commentary = await db["commentary"].count_documents({})
    total_analyses = await db["gemini_analyses"].count_documents({})
    total_alerts_fired = await db["alerts"].count_documents({})
    total_reports = await db["event_reports"].count_documents({})

    return {
        "total_events": total_events,
        "live_events": live_events,
        "total_users": total_users,
        "total_commentary": total_commentary,
        "total_analyses": total_analyses,
        "total_alerts_fired": total_alerts_fired,
        "total_reports": total_reports,
        "bull_board_url": f"{WORKER_BASE_URL}/admin/queues",
    }


@router.get("/failed-jobs")
async def get_failed_jobs(
    current_user: dict = Depends(require_analyst),
):
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(f"{WORKER_BASE_URL}/internal/failed-jobs")
            if response.status_code == 200:
                return response.json()
            return {"failed_jobs": [], "error": "Could not fetch from worker server"}
    except Exception as e:
        return {"failed_jobs": [], "error": str(e)}


@router.post("/jobs/{job_id}/retry")
async def retry_job(
    job_id: str,
    queue_name: str,
    current_user: dict = Depends(require_analyst),
):
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(
                f"{WORKER_BASE_URL}/internal/retry-job",
                json={"job_id": job_id, "queue_name": queue_name},
            )
            return response.json()
    except Exception as e:
        return {"success": False, "error": str(e)}