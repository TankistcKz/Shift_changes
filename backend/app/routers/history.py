from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..crud import get_history_record, list_history
from ..database import get_db
from ..schemas import ReplacementRecordOut

router = APIRouter(prefix="/api/history", tags=["history"])


@router.get("", response_model=list[ReplacementRecordOut])
def read_history(db: Session = Depends(get_db)):
    return list_history(db)


@router.get("/{record_id}", response_model=ReplacementRecordOut)
def read_history_record(record_id: int, db: Session = Depends(get_db)):
    return get_history_record(db, record_id)