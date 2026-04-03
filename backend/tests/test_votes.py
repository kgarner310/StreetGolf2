"""
Tests for POST /v1/vote — submission, duplicate rejection, 404 on missing hole.
"""
from app.models.generated_hole import GeneratedHole
from app.models.hole_lifecycle import HoleLifecycle, HoleStatusEnum
from app.models.user import User


def _seed_hole(db, hole_id: int = 1) -> GeneratedHole:
    hole = GeneratedHole(
        id=hole_id,
        lat=37.7749,
        lng=-122.4194,
        name="Test Hole",
        description="A test hole",
        persistence_score=0.0,
    )
    lc = HoleLifecycle(hole_id=hole_id, status=HoleStatusEnum.ephemeral)
    db.add_all([hole, lc])
    db.commit()
    return hole


def test_vote_up_increases_score(client, db):
    _seed_hole(db)
    resp = client.post("/v1/vote", json={"user_id": 1, "hole_id": 1, "vote": "up"})
    assert resp.status_code == 201
    body = resp.json()
    assert body["vote"] == "up"
    assert body["persistence_score"] == pytest.approx(1.0)


def test_vote_down_decreases_score(client, db):
    _seed_hole(db)
    resp = client.post("/v1/vote", json={"user_id": 1, "hole_id": 1, "vote": "down"})
    assert resp.status_code == 201
    body = resp.json()
    assert body["vote"] == "down"
    assert body["persistence_score"] == pytest.approx(-1.2)


def test_vote_response_includes_status(client, db):
    _seed_hole(db)
    resp = client.post("/v1/vote", json={"user_id": 1, "hole_id": 1, "vote": "up"})
    assert resp.status_code == 201
    assert resp.json()["status"] == "ephemeral"  # score=1.0, below sticky threshold


def test_vote_with_reason(client, db):
    _seed_hole(db)
    resp = client.post(
        "/v1/vote",
        json={"user_id": 1, "hole_id": 1, "vote": "down", "reason": "Too easy"},
    )
    assert resp.status_code == 201


def test_duplicate_vote_rejected(client, db):
    _seed_hole(db)
    client.post("/v1/vote", json={"user_id": 1, "hole_id": 1, "vote": "up"})
    resp = client.post("/v1/vote", json={"user_id": 1, "hole_id": 1, "vote": "down"})
    assert resp.status_code == 409
    assert "already voted" in resp.json()["detail"]


def test_vote_nonexistent_hole_returns_404(client, db):
    resp = client.post("/v1/vote", json={"user_id": 1, "hole_id": 999, "vote": "up"})
    assert resp.status_code == 404


def test_different_users_can_vote_same_hole(client, db):
    _seed_hole(db)
    r1 = client.post("/v1/vote", json={"user_id": 1, "hole_id": 1, "vote": "up"})
    r2 = client.post("/v1/vote", json={"user_id": 2, "hole_id": 1, "vote": "up"})
    assert r1.status_code == 201
    assert r2.status_code == 201
    assert r2.json()["persistence_score"] == pytest.approx(2.0)


import pytest  # noqa: E402  (kept at bottom to avoid circular concern with fixtures)
