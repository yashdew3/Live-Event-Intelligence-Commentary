from pydantic import BaseModel, Field
from typing import Optional, Literal
from datetime import datetime


class AlertRuleCreate(BaseModel):
    event_id: str
    rule_type: Literal["keyword_detected", "score_threshold", "trend_change"]
    keyword: Optional[str] = None
    threshold: Optional[float] = None
    description: Optional[str] = None


class AlertRuleOut(BaseModel):
    id: str
    user_id: str
    event_id: str
    rule_type: str
    keyword: Optional[str] = None
    threshold: Optional[float] = None
    description: Optional[str] = None
    is_active: bool
    created_at: datetime


class AlertOut(BaseModel):
    id: str
    user_id: str
    event_id: str
    rule_id: str
    rule_type: str
    matched_value: str
    triggered_at: datetime