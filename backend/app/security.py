import secrets
from datetime import datetime, timedelta, timezone
from hashlib import sha256

import jwt
from pwdlib import PasswordHash

from .config import get_settings

settings = get_settings()

# pwdlib рекомендует Argon2id с параметрами time_cost=3, memory_cost=64 MiB.
password_hasher = PasswordHash.recommended()

ACCESS_TOKEN_TYPE = "access"


class InvalidAccessTokenError(ValueError):
    pass


def hash_password(password: str) -> str:
    return password_hasher.hash(password)


def verify_password(password: str, password_hash: str) -> bool:
    return password_hasher.verify(password, password_hash)


def create_access_token(user_id: int) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": str(user_id),
        "type": ACCESS_TOKEN_TYPE,
        "iat": now,
        "exp": now + timedelta(minutes=settings.access_token_ttl_minutes),
        "jti": secrets.token_hex(8),
    }
    return jwt.encode(
        payload,
        settings.jwt_secret_key,
        algorithm=settings.jwt_algorithm,
    )


def decode_access_token(token: str) -> int:
    try:
        payload = jwt.decode(
            token,
            settings.jwt_secret_key,
            algorithms=[settings.jwt_algorithm],
        )
        if payload.get("type") != ACCESS_TOKEN_TYPE:
            raise InvalidAccessTokenError("Неверный тип токена")
        subject = payload.get("sub")
        user_id = int(subject)
    except (jwt.PyJWTError, TypeError, ValueError) as exc:
        raise InvalidAccessTokenError("Недействительный access-токен") from exc
    return user_id


def generate_refresh_token() -> str:
    return secrets.token_urlsafe(48)


def hash_refresh_token(token: str) -> str:
    return sha256(token.encode("utf-8")).hexdigest()


def refresh_token_expires_at() -> datetime:
    return datetime.now(timezone.utc) + timedelta(
        days=settings.refresh_token_ttl_days
    )


def access_token_expires_in() -> int:
    return settings.access_token_ttl_minutes * 60


def refresh_token_expires_in() -> int:
    return settings.refresh_token_ttl_days * 24 * 60 * 60
