from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.orm import Session

from ..auth import (
    authenticate_user,
    build_token_response,
    get_current_user,
    issue_token_pair,
    register_user,
    revoke_refresh_token,
    rotate_refresh_token,
)
from ..database import get_db
from ..models import User
from ..schemas import (
    LoginRequest,
    LogoutRequest,
    RefreshTokenRequest,
    RegisterRequest,
    TokenResponse,
    UserOut,
)

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post(
    "/register",
    response_model=TokenResponse,
    status_code=status.HTTP_201_CREATED,
)
def register(data: RegisterRequest, db: Session = Depends(get_db)):
    user = register_user(db, data)
    access_token, refresh_token = issue_token_pair(db, user)
    return build_token_response(user, access_token, refresh_token)


@router.post("/login", response_model=TokenResponse)
def login(data: LoginRequest, db: Session = Depends(get_db)):
    user = authenticate_user(db, data.login, data.password)
    access_token, refresh_token = issue_token_pair(db, user)
    return build_token_response(user, access_token, refresh_token)


@router.post("/refresh", response_model=TokenResponse)
def refresh(data: RefreshTokenRequest, db: Session = Depends(get_db)):
    user, access_token, refresh_token = rotate_refresh_token(
        db, data.refresh_token
    )
    return build_token_response(user, access_token, refresh_token)


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout(
    data: LogoutRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    revoke_refresh_token(db, data.refresh_token, current_user.id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/me", response_model=UserOut)
def me(current_user: User = Depends(get_current_user)):
    return current_user
