from datetime import date

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from .models import ExchangeRequest, Person, ReplacementRecord, Shift
from .schemas import (
    ExchangeRequestCreate,
    PersonCreate,
    PersonUpdate,
    ShiftCreate,
    ShiftUpdate,
)

NOT_FOUND = "Запись не найдена"


def _not_found(entity: str) -> HTTPException:
    return HTTPException(status_code=404, detail=f"{entity} не найдена")


def _get_person_or_404(db: Session, person_id: int) -> Person:
    person = db.get(Person, person_id)
    if person is None:
        raise _not_found("Пользователь")
    return person


def _get_shift_or_404(db: Session, shift_id: int) -> Shift:
    shift = db.get(Shift, shift_id)
    if shift is None:
        raise _not_found("Смена")
    return shift


def _get_request_or_404(db: Session, request_id: int) -> ExchangeRequest:
    request = db.get(ExchangeRequest, request_id)
    if request is None:
        raise _not_found("Запрос на обмен")
    return request


# Persons
def list_persons(db: Session) -> list[Person]:
    return list(db.scalars(select(Person).order_by(Person.id)))


def get_person(db: Session, person_id: int) -> Person:
    return _get_person_or_404(db, person_id)


def create_person(db: Session, data: PersonCreate) -> Person:
    person = Person(name=data.name.strip(), role=data.role)
    db.add(person)
    db.commit()
    db.refresh(person)
    return person


def update_person(db: Session, person_id: int, data: PersonUpdate) -> Person:
    person = _get_person_or_404(db, person_id)
    if data.name is not None:
        person.name = data.name.strip()
    if data.role is not None:
        person.role = data.role
    db.commit()
    db.refresh(person)
    return person


def delete_person(db: Session, person_id: int) -> None:
    person = _get_person_or_404(db, person_id)
    try:
        db.delete(person)
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=400,
            detail="Нельзя удалить пользователя: с ним связаны смены или запросы",
        )


# Shifts
def list_shifts(db: Session, month: str | None = None) -> list[Shift]:
    statement = select(Shift).order_by(Shift.date, Shift.id)
    if month:
        try:
            first_day = date.fromisoformat(f"{month}-01")
        except ValueError:
            raise HTTPException(
                status_code=400,
                detail="Параметр month должен иметь формат YYYY-MM",
            )
        next_month = (first_day.month % 12) + 1
        next_year = first_day.year + (1 if first_day.month == 12 else 0)
        statement = statement.where(
            Shift.date >= first_day,
            Shift.date < date(next_year, next_month, 1),
        )
    return list(db.scalars(statement))


def get_shift(db: Session, shift_id: int) -> Shift:
    return _get_shift_or_404(db, shift_id)


def create_shift(db: Session, data: ShiftCreate) -> Shift:
    _get_person_or_404(db, data.person_id)
    shift = Shift(
        date=data.date,
        start_time=data.start_time,
        end_time=data.end_time,
        person_id=data.person_id,
    )
    db.add(shift)
    db.commit()
    db.refresh(shift)
    return shift


def update_shift(db: Session, shift_id: int, data: ShiftUpdate) -> Shift:
    shift = _get_shift_or_404(db, shift_id)
    if data.person_id is not None:
        _get_person_or_404(db, data.person_id)
        shift.person_id = data.person_id
    if data.start_time is not None:
        shift.start_time = data.start_time
    if data.end_time is not None:
        shift.end_time = data.end_time
    db.commit()
    db.refresh(shift)
    return shift


def delete_shift(db: Session, shift_id: int) -> None:
    shift = _get_shift_or_404(db, shift_id)
    try:
        db.delete(shift)
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=400,
            detail="Нельзя удалить смену: с ней связан запрос на обмен",
        )


