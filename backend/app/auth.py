from datetime import datetime, timezone

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, selectinload

from .database import get_db
from .models import Person, RefreshToken, User, utcnow
from .schemas import RegisterRequest, TokenResponse, UserOut
from .security import (
    InvalidAccessTokenError,
    access_token_expires_in,
    create_access_token,
    decode_access_token,
    generate_refresh_token,
    hash_password,
    hash_refresh_token,
    refresh_token_expires_at,
    refresh_token_expires_in,
    verify_password,
)

bearer_scheme = HTTPBearer(auto_error=False)


def _unauthorized(detail: str = "Не удалось подтвердить учётные данные"):
    return HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail=detail,
        headers={"WWW-Authenticate": "Bearer"},
    )


def get_user_by_login(db: Session, login: str) -> User | None:
    return db.scalar(
        select(User)
        .options(selectinload(User.person))
        .where(User.login == login.strip().lower())
    )


def register_user(db: Session, data: RegisterRequest) -> User:
    login = data.login.strip().lower()
    if db.scalar(select(User).where(User.login == login)) is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Логин уже занят",
        )

    # Самостоятельная регистрация всегда создаёт только дежурного.
    person = Person(name=data.name.strip(), role="guard")
    user = User(
        person=person,
        login=login,
        password_hash=hash_password(data.password),
    )
    db.add(user)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Логин уже занят",
        )
    db.refresh(user)
    return user


def authenticate_user(db: Session, login: str, password: str) -> User:
    user = get_user_by_login(db, login)
    if user is None or not verify_password(password, user.password_hash):
        raise _unauthorized("Неверный логин или пароль")
    if not user.is_active:
        raise _unauthorized("Учётная запись отключена")
    return user


def issue_token_pair(db: Session, user: User) -> tuple[str, str]:
    access_token = create_access_token(user.id)
    refresh_token = generate_refresh_token()
    db.add(
        RefreshToken(
            user_id=user.id,
            token_hash=hash_refresh_token(refresh_token),
            expires_at=refresh_token_expires_at(),
        )
    )
    db.commit()
    return access_token, refresh_token


def rotate_refresh_token(
    db: Session, raw_refresh_token: str
) -> tuple[User, str, str]:
    token_hash = hash_refresh_token(raw_refresh_token)
    record = db.scalar(
        select(RefreshToken)
        .options(selectinload(RefreshToken.user).selectinload(User.person))
        .where(RefreshToken.token_hash == token_hash)
        .with_for_update()
    )
    now = utcnow()

    if (
        record is None
        or record.revoked_at is not None
        or _as_utc(record.expires_at) <= now
    ):
        raise _unauthorized("Refresh-токен недействителен или истёк")

    user = record.user
    if user is None or not user.is_active:
        record.revoked_at = now
        db.commit()
        raise _unauthorized("Учётная запись отключена")

    # Ротация: старый refresh-токен отзывается, клиент получает новую пару.
    record.revoked_at = now
    new_refresh_token = generate_refresh_token()
    db.add(
        RefreshToken(
            user_id=user.id,
            token_hash=hash_refresh_token(new_refresh_token),
            expires_at=refresh_token_expires_at(),
        )
    )
    db.commit()

    access_token = create_access_token(user.id)
    return user, access_token, new_refresh_token


def revoke_refresh_token(
    db: Session, raw_refresh_token: str, user_id: int
) -> None:
    token_hash = hash_refresh_token(raw_refresh_token)
    record = db.scalar(
        select(RefreshToken).where(
            RefreshToken.token_hash == token_hash,
            RefreshToken.user_id == user_id,
        )
    )
    if record is not None and record.revoked_at is None:
        record.revoked_at = utcnow()
        db.commit()


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> User:
    if credentials is None or credentials.scheme.lower() != "bearer":
        raise _unauthorized()

    try:
        user_id = decode_access_token(credentials.credentials)
    except InvalidAccessTokenError:
        raise _unauthorized("Недействительный или истёкший access-токен")

    user = db.scalar(
        select(User)
        .options(selectinload(User.person))
        .where(User.id == user_id)
    )
    if user is None or not user.is_active:
        raise _unauthorized("Учётная запись не найдена или отключена")
    return user


def require_senior(
    current_user: User = Depends(get_current_user),
) -> User:
    if current_user.person is None or current_user.person.role != "senior":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Недостаточно прав: действие доступно только старшему",
        )
    return current_user


def build_token_response(
    user: User, access_token: str, refresh_token: str
) -> TokenResponse:
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        expires_in=access_token_expires_in(),
        refresh_expires_in=refresh_token_expires_in(),
        user=UserOut.model_validate(user),
    )


def _as_utc(value: datetime) -> datetime:
    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)
    return value.astimezone(timezone.utc)
