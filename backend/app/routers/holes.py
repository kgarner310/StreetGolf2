from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.generated_hole import GeneratedHole
from app.models.hole_lifecycle import HoleLifecycle, HoleStatusEnum
from app.schemas import DailyHoleResponse, HoleDetailResponse

router = APIRouter(prefix="/v1")


@router.get("/daily-hole", response_model=DailyHoleResponse)
def get_daily_hole(db: Session = Depends(get_db)):
    now = datetime.now(timezone.utc)

    # Newest hole whose lifecycle is either missing or not yet expired.
    hole = (
        db.query(GeneratedHole)
        .outerjoin(GeneratedHole.lifecycle)
        .filter(
            (HoleLifecycle.expires_at == None)  # noqa: E711
            | (HoleLifecycle.expires_at > now)
        )
        .order_by(GeneratedHole.created_at.desc())
        .first()
    )

    if hole is None:
        raise HTTPException(status_code=404, detail="No active hole available")

    lc = hole.lifecycle
    if lc is not None:
        lc.last_shown_at = now
        db.commit()

    return DailyHoleResponse(
        id=hole.id,
        lat=float(hole.lat),
        lng=float(hole.lng),
        name=hole.name,
        description=hole.description,
        persistence_score=float(hole.persistence_score),
        status=lc.status if lc else HoleStatusEnum.ephemeral,
    )


@router.get("/holes/{hole_id}", response_model=HoleDetailResponse)
def get_hole(hole_id: int, db: Session = Depends(get_db)):
    hole = db.get(GeneratedHole, hole_id)
    if hole is None:
        raise HTTPException(status_code=404, detail="Hole not found")

    lc = hole.lifecycle
    return HoleDetailResponse(
        id=hole.id,
        lat=float(hole.lat),
        lng=float(hole.lng),
        name=hole.name,
        description=hole.description,
        persistence_score=float(hole.persistence_score),
        status=lc.status if lc else HoleStatusEnum.ephemeral,
        created_at=hole.created_at,
    )
