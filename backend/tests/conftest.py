import os
from datetime import date
from pathlib import Path

import psycopg
import pytest
from dotenv import load_dotenv
from fastapi.testclient import TestClient
from psycopg import sql
from sqlalchemy import text
from sqlalchemy.engine import make_url

BACKEND_DIR = Path(__file__).resolve().parents[1]
load_dotenv(BACKEND_DIR / ".env")

DEFAULT_TEST_URL = (
    "postgresql+psycopg://shift:shift@localhost:5432/shift_exchange_test"
)
TEST_DATABASE_URL = os.environ.get("TEST_DATABASE_URL", DEFAULT_TEST_URL)
# Настройки приложения читают DATABASE_URL, поэтому тесты не трогают рабочую БД.
os.environ["DATABASE_URL"] = TEST_DATABASE_URL

from app.database import Base, SessionLocal, engine  # noqa: E402
from app.main import app  # noqa: E402
from app.models import Person, Shift, User  # noqa: E402
from app.security import hash_password  # noqa: E402

DEMO_PASSWORD = "demo12345"


def _ensure_test_database() -> None:
    parsed = make_url(TEST_DATABASE_URL)
    if parsed.get_backend_name() != "postgresql":
        return

    with psycopg.connect(
        host=parsed.host,
        port=parsed.port,
        user=parsed.username,
        password=parsed.password,
        dbname="postgres",
        autocommit=True,
    ) as connection:
        exists = connection.execute(
            "SELECT 1 FROM pg_database WHERE datname = %s",
            (parsed.database,),
        ).fetchone()
        if not exists:
            connection.execute(
                sql.SQL("CREATE DATABASE {}").format(
                    sql.Identifier(parsed.database)
                )
            )


@pytest.fixture(scope="session", autouse=True)
def database_schema():
    _ensure_test_database()
    Base.metadata.drop_all(engine)
    Base.metadata.create_all(engine)
    yield
    Base.metadata.drop_all(engine)


@pytest.fixture(autouse=True)
def clean_tables():
    yield
    with engine.begin() as connection:
        connection.execute(
            text(
                "TRUNCATE TABLE refresh_tokens, users, replacement_history, "
                "exchange_requests, shifts, persons RESTART IDENTITY CASCADE"
            )
        )


@pytest.fixture
def client():
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture
def db():
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture
def account_factory(db):
    def create(
        login: str,
        role: str = "guard",
        name: str | None = None,
        password: str = DEMO_PASSWORD,
    ) -> User:
        person = Person(name=name or login, role=role)
        user = User(
            person=person,
            login=login,
            password_hash=hash_password(password),
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        return user

    return create


@pytest.fixture
def shift_factory(db):
    def create(person_id: int, shift_date: date | None = None) -> Shift:
        shift = Shift(
            date=shift_date or date(2026, 1, 1),
            start_time="09:00",
            end_time="21:00",
            person_id=person_id,
        )
        db.add(shift)
        db.commit()
        db.refresh(shift)
        return shift

    return create


@pytest.fixture
def login(client):
    def do(login_name: str, password: str = DEMO_PASSWORD) -> dict:
        response = client.post(
            "/api/auth/login",
            json={"login": login_name, "password": password},
        )
        assert response.status_code == 200, response.text
        return response.json()

    return do


@pytest.fixture
def auth_headers(login):
    def do(login_name: str, password: str = DEMO_PASSWORD) -> dict:
        tokens = login(login_name, password)
        return {"Authorization": f"Bearer {tokens['access_token']}"}

    return do
