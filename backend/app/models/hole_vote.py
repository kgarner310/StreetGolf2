import enum
from datetime import datetime, timezone
from sqlalchemy import DateTime, Enum, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


class VoteEnum(str, enum.Enum):
    up = "up"
    down = "down"


class HoleVote(Base):
    __tablename__ = "hole_votes"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    hole_id: Mapped[int] = mapped_column(
        ForeignKey("generated_holes.id"), nullable=False
    )
    vote: Mapped[VoteEnum] = mapped_column(Enum(VoteEnum), nullable=False)
    reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    user: Mapped["User"] = relationship("User", back_populates="votes")
    hole: Mapped["GeneratedHole"] = relationship("GeneratedHole", back_populates="votes")
