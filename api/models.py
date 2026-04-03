from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Optional

from pydantic import BaseModel


class TerrainType(str, Enum):
    tee = "tee"
    road = "road"
    rough = "rough"
    sand = "sand"
    water = "water"
    building = "building"
    green = "green"


class VoteType(str, Enum):
    up = "up"
    down = "down"


class Position(BaseModel):
    x: int
    y: int


class HoleData(BaseModel):
    id: str
    seed: int
    par: int
    width: int
    height: int
    tee_pos: Position
    hole_pos: Position
    # Flat grid of terrain types, row-major (width * height entries)
    grid: list[str]
    persistence_score: float = 0.0
    created_at: datetime
    vote_count_up: int = 0
    vote_count_down: int = 0


class VoteRequest(BaseModel):
    hole_id: str
    vote: VoteType
    reason: Optional[str] = None


class VoteResponse(BaseModel):
    hole_id: str
    vote: VoteType
    new_persistence_score: float


class HoleDetail(HoleData):
    total_votes: int
    vote_ratio: float  # up votes / total votes, or 0 if no votes
