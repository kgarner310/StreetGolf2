"""
Test configuration.

Sets DATABASE_URL before any app module is imported so database.py
reads the SQLite fallback instead of requiring a real Postgres URL.
StaticPool ensures all sessions share the same in-memory database.
"""
import os

os.environ.setdefault("DATABASE_URL", "sqlite://")

import pytest  # noqa: E402
from sqlalchemy import create_engine  # noqa: E402
from sqlalchemy.orm import sessionmaker  # noqa: E402
from sqlalchemy.pool import StaticPool  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402

import app.database as db_module  # noqa: E402
from app.database import Base, get_db  # noqa: E402
from app.main import app  # noqa: E402

# ---------------------------------------------------------------------------
# Shared in-memory SQLite engine (StaticPool = single connection, shared DB)
# ---------------------------------------------------------------------------
_engine = create_engine(
    "sqlite://",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
_TestingSession = sessionmaker(bind=_engine, autocommit=False, autoflush=False)

# Patch module globals so get_db() and init_db() use the test engine
db_module.engine = _engine
db_module.SessionLocal = _TestingSession


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

@pytest.fixture(autouse=True)
def reset_db():
    """Recreate all tables before each test and drop them after."""
    import app.models  # noqa: F401 — registers models with Base.metadata
    Base.metadata.create_all(bind=_engine)
    yield
    Base.metadata.drop_all(bind=_engine)


@pytest.fixture
def db(reset_db):
    """Plain SQLAlchemy session for direct model manipulation in tests."""
    session = _TestingSession()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture
def client(reset_db):
    """TestClient wired to the same in-memory DB as the db fixture."""
    def _override_get_db():
        session = _TestingSession()
        try:
            yield session
        finally:
            session.close()

    app.dependency_overrides[get_db] = _override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()
