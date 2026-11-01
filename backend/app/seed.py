from datetime import datetime, timedelta

from sqlalchemy import inspect, select
from sqlalchemy.orm import Session

from .database import SessionLocal, engine
from .models import (
    ExchangeRequest,
    Person,
    ReplacementRecord,
    Shift,
    User,
)
from .security import hash_password

DEMO_PASSWORD = "demo12345"
DEMO_ACCOUNTS = {
    "volkov": "Александр Волков",
    "sokolova": "Мария Соколова",
    "kozlov": "Дмитрий Козлов",
    "morozova": "Елена Морозова",
    "petrov": "Иван Петров",
    "belova": "Ольга Белова",
}

SENIOR_NAME = "Александр Волков"
GUARD_NAMES = [
    "Мария Соколова",
    "Дмитрий Козлов",
    "Елена Морозова",
    "Иван Петров",
    "Ольга Белова",
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
    tables = set(inspector.get_table_names())
    if not {"persons", "users", "refresh_tokens"} <= tables:
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


def _ensure_demo_users(
    db: Session, persons_by_name: dict[str, Person]
) -> int:
    users = list(db.scalars(select(User)))
    existing_logins = {user.login for user in users}
    used_person_ids = {user.person_id for user in users}

    created = 0
    for login, name in DEMO_ACCOUNTS.items():
        person = persons_by_name.get(name)
        if (
            login in existing_logins
            or person is None
            or person.id in used_person_ids
        ):
            continue
        db.add(
            User(
                person_id=person.id,
                login=login,
                password_hash=hash_password(DEMO_PASSWORD),
            )
        )
        created += 1
    return created


def seed() -> None:
    _check_tables()
    db: Session = SessionLocal()

    try:
        if db.scalar(select(Person).limit(1)):
            persons = list(db.scalars(select(Person)))
            created = _ensure_demo_users(
                db, {person.name: person for person in persons}
            )
            db.commit()
            print(
                "База уже заполнена, добавлено демо-аккаунтов: "
                f"{created}. Пароль демо-аккаунтов: {DEMO_PASSWORD}"
            )
            return

        senior = Person(name=SENIOR_NAME, role="senior")
        guards = [Person(name=name, role="guard") for name in GUARD_NAMES]
        db.add(senior)
        db.add_all(guards)
        db.flush()

        all_persons = [senior] + guards
        by_name = {person.name: person for person in all_persons}
        created_users = _ensure_demo_users(db, by_name)

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
        print(
            "Seed завершён: "
            f"{len(all_persons)} пользователей, "
            f"{created_users} учётных записей, "
            f"{len(shifts)} смен, "
            f"{len(SAMPLE_REQUESTS)} запросов, "
            f"{len(SAMPLE_HISTORY)} записей истории. "
            f"Пароль демо-аккаунтов: {DEMO_PASSWORD}"
        )
    finally:
        db.close()


if __name__ == "__main__":
    seed()
