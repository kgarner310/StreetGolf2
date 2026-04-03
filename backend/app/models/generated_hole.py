from datetime import datetime, timezone
from sqlalchemy import DateTime, Numeric, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


class GeneratedHole(Base):
    __tablename__ = "generated_holes"

    id: Mapped[int] = mapped_column(primary_key=True)
    lat: Mapped[float] = mapped_column(Numeric(9, 6), nullable=False)
    lng: Mapped[float] = mapped_column(Numeric(9, 6), nullable=False)
    name: Mapped[str] = mapped_column(Text, nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    persistence_score: Mapped[float] = mapped_column(default=0.0, nullable=False)

    votes: Mapped[list["HoleVote"]] = relationship("HoleVote", back_populates="hole")
    lifecycle: Mapped["HoleLifecycle"] = relationship(
        "HoleLifecycle", back_populates="hole", uselist=False
    )
