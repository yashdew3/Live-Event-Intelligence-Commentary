import json
import httpx
import asyncio
from pathlib import Path
from datetime import datetime
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger
from app.config import settings
from app.database import get_database

scheduler = AsyncIOScheduler()

WORKER_BASE_URL = "http://localhost:3001"


def load_mock_events():
    mock_path = Path(__file__).parent.parent.parent.parent / 'mock_livescore.json'
    if not mock_path.exists():
        print(f'[Scheduler] mock_livescore.json not found at {mock_path}')
        return []
    with open(mock_path, 'r') as f:
        data = json.load(f)
    return data.get('events', [])


async def enqueue_batch(jobs: list):
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                f"{WORKER_BASE_URL}/internal/enqueue-batch",
                json={"jobs": jobs},
            )
            if response.status_code == 200:
                result = response.json()
                return result.get('enqueued', 0)
            else:
                print(f'[Scheduler] Enqueue batch failed: {response.status_code} {response.text}')
                return 0
    except Exception as e:
        print(f'[Scheduler] Enqueue batch error: {e}')
        return 0


async def enqueue_single(queue_name: str, job_name: str, data: dict, opts: dict = None):
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(
                f"{WORKER_BASE_URL}/internal/enqueue",
                json={
                    "queue_name": queue_name,
                    "job_name": job_name,
                    "data": data,
                    "opts": opts or {},
                },
            )
            return response.status_code == 200
    except Exception as e:
        print(f'[Scheduler] Enqueue single error: {e}')
        return False


async def ingest_events_job():
    print(f'[Scheduler] Ingestion job fired at {datetime.utcnow().isoformat()}')
    try:
        if settings.use_mock:
            events = load_mock_events()
        else:
            async with httpx.AsyncClient(timeout=15.0) as client:
                resp = await client.get(
                    f'{settings.sports_db_base_url}/{settings.sports_db_api_key}/latestsoccer.php'
                )
                events_data = resp.json()
                events = events_data.get('events', [])

        if not events:
            print('[Scheduler] No events found to ingest')
            return

        db = await get_database()

        ingest_jobs = []
        report_jobs = []

        for event in events:
            event_id = event.get('event_id')
            if not event_id:
                continue

            ingest_jobs.append({
                "queue_name": "ingest-queue",
                "job_name": f"ingest-{event_id}",
                "data": event,
                "opts": {
                    "attempts": 3,
                    "backoff": {"type": "exponential", "delay": 2000},
                },
            })

            if event.get('status') == 'Final':
                report_exists = await db['event_reports'].find_one({'event_id': event_id})
                if not report_exists:
                    report_jobs.append({
                        "queue_name": "report-generation-queue",
                        "job_name": f"report-{event_id}",
                        "data": {"event_id": event_id},
                        "opts": {"attempts": 2},
                    })

        all_jobs = ingest_jobs + report_jobs
        enqueued = await enqueue_batch(all_jobs)
        print(f'[Scheduler] Enqueued {enqueued} jobs ({len(ingest_jobs)} ingest + {len(report_jobs)} reports)')

    except Exception as e:
        print(f'[Scheduler] Ingestion job error: {e}')


async def gemini_analysis_job():
    print(f'[Scheduler] Gemini analysis job fired at {datetime.utcnow().isoformat()}')
    try:
        db = await get_database()
        cursor = db['events'].find({'status': 'Live'})

        gemini_jobs = []
        async for event in cursor:
            event_id = event['event_id']
            gemini_jobs.append({
                "queue_name": "gemini-analysis-queue",
                "job_name": f"gemini-{event_id}-{int(datetime.utcnow().timestamp())}",
                "data": {"event_id": event_id},
                "opts": {"attempts": 2},
            })

        if gemini_jobs:
            enqueued = await enqueue_batch(gemini_jobs)
            print(f'[Scheduler] Enqueued {enqueued} Gemini analysis jobs')
        else:
            print('[Scheduler] No live events found for Gemini analysis')

    except Exception as e:
        print(f'[Scheduler] Gemini job error: {e}')


def start_scheduler():
    scheduler.add_job(
        ingest_events_job,
        trigger=IntervalTrigger(seconds=60),
        id='ingest_events',
        replace_existing=True,
        next_run_time=datetime.utcnow(),
    )
    scheduler.add_job(
        gemini_analysis_job,
        trigger=IntervalTrigger(seconds=300),
        id='gemini_analysis',
        replace_existing=True,
    )
    scheduler.start()
    print('[Scheduler] APScheduler started — ingestion every 60s, Gemini every 5min')


def stop_scheduler():
    if scheduler.running:
        scheduler.shutdown()
        print('[Scheduler] APScheduler stopped')