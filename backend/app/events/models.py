from pydantic import BaseModel, Field
from typing import Optional, List
from enum import Enum
from datetime import datetime


class EventStatus(str, Enum):
    live = "Live"
    upcoming = "Upcoming"
    final = "Final"


class PipelineStageStatus(str, Enum):
    pending = "pending"
    active = "active"
    done = "done"
    failed = "failed"


class TrendType(str, Enum):
    momentum = "momentum"
    stable = "stable"
    reversal = "reversal"


class EventOut(BaseModel):
    event_id: str
    sport: str
    home_team: str
    away_team: str
    home_score: int
    away_score: int
    status: str
    venue: str
    date: str
    league: str
    updates: List[str] = []
    is_subscribed: bool = False


class PipelineStageOut(BaseModel):
    event_id: str
    stage_number: int
    stage_name: str
    status: PipelineStageStatus
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None


class GeminiAnalysis(BaseModel):
    updated_summary: str
    key_moments: List[str]
    trend: TrendType
    prediction: str
    confidence: float = Field(ge=0.0, le=1.0)


class SubscribeResponse(BaseModel):
    message: str
    event_id: str
    subscriptions_count: int