# Exchange requests
def list_requests(db: Session, status: str | None = None) -> list[ExchangeRequest]:
    statement = select(ExchangeRequest).order_by(ExchangeRequest.id)
    if status:
        if status not in {"pending", "approved", "declined"}:
            raise HTTPException(
                status_code=400,
                detail="status должен быть one из: pending, approved, declined",
            )
        statement = statement.where(ExchangeRequest.status == status)
    return list(db.scalars(statement))


def get_request(db: Session, request_id: int) -> ExchangeRequest:
    return _get_request_or_404(db, request_id)


def create_request(db: Session, data: ExchangeRequestCreate) -> ExchangeRequest:
    requester = _get_person_or_404(db, data.requester_id)
    shift = _get_shift_or_404(db, data.shift_id)
    target_shift = _get_shift_or_404(db, data.target_shift_id)

    if data.shift_id == data.target_shift_id:
        raise HTTPException(
            status_code=400,
            detail="Нельзя обменяться сменой с самой собой",
        )
    if shift.person_id != requester.id:
        raise HTTPException(
            status_code=400,
            detail="Запросить обмен можно только за собственной смену",
        )
    if requester.role != "guard":
        raise HTTPException(
            status_code=400,
            detail="Запрос на обмен может создавать только дежурный",
        )
    if target_shift.person_id == requester.id:
        raise HTTPException(
            status_code=400,
            detail="Нельзя обменяться сменой с самим собой",
        )

    request = ExchangeRequest(
        requester_id=requester.id,
        shift_id=shift.id,
        target_shift_id=target_shift.id,
        reason=data.reason.strip(),
        status="pending",
    )
    db.add(request)
    db.commit()
    db.refresh(request)
    return request


def approve_request(
    db: Session, request_id: int, approved_by_id: int | None = None
) -> ExchangeRequest:
    request = _get_request_or_404(db, request_id)
    if request.status != "pending":
        raise HTTPException(
            status_code=400,
            detail="Подтвердить можно только запрос в статусе pending",
        )

    if approved_by_id is None:
        approver = db.scalar(select(Person).where(Person.role == "senior"))
        if approver is None:
            raise HTTPException(
                status_code=400,
                detail="В системе нет старшего для подтверждения",
            )
        approved_by_id = approver.id
    else:
        approver = db.get(Person, approved_by_id)
        if approver is None:
            raise _not_found("Старший")
        if approver.role != "senior":
            raise HTTPException(
                status_code=400,
                detail="Подтверждать запрос может только старший",
            )

    shift = _get_shift_or_404(db, request.shift_id)
    target_shift = _get_shift_or_404(db, request.target_shift_id)

    shift_owner, target_owner = shift.person_id, target_shift.person_id

    db.add(
        ReplacementRecord(
            shift_id=shift.id,
            from_person_id=shift_owner,
            to_person_id=target_owner,
            approved_by_id=approved_by_id,
        )
    )
    db.add(
        ReplacementRecord(
            shift_id=target_shift.id,
            from_person_id=target_owner,
            to_person_id=shift_owner,
            approved_by_id=approved_by_id,
        )
    )

    shift.person_id, target_shift.person_id = target_owner, shift_owner
    request.status = "approved"
    db.commit()
    db.refresh(request)
    return request


def decline_request(db: Session, request_id: int) -> ExchangeRequest:
    request = _get_request_or_404(db, request_id)
    if request.status != "pending":
        raise HTTPException(
            status_code=400,
            detail="Отклонить можно только запрос в статусе pending",
        )
    request.status = "declined"
    db.commit()
    db.refresh(request)
    return request


def delete_request(db: Session, request_id: int) -> None:
    request = _get_request_or_404(db, request_id)
    db.delete(request)
    db.commit()


# History
def list_history(db: Session) -> list[ReplacementRecord]:
    return list(
        db.scalars(
            select(ReplacementRecord).order_by(
                ReplacementRecord.approved_at.desc(), ReplacementRecord.id
            )
        )
    )


def get_history_record(db: Session, record_id: int) -> ReplacementRecord:
    record = db.get(ReplacementRecord, record_id)
    if record is None:
        raise _not_found("Запись истории")
    return record