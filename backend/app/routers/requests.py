from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session

from ..auth import get_current_user, require_senior
from ..crud import (
    approve_request,
    create_request,
    decline_request,
    delete_request,
    get_request,
    list_requests,
)
from ..database import get_db
from ..models import ExchangeRequest, User
from ..schemas import ExchangeRequestCreate, ExchangeRequestOut

router = APIRouter(
    prefix="/api/requests",
    tags=["exchange-requests"],
    dependencies=[Depends(get_current_user)],
)


def _is_senior(user: User) -> bool:
    return user.person is not None and user.person.role == "senior"


def _ensure_request_access(user: User, request: ExchangeRequest) -> None:
    if _is_senior(user):
        return
    if request.requester_id != user.person_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Нет доступа к чужому запросу",
        )


@router.get("", response_model=list[ExchangeRequestOut])
def read_requests(
    request_status: str | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    requester_id = None if _is_senior(current_user) else current_user.person_id
    return list_requests(db, request_status, requester_id)


@router.post(
    "",
    response_model=ExchangeRequestOut,
    status_code=status.HTTP_201_CREATED,
)
def add_request(
    data: ExchangeRequestCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return create_request(db, data, current_user.person)


@router.get("/{request_id}", response_model=ExchangeRequestOut)
def read_request(
    request_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    request = get_request(db, request_id)
    _ensure_request_access(current_user, request)
    return request


@router.post(
    "/{request_id}/approve",
    response_model=ExchangeRequestOut,
)
def approve(
    request_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_senior),
):
    return approve_request(db, request_id, current_user.person)


@router.post(
    "/{request_id}/decline",
    response_model=ExchangeRequestOut,
)
def decline(
    request_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_senior),
):
    return decline_request(db, request_id)


@router.delete("/{request_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_request(
    request_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    request = get_request(db, request_id)
    _ensure_request_access(current_user, request)
    delete_request(db, request_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
