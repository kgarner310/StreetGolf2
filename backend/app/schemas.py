from datetime import datetime
from pydantic import BaseModel
from app.models.hole_vote import VoteEnum
from app.models.hole_lifecycle import HoleStatusEnum


class DailyHoleResponse(BaseModel):
    id: int
    lat: float
    lng: float
    name: str
    description: str
    persistence_score: float
    status: HoleStatusEnum


class VoteRequest(BaseModel):
    user_id: int
    hole_id: int
    vote: VoteEnum
    reason: str | None = None


class VoteResponse(BaseModel):
    id: int
    user_id: int
    hole_id: int
    vote: VoteEnum
    persistence_score: float
    status: HoleStatusEnum


class HoleDetailResponse(BaseModel):
    id: int
    lat: float
    lng: float
    name: str
    description: str
    persistence_score: float
    status: HoleStatusEnum
    created_at: datetime
