from datetime import date, datetime, timezone

from sqlalchemy import (
    CheckConstraint,
    Date,
    DateTime,
    ForeignKey,
    String,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .database import Base


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class Person(Base):
    __tablename__ = "persons"
    __table_args__ = (
        CheckConstraint("role IN ('senior', 'guard')", name="ck_person_role"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(100))
    role: Mapped[str] = mapped_column(String(20), default="guard")

    shifts: Mapped[list["Shift"]] = relationship(
        back_populates="person",
    )
    created_requests: Mapped[list["ExchangeRequest"]] = relationship(
        back_populates="requester",
        foreign_keys="ExchangeRequest.requester_id",
    )


class Shift(Base):
    __tablename__ = "shifts"

    id: Mapped[int] = mapped_column(primary_key=True)
    date: Mapped[date] = mapped_column(Date, index=True)
    start_time: Mapped[str] = mapped_column(String(5))
    end_time: Mapped[str] = mapped_column(String(5))
    person_id: Mapped[int] = mapped_column(
        ForeignKey("persons.id", ondelete="RESTRICT"),
        index=True,
    )

    person: Mapped["Person"] = relationship(back_populates="shifts")


class ExchangeRequest(Base):
    __tablename__ = "exchange_requests"
    __table_args__ = (
        CheckConstraint(
            "status IN ('pending', 'approved', 'declined')",
            name="ck_exchange_request_status",
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    requester_id: Mapped[int] = mapped_column(
        ForeignKey("persons.id", ondelete="RESTRICT"),
        index=True,
    )
    shift_id: Mapped[int] = mapped_column(
        ForeignKey("shifts.id", ondelete="CASCADE")
    )
    target_shift_id: Mapped[int] = mapped_column(
        ForeignKey("shifts.id", ondelete="CASCADE")
    )
    reason: Mapped[str] = mapped_column(String(500))
    status: Mapped[str] = mapped_column(
        String(20), default="pending", index=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    requester: Mapped["Person"] = relationship(
        back_populates="created_requests",
        foreign_keys=[requester_id],
    )
    shift: Mapped["Shift"] = relationship(foreign_keys=[shift_id])
    target_shift: Mapped["Shift"] = relationship(foreign_keys=[target_shift_id])


class ReplacementRecord(Base):
    __tablename__ = "replacement_history"

    id: Mapped[int] = mapped_column(primary_key=True)
    shift_id: Mapped[int] = mapped_column(
        ForeignKey("shifts.id", ondelete="CASCADE"),
        index=True,
    )
    from_person_id: Mapped[int] = mapped_column(
        ForeignKey("persons.id", ondelete="RESTRICT")
    )
    to_person_id: Mapped[int] = mapped_column(
        ForeignKey("persons.id", ondelete="RESTRICT")
    )
    approved_by_id: Mapped[int] = mapped_column(
        ForeignKey("persons.id", ondelete="RESTRICT")
    )
    approved_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utcnow
    )

    shift: Mapped["Shift"] = relationship(foreign_keys=[shift_id])
    from_person: Mapped["Person"] = relationship(foreign_keys=[from_person_id])
    to_person: Mapped["Person"] = relationship(foreign_keys=[to_person_id])
    approved_by: Mapped["Person"] = relationship(
        foreign_keys=[approved_by_id]
    )