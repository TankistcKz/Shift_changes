from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.orm import Session

from ..crud import (
    create_shift,
    delete_shift,
    get_shift,
    list_shifts,
    update_shift,
)
from ..database import get_db
from ..schemas import ShiftCreate, ShiftOut, ShiftUpdate

router = APIRouter(prefix="/api/shifts", tags=["shifts"])


@router.get("", response_model=list[ShiftOut])
def read_shifts(
    month: str | None = None, db: Session = Depends(get_db)
):
    return list_shifts(db, month)


@router.post("", response_model=ShiftOut, status_code=status.HTTP_201_CREATED)
def add_shift(data: ShiftCreate, db: Session = Depends(get_db)):
    return create_shift(db, data)


@router.get("/{shift_id}", response_model=ShiftOut)
def read_shift(shift_id: int, db: Session = Depends(get_db)):
    return get_shift(db, shift_id)


@router.patch("/{shift_id}", response_model=ShiftOut)
def modify_shift(
    shift_id: int, data: ShiftUpdate, db: Session = Depends(get_db)
):
    return update_shift(db, shift_id, data)


@router.delete("/{shift_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_shift(shift_id: int, db: Session = Depends(get_db)):
    delete_shift(db, shift_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)