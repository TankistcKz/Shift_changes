from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.orm import Session

from ..crud import (
    create_person,
    delete_person,
    get_person,
    list_persons,
    update_person,
)
from ..database import get_db
from ..schemas import PersonCreate, PersonOut, PersonUpdate

router = APIRouter(prefix="/api/persons", tags=["persons"])


@router.get("", response_model=list[PersonOut])
def read_persons(db: Session = Depends(get_db)):
    return list_persons(db)


@router.post("", response_model=PersonOut, status_code=status.HTTP_201_CREATED)
def add_person(data: PersonCreate, db: Session = Depends(get_db)):
    return create_person(db, data)


@router.get("/{person_id}", response_model=PersonOut)
def read_person(person_id: int, db: Session = Depends(get_db)):
    return get_person(db, person_id)


@router.patch("/{person_id}", response_model=PersonOut)
def modify_person(
    person_id: int, data: PersonUpdate, db: Session = Depends(get_db)
):
    return update_person(db, person_id, data)


@router.delete("/{person_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_person(person_id: int, db: Session = Depends(get_db)):
    delete_person(db, person_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)