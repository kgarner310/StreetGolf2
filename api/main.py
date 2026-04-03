from __future__ import annotations

from fastapi import FastAPI, HTTPException

import store
from hole_generator import get_daily_hole, get_hole_by_seed
from models import HoleDetail, VoteRequest, VoteResponse

app = FastAPI(title="StreetGolf2 API", version="0.1.0")


# ---------------------------------------------------------------------------
# GET /daily-hole
# ---------------------------------------------------------------------------

@app.get("/daily-hole", response_model=HoleDetail, summary="Get today's daily hole")
def daily_hole() -> HoleDetail:
    """
    Returns the generated hole for today.
    The same hole is returned for every caller on the same calendar day.
    """
    hole = get_daily_hole()

    # Persist so votes can be applied later; skip if already stored.
    existing = store.get_hole(hole.id)
    if existing is None:
        store.upsert_hole(hole)
    else:
        hole = existing  # use stored version (may have votes already)

    total = hole.vote_count_up + hole.vote_count_down
    return HoleDetail(
        **hole.model_dump(),
        total_votes=total,
        vote_ratio=hole.vote_count_up / total if total > 0 else 0.0,
    )


# ---------------------------------------------------------------------------
# POST /vote
# ---------------------------------------------------------------------------

@app.post("/vote", response_model=VoteResponse, summary="Vote on a hole")
def vote(body: VoteRequest) -> VoteResponse:
    """
    Cast an up or down vote for a hole.

    - **up** adds +1.0 to the hole's persistence_score
    - **down** adds −1.2 to the hole's persistence_score

    The hole must have been retrieved at least once via `/daily-hole` or
    `/holes/{id}` before it can be voted on.
    """
    # If hole not yet persisted, try generating it from its seed (hex id).
    existing = store.get_hole(body.hole_id)
    if existing is None:
        try:
            seed = int(body.hole_id, 16)
        except ValueError:
            raise HTTPException(status_code=404, detail="Hole not found")
        hole = get_hole_by_seed(seed)
        store.upsert_hole(hole)

    new_score = store.apply_vote(body.hole_id, body.vote)
    if new_score is None:
        raise HTTPException(status_code=404, detail="Hole not found")

    return VoteResponse(
        hole_id=body.hole_id,
        vote=body.vote,
        new_persistence_score=new_score,
    )


# ---------------------------------------------------------------------------
# GET /holes/{id}
# ---------------------------------------------------------------------------

@app.get("/holes/{hole_id}", response_model=HoleDetail, summary="Get hole details and vote summary")
def get_hole(hole_id: str) -> HoleDetail:
    """
    Returns full hole data plus a vote summary (total votes and up-vote ratio).

    If the hole has not been generated yet it will be generated on demand from
    its seed (the hole id is its seed in 8-digit hex).
    """
    hole = store.get_hole(hole_id)

    if hole is None:
        try:
            seed = int(hole_id, 16)
        except ValueError:
            raise HTTPException(status_code=404, detail="Hole not found")
        hole = get_hole_by_seed(seed)
        store.upsert_hole(hole)

    total = hole.vote_count_up + hole.vote_count_down
    return HoleDetail(
        **hole.model_dump(),
        total_votes=total,
        vote_ratio=hole.vote_count_up / total if total > 0 else 0.0,
    )
