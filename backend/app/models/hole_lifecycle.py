import enum
from datetime import datetime
from sqlalchemy import DateTime, Enum, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


class HoleStatusEnum(str, enum.Enum):
    ephemeral = "ephemeral"
    sticky = "sticky"
    recurring = "recurring"
    classic = "classic"


class HoleLifecycle(Base):
    __tablename__ = "hole_lifecycle"

    hole_id: Mapped[int] = mapped_column(
        ForeignKey("generated_holes.id"), primary_key=True
    )
    status: Mapped[HoleStatusEnum] = mapped_column(
        Enum(HoleStatusEnum), nullable=False, default=HoleStatusEnum.ephemeral
    )
    last_shown_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    expires_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    hole: Mapped["GeneratedHole"] = relationship(
        "GeneratedHole", back_populates="lifecycle"
    )
