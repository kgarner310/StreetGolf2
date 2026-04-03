from datetime import datetime, timezone
from sqlalchemy.orm import Session

from app.models.generated_hole import GeneratedHole
from app.models.hole_lifecycle import HoleLifecycle, HoleStatusEnum
from app.models.hole_vote import VoteEnum

# Score deltas
VOTE_UP_DELTA = 1.0
VOTE_DOWN_DELTA = -1.2

# Promotion thresholds
THRESHOLD_EXPIRES = -2.0
THRESHOLD_STICKY = 3.0
THRESHOLD_RECURRING = 6.0
THRESHOLD_CLASSIC = 10.0


def apply_vote(hole: GeneratedHole, vote: VoteEnum, db: Session) -> None:
    """Apply vote delta then re-evaluate lifecycle status."""
    if vote == VoteEnum.up:
        hole.persistence_score += VOTE_UP_DELTA
    else:
        hole.persistence_score += VOTE_DOWN_DELTA

    _update_lifecycle(hole, db)


def _update_lifecycle(hole: GeneratedHole, db: Session) -> None:
    lc = hole.lifecycle
    if lc is None:
        lc = HoleLifecycle(hole_id=hole.id)
        db.add(lc)

    score = float(hole.persistence_score)

    if score < THRESHOLD_EXPIRES:
        # Mark expired immediately; caller commits
        lc.expires_at = datetime.now(timezone.utc)
        return

    # Promote (never demote — score only grows in one direction per use case)
    if score > THRESHOLD_CLASSIC:
        lc.status = HoleStatusEnum.classic
    elif score > THRESHOLD_RECURRING:
        lc.status = HoleStatusEnum.recurring
    elif score > THRESHOLD_STICKY:
        lc.status = HoleStatusEnum.sticky
    else:
        lc.status = HoleStatusEnum.ephemeral
