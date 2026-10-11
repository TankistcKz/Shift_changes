from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.orm import Session

from ..crud import (
    approve_request,
    create_request,
    decline_request,
    delete_request,
    get_request,
    list_requests,
)
from ..database import get_db
from ..schemas import (
    ExchangeRequestCreate,
    ExchangeRequestOut,
    ModerationAction,
)

router = APIRouter(prefix="/api/requests", tags=["exchange-requests"])


@router.get("", response_model=list[ExchangeRequestOut])
def read_requests(
    request_status: str | None = None, db: Session = Depends(get_db)
):
    return list_requests(db, request_status)


@router.post("", response_model=ExchangeRequestOut, status_code=status.HTTP_201_CREATED)
def add_request(data: ExchangeRequestCreate, db: Session = Depends(get_db)):
    return create_request(db, data)


@router.get("/{request_id}", response_model=ExchangeRequestOut)
def read_request(request_id: int, db: Session = Depends(get_db)):
    return get_request(db, request_id)


@router.post(
    "/{request_id}/approve",
    response_model=ExchangeRequestOut,
)
def approve(
    request_id: int,
    action: ModerationAction,
    db: Session = Depends(get_db),
):
    return approve_request(db, request_id, action.approved_by_id)


@router.post(
    "/{request_id}/decline",
    response_model=ExchangeRequestOut,
)
def decline(request_id: int, db: Session = Depends(get_db)):
    return decline_request(db, request_id)


@router.delete("/{request_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_request(request_id: int, db: Session = Depends(get_db)):
    delete_request(db, request_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)