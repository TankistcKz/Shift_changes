from datetime import datetime, timedelta, timezone

from sqlalchemy import inspect, select
from sqlalchemy.orm import Session

from .database import SessionLocal, engine
from .models import (
    ExchangeRequest,
    Person,
    ReplacementRecord,
    Shift,
)

SENIOR = Person(name="Александр Волков", role="senior")
GUARDS = [
    Person(name="Мария Соколова", role="guard"),
    Person(name="Дмитрий Козлов", role="guard"),
    Person(name="Елена Морозова", role="guard"),
    Person(name="Иван Петров", role="guard"),
    Person(name="Ольга Белова", role="guard"),
]

SAMPLE_REQUESTS = [
    {
        "requester": "Елена Морозова",
        "shift_day": 3,
        "target_day": 12,
        "reason": "Срочные дела 3 числа, прошу обменяться сменой.",
        "status": "pending",
    },
    {
        "requester": "Ольга Белова",
        "shift_day": 5,
        "target_day": 11,
        "reason": "Нужен отгул, готов взять дежурство вместо этого.",
        "status": "pending",
    },
    {
        "requester": "Мария Соколова",
        "shift_day": 1,
        "target_day": 17,
        "reason": "Просьба об обмене на более удобное время.",
        "status": "declined",
    },
]

SAMPLE_HISTORY = [
    {"shift_day": 2, "from": "Дмитрий Козлов", "to": "Ольга Белова"},
    {"shift_day": 7, "from": "Дмитрий Козлов", "to": "Елена Морозова"},
]


def _check_tables() -> None:
    inspector = inspect(engine)
    if "persons" not in inspector.get_table_names():
        raise RuntimeError(
            "Таблицы не созданы. Сначала выполните: alembic upgrade head"
        )


def build_shifts(year: int, month: int, guards: list[Person]) -> list[Shift]:
    days_in_month = (
        datetime(year, month + 1, 1) - datetime(year, month, 1)
    ).days
    shifts: list[Shift] = []
    for day in range(1, days_in_month + 1):
        shifts.append(
            Shift(
                date=datetime(year, month, day).date(),
                start_time="09:00",
                end_time="21:00",
                person_id=guards[(day - 1) % len(guards)].id,
            )
        )
    return shifts


def seed() -> None:
    _check_tables()
    db: Session = SessionLocal()

    if db.scalar(select(Person).limit(1)):
        print("База уже заполнена, пропускаю seed.")
        db.close()
        return

    db.add(SENIOR)
    db.add_all(GUARDS)
    db.flush()
    all_persons = [SENIOR] + GUARDS
    guards = GUARDS
    by_name = {person.name: person for person in all_persons}
    senior = SENIOR

    now = datetime.now()
    shifts = build_shifts(now.year, now.month, guards)
    db.add_all(shifts)
    db.flush()
    shift_by_day = {shift.date.day: shift for shift in shifts}

    for item in SAMPLE_REQUESTS:
        requester = by_name[item["requester"]]
        db.add(
            ExchangeRequest(
                requester_id=requester.id,
                shift_id=shift_by_day[item["shift_day"]].id,
                target_shift_id=shift_by_day[item["target_day"]].id,
                reason=item["reason"],
                status=item["status"],
                created_at=now - timedelta(days=2),
            )
        )

    for item in SAMPLE_HISTORY:
        shift = shift_by_day[item["shift_day"]]
        from_person = by_name[item["from"]]
        to_person = by_name[item["to"]]
        shift.person_id = to_person.id
        db.add(
            ReplacementRecord(
                shift_id=shift.id,
                from_person_id=from_person.id,
                to_person_id=to_person.id,
                approved_by_id=senior.id,
                approved_at=now - timedelta(days=3),
            )
        )

    db.commit()
    db.close()
    print(
        "Seed завершён: "
        f"{len(all_persons)} пользователей, "
        f"{len(shifts)} смен, "
        f"{len(SAMPLE_REQUESTS)} запросов, "
        f"{len(SAMPLE_HISTORY)} записей истории."
    )


if __name__ == "__main__":
    seed()