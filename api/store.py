"""
Simple in-process persistence layer backed by a JSON file.
Thread-safe for single-worker use; replace with a real DB for production.
"""
from __future__ import annotations

import json
import threading
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

from models import HoleData, VoteType

_STORE_PATH = Path(__file__).parent / "data" / "store.json"
_lock = threading.Lock()


def _load() -> dict:
    if _STORE_PATH.exists():
        return json.loads(_STORE_PATH.read_text())
    return {"holes": {}, "votes": []}


def _save(data: dict) -> None:
    _STORE_PATH.parent.mkdir(parents=True, exist_ok=True)
    _STORE_PATH.write_text(json.dumps(data, default=str, indent=2))


def upsert_hole(hole: HoleData) -> None:
    with _lock:
        data = _load()
        data["holes"][hole.id] = hole.model_dump(mode="json")
        _save(data)


def get_hole(hole_id: str) -> Optional[HoleData]:
    with _lock:
        data = _load()
    raw = data["holes"].get(hole_id)
    if raw is None:
        return None
    return HoleData.model_validate(raw)


def apply_vote(hole_id: str, vote: VoteType) -> Optional[float]:
    """Apply vote delta; returns updated persistence_score or None if hole unknown."""
    delta = 1.0 if vote == VoteType.up else -1.2
    with _lock:
        data = _load()
        hole_raw = data["holes"].get(hole_id)
        if hole_raw is None:
            return None
        hole_raw["persistence_score"] = round(hole_raw.get("persistence_score", 0.0) + delta, 4)
        if vote == VoteType.up:
            hole_raw["vote_count_up"] = hole_raw.get("vote_count_up", 0) + 1
        else:
            hole_raw["vote_count_down"] = hole_raw.get("vote_count_down", 0) + 1
        data["holes"][hole_id] = hole_raw
        data["votes"].append(
            {
                "hole_id": hole_id,
                "vote": vote.value,
                "ts": datetime.now(timezone.utc).isoformat(),
            }
        )
        _save(data)
    return hole_raw["persistence_score"]
