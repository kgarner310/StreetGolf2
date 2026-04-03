"""
Seed the database with one test hole so the daily-hole endpoint has data.

Usage (from the backend/ directory):
    python seed.py

Requires DATABASE_URL in the environment, e.g.:
    $env:DATABASE_URL = "postgresql://streetgolf:streetgolf@localhost:5432/streetgolf"
    python seed.py
"""
import os
import sys

# Ensure DATABASE_URL is set before importing app modules
if "DATABASE_URL" not in os.environ:
    print("ERROR: DATABASE_URL environment variable is not set.")
    print("Set it first, e.g.:")
    print('  $env:DATABASE_URL = "postgresql://streetgolf:streetgolf@localhost:5432/streetgolf"')
    sys.exit(1)

from app.database import init_db, SessionLocal
from app.models.generated_hole import GeneratedHole
from app.models.hole_lifecycle import HoleLifecycle, HoleStatusEnum


def seed():
    init_db()
    db = SessionLocal()
    try:
        existing = db.query(GeneratedHole).count()
        if existing > 0:
            print(f"Database already has {existing} hole(s) — skipping seed.")
            return

        hole = GeneratedHole(
            lat=37.7749,
            lng=-122.4194,
            name="Golden Gate Par 3",
            description="Tee off from the visitor plaza. One shot across the highway.",
        )
        db.add(hole)
        db.flush()

        lc = HoleLifecycle(hole_id=hole.id, status=HoleStatusEnum.ephemeral)
        db.add(lc)
        db.commit()

        print(f"Seeded hole id={hole.id}: {hole.name}")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
