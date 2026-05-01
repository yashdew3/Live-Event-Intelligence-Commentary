from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.config import settings
from app.database import connect_to_mongo, close_mongo_connection
from app.auth.router import router as auth_router
from app.events.router import router as events_router
from app.alerts.router import router as alerts_router
from app.reports.router import router as reports_router
from app.websocket.router import router as websocket_router, broadcast_to_event, broadcast_to_user
from app.admin.router import router as admin_router
from app.events.scheduler import start_scheduler, stop_scheduler


@asynccontextmanager
async def lifespan(app: FastAPI):
    await connect_to_mongo()
    start_scheduler()
    print("Application startup complete")
    yield
    stop_scheduler()
    await close_mongo_connection()
    print("Application shutdown complete")


app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="Real-time sports event intelligence platform",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url, "http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router, prefix="/auth", tags=["Authentication"])
app.include_router(events_router, prefix="/events", tags=["Events"])
app.include_router(alerts_router, prefix="/alerts", tags=["Alerts"])
app.include_router(reports_router, prefix="/reports", tags=["Reports"])
app.include_router(websocket_router, prefix="/ws", tags=["WebSocket"])
app.include_router(admin_router, prefix="/admin", tags=["Admin"])


@app.post("/internal/ws-broadcast", include_in_schema=False)
async def internal_ws_broadcast(request: Request):
    body = await request.json()
    event_id = body.get("event_id")
    message = body.get("message")
    if event_id and message:
        await broadcast_to_event(event_id, message)
    return {"ok": True}


@app.post("/internal/ws-alert", include_in_schema=False)
async def internal_ws_alert(request: Request):
    body = await request.json()
    user_id = body.get("user_id")
    message = body.get("message")
    if user_id and message:
        await broadcast_to_user(user_id, message)
    return {"ok": True}


@app.get("/", tags=["Health"])
async def root():
    return {
        "message": "Live Event Intelligence Platform API",
        "version": settings.app_version,
        "docs": "/docs",
        "status": "running",
    }


@app.get("/health", tags=["Health"])
async def health_check():
    return {"status": "healthy", "app": settings.app_name}