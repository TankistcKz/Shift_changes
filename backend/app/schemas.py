from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

TIME_PATTERN = r"^\d{2}:\d{2}$"


class PersonCreate(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    role: Literal["senior", "guard"] = "guard"


class PersonUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=100)
    role: Literal["senior", "guard"] | None = None


class PersonOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    role: str


class ShiftCreate(BaseModel):
    date: date
    start_time: str = Field(pattern=TIME_PATTERN)
    end_time: str = Field(pattern=TIME_PATTERN)
    person_id: int


class ShiftUpdate(BaseModel):
    start_time: str | None = Field(default=None, pattern=TIME_PATTERN)
    end_time: str | None = Field(default=None, pattern=TIME_PATTERN)
    person_id: int | None = None


class ShiftOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    date: date
    start_time: str
    end_time: str
    person_id: int
    person: PersonOut | None = None


class ExchangeRequestCreate(BaseModel):
    requester_id: int
    shift_id: int
    target_shift_id: int
    reason: str = Field(min_length=1, max_length=500)


class ExchangeRequestOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    requester_id: int
    shift_id: int
    target_shift_id: int
    reason: str
    status: str
    created_at: datetime
    requester: PersonOut | None = None
    shift: ShiftOut | None = None
    target_shift: ShiftOut | None = None


class ModerationAction(BaseModel):
    approved_by_id: int | None = None


class ReplacementRecordOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    shift_id: int
    from_person_id: int
    to_person_id: int
    approved_by_id: int
    approved_at: datetime
    shift: ShiftOut | None = None
    from_person: PersonOut | None = None
    to_person: PersonOut | None = None
    approved_by: PersonOut | None = None