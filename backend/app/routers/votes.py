from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.database import get_db
from app.lifecycle import apply_vote
from app.models.generated_hole import GeneratedHole
from app.models.hole_lifecycle import HoleStatusEnum
from app.models.hole_vote import HoleVote
from app.models.user import User
from app.schemas import VoteRequest, VoteResponse

router = APIRouter(prefix="/v1")


@router.post("/vote", response_model=VoteResponse, status_code=201)
def submit_vote(payload: VoteRequest, db: Session = Depends(get_db)):
    # Auto-create user for MVP (no auth layer yet).
    if db.get(User, payload.user_id) is None:
        db.add(User(id=payload.user_id))
        db.flush()

    hole = db.get(GeneratedHole, payload.hole_id)
    if hole is None:
        raise HTTPException(status_code=404, detail="Hole not found")

    vote = HoleVote(
        user_id=payload.user_id,
        hole_id=payload.hole_id,
        vote=payload.vote,
        reason=payload.reason,
    )
    db.add(vote)

    try:
        db.flush()  # surface the unique-constraint violation before mutating score
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=409, detail="User has already voted on this hole"
        )

    apply_vote(hole, payload.vote, db)
    db.commit()
    db.refresh(vote)
    db.refresh(hole)

    lc = hole.lifecycle
    return VoteResponse(
        id=vote.id,
        user_id=vote.user_id,
        hole_id=vote.hole_id,
        vote=vote.vote,
        persistence_score=float(hole.persistence_score),
        status=lc.status if lc else HoleStatusEnum.ephemeral,
    )
