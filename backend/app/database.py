import os
from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker
from sqlalchemy.pool import StaticPool


class Base(DeclarativeBase):
    pass


# Module-level engine/session — overridable by tests before first use.
_DATABASE_URL = os.environ.get("DATABASE_URL", "")

if _DATABASE_URL.startswith("sqlite"):
    engine = create_engine(
        _DATABASE_URL,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
elif _DATABASE_URL:
    engine = create_engine(_DATABASE_URL)
else:
    engine = None  # will be set by tests or fail loudly at runtime

SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False) if engine else None


def init_db() -> None:
    """Create all tables. Import models first so metadata is populated."""
    import app.models  # noqa: F401 — side-effect: registers all ORM classes
    Base.metadata.create_all(bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
