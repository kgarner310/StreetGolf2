"""
Tests for lifecycle promotion logic in app.lifecycle.apply_vote.

Uses direct DB sessions (no HTTP) so thresholds can be hit in fewer lines.
"""
import pytest
from app.lifecycle import apply_vote, THRESHOLD_EXPIRES, THRESHOLD_STICKY, THRESHOLD_RECURRING, THRESHOLD_CLASSIC
from app.models.generated_hole import GeneratedHole
from app.models.hole_lifecycle import HoleLifecycle, HoleStatusEnum
from app.models.hole_vote import VoteEnum


def _make_hole(db, score: float = 0.0) -> GeneratedHole:
    hole = GeneratedHole(
        lat=0.0, lng=0.0, name="H", description="D", persistence_score=score
    )
    db.add(hole)
    db.flush()
    lc = HoleLifecycle(hole_id=hole.id, status=HoleStatusEnum.ephemeral)
    db.add(lc)
    db.commit()
    db.refresh(hole)
    return hole


def test_new_hole_is_ephemeral(db):
    hole = _make_hole(db)
    assert hole.lifecycle.status == HoleStatusEnum.ephemeral


def test_vote_up_sets_ephemeral_below_sticky(db):
    hole = _make_hole(db, score=0.0)
    apply_vote(hole, VoteEnum.up, db)
    db.commit()
    db.refresh(hole)
    assert hole.lifecycle.status == HoleStatusEnum.ephemeral
    assert float(hole.persistence_score) == pytest.approx(1.0)


def test_promotes_to_sticky(db):
    # Need score > 3.0; start just below and push over with one up vote.
    hole = _make_hole(db, score=THRESHOLD_STICKY)  # exactly 3.0 — not yet sticky
    apply_vote(hole, VoteEnum.up, db)             # becomes 4.0 > 3.0
    db.commit()
    db.refresh(hole)
    assert hole.lifecycle.status == HoleStatusEnum.sticky


def test_promotes_to_recurring(db):
    hole = _make_hole(db, score=THRESHOLD_RECURRING)  # 6.0 — not yet recurring
    apply_vote(hole, VoteEnum.up, db)                 # 7.0 > 6.0
    db.commit()
    db.refresh(hole)
    assert hole.lifecycle.status == HoleStatusEnum.recurring


def test_promotes_to_classic(db):
    hole = _make_hole(db, score=THRESHOLD_CLASSIC)  # 10.0 — not yet classic
    apply_vote(hole, VoteEnum.up, db)               # 11.0 > 10.0
    db.commit()
    db.refresh(hole)
    assert hole.lifecycle.status == HoleStatusEnum.classic


def test_expires_when_score_below_threshold(db):
    hole = _make_hole(db, score=THRESHOLD_EXPIRES)  # -2.0 — right at boundary
    apply_vote(hole, VoteEnum.down, db)              # -3.2 < -2.0
    db.commit()
    db.refresh(hole)
    assert hole.lifecycle.expires_at is not None


def test_expires_at_not_set_above_threshold(db):
    hole = _make_hole(db, score=0.0)
    apply_vote(hole, VoteEnum.down, db)  # -1.2, still above -2.0
    db.commit()
    db.refresh(hole)
    assert hole.lifecycle.expires_at is None


def test_creates_lifecycle_if_missing(db):
    """apply_vote auto-creates a HoleLifecycle row when none exists."""
    hole = GeneratedHole(lat=0.0, lng=0.0, name="H", description="D", persistence_score=0.0)
    db.add(hole)
    db.commit()
    db.refresh(hole)
    assert hole.lifecycle is None

    apply_vote(hole, VoteEnum.up, db)
    db.commit()
    db.refresh(hole)
    assert hole.lifecycle is not None
    assert hole.lifecycle.status == HoleStatusEnum.ephemeral
