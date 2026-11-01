from datetime import datetime, timedelta, timezone

import jwt
from sqlalchemy import select

from app.config import get_settings
from app.models import RefreshToken, User, utcnow
from app.security import hash_refresh_token, verify_password

from conftest import DEMO_PASSWORD

settings = get_settings()


def register(client, login="new_guard", name="Новый Дежурный"):
    return client.post(
        "/api/auth/register",
        json={"login": login, "password": DEMO_PASSWORD, "name": name},
    )


def auth_header(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}


def test_register_hashes_password_with_argon2id_and_returns_tokens(client, db):
    response = register(client, login="New.Guard")

    assert response.status_code == 201, response.text
    body = response.json()
    assert body["token_type"] == "bearer"
    assert body["expires_in"] > 0
    assert body["refresh_expires_in"] > body["expires_in"]
    assert body["user"]["login"] == "new.guard"
    assert body["user"]["person"]["role"] == "guard"

    user = db.scalar(select(User).where(User.login == "new.guard"))
    assert user is not None
    assert user.password_hash.startswith("$argon2id$")
    assert verify_password(DEMO_PASSWORD, user.password_hash)
    assert not user.password_hash.startswith(DEMO_PASSWORD)

    me = client.get(
        "/api/auth/me", headers=auth_header(body["access_token"])
    )
    assert me.status_code == 200
    assert me.json()["person_id"] == user.person_id


def test_register_always_creates_guard_and_rejects_extra_fields(client):
    response = client.post(
        "/api/auth/register",
        json={
            "login": "sneaky",
            "password": DEMO_PASSWORD,
            "name": "Хитрая регистрация",
            "role": "senior",
        },
    )
    assert response.status_code == 422

    response = register(client, login="normal_guard")
    assert response.status_code == 201
    assert response.json()["user"]["person"]["role"] == "guard"


def test_register_rejects_duplicate_login_and_weak_password(client):
    assert register(client, login="duplicate").status_code == 201

    duplicate = register(client, login="DUPLICATE")
    assert duplicate.status_code == 409

    weak = client.post(
        "/api/auth/register",
        json={"login": "weak", "password": "short", "name": "Слабый пароль"},
    )
    assert weak.status_code == 422


def test_login_and_invalid_credentials(client):
    assert register(client, login="login_user").status_code == 201

    ok = client.post(
        "/api/auth/login",
        json={"login": "LOGIN_USER", "password": DEMO_PASSWORD},
    )
    assert ok.status_code == 200
    assert ok.json()["user"]["login"] == "login_user"

    wrong = client.post(
        "/api/auth/login",
        json={"login": "login_user", "password": "wrong_password"},
    )
    assert wrong.status_code == 401

    unknown = client.post(
        "/api/auth/login",
        json={"login": "nobody", "password": DEMO_PASSWORD},
    )
    assert unknown.status_code == 401


def test_protected_routes_require_access_token(client):
    assert client.get("/api/health").status_code == 200
    assert client.get("/api/persons").status_code == 401
    assert client.get("/api/shifts").status_code == 401
    assert client.get("/api/requests").status_code == 401
    assert client.get("/api/history").status_code == 401
    assert client.get("/api/auth/me").status_code == 401

    assert register(client, login="with_token").status_code == 201
    tokens = client.post(
        "/api/auth/login",
        json={"login": "with_token", "password": DEMO_PASSWORD},
    ).json()
    assert (
        client.get(
            "/api/persons", headers=auth_header(tokens["access_token"])
        ).status_code
        == 200
    )


def test_invalid_and_expired_access_tokens_are_rejected(client):
    assert register(client, login="token_user").status_code == 201

    assert (
        client.get("/api/auth/me", headers=auth_header("not-a-jwt")).status_code
        == 401
    )

    now = datetime.now(timezone.utc)
    expired = jwt.encode(
        {
            "sub": "1",
            "type": "access",
            "iat": now - timedelta(hours=2),
            "exp": now - timedelta(minutes=1),
        },
        settings.jwt_secret_key,
        algorithm=settings.jwt_algorithm,
    )
    assert (
        client.get("/api/auth/me", headers=auth_header(expired)).status_code
        == 401
    )

    wrong_type = jwt.encode(
        {
            "sub": "1",
            "type": "refresh",
            "iat": now,
            "exp": now + timedelta(minutes=15),
        },
        settings.jwt_secret_key,
        algorithm=settings.jwt_algorithm,
    )
    assert (
        client.get("/api/auth/me", headers=auth_header(wrong_type)).status_code
        == 401
    )


def test_refresh_rotates_token_and_revokes_previous_one(client, db):
    response = register(client, login="refresh_user")
    tokens = response.json()
    old_refresh = tokens["refresh_token"]

    stored = db.scalar(
        select(RefreshToken).where(
            RefreshToken.token_hash == hash_refresh_token(old_refresh)
        )
    )
    assert stored is not None
    assert stored.token_hash != old_refresh
    assert stored.revoked_at is None

    refreshed = client.post(
        "/api/auth/refresh", json={"refresh_token": old_refresh}
    )
    assert refreshed.status_code == 200, refreshed.text
    new_tokens = refreshed.json()
    assert new_tokens["refresh_token"] != old_refresh
    assert new_tokens["access_token"] != tokens["access_token"]

    reused = client.post(
        "/api/auth/refresh", json={"refresh_token": old_refresh}
    )
    assert reused.status_code == 401

    new_refresh = client.post(
        "/api/auth/refresh",
        json={"refresh_token": new_tokens["refresh_token"]},
    )
    assert new_refresh.status_code == 200

    db.expire_all()
    old_stored = db.scalar(
        select(RefreshToken).where(
            RefreshToken.token_hash == hash_refresh_token(old_refresh)
        )
    )
    assert old_stored is not None
    assert old_stored.revoked_at is not None


def test_expired_or_unknown_refresh_token_is_rejected(client, db):
    response = register(client, login="expired_refresh")
    tokens = response.json()

    stored = db.scalar(
        select(RefreshToken).where(
            RefreshToken.token_hash
            == hash_refresh_token(tokens["refresh_token"])
        )
    )
    assert stored is not None
    stored.expires_at = utcnow() - timedelta(seconds=1)
    db.commit()

    expired = client.post(
        "/api/auth/refresh",
        json={"refresh_token": tokens["refresh_token"]},
    )
    assert expired.status_code == 401

    unknown = client.post(
        "/api/auth/refresh", json={"refresh_token": "unknown-token"}
    )
    assert unknown.status_code == 401


def test_logout_revokes_current_refresh_token(client):
    response = register(client, login="logout_user")
    tokens = response.json()

    logout = client.post(
        "/api/auth/logout",
        headers=auth_header(tokens["access_token"]),
        json={"refresh_token": tokens["refresh_token"]},
    )
    assert logout.status_code == 204

    rejected = client.post(
        "/api/auth/refresh",
        json={"refresh_token": tokens["refresh_token"]},
    )
    assert rejected.status_code == 401

    # Logout отзывает refresh, но access-токен остаётся валидным до истечения.
    assert (
        client.get(
            "/api/auth/me", headers=auth_header(tokens["access_token"])
        ).status_code
        == 200
    )

    repeated = client.post(
        "/api/auth/logout",
        headers=auth_header(tokens["access_token"]),
        json={"refresh_token": tokens["refresh_token"]},
    )
    assert repeated.status_code == 204
