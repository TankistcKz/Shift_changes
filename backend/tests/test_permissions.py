from datetime import date

from sqlalchemy import select

from app.models import ReplacementRecord


def bearer(tokens: dict) -> dict[str, str]:
    return {"Authorization": f"Bearer {tokens['access_token']}"}


def create_request(client, headers, shift_id, target_shift_id, reason="Нужен обмен"):
    return client.post(
        "/api/requests",
        headers=headers,
        json={
            "shift_id": shift_id,
            "target_shift_id": target_shift_id,
            "reason": reason,
        },
    )


def setup_people(account_factory, shift_factory):
    senior = account_factory("senior", role="senior", name="Старший Смены")
    guard = account_factory("guard", role="guard", name="Дежурный Первый")
    other = account_factory("other", role="guard", name="Дежурный Второй")
    guard_shift = shift_factory(guard.person_id, date(2026, 2, 2))
    other_shift = shift_factory(other.person_id, date(2026, 2, 3))
    return senior, guard, other, guard_shift, other_shift


def test_guard_cannot_mutate_persons_and_shifts(
    client, account_factory, shift_factory, login
):
    _senior, guard, _other, guard_shift, _other_shift = setup_people(
        account_factory, shift_factory
    )
    guard_headers = bearer(login("guard"))
    senior_headers = bearer(login("senior"))

    assert (
        client.post(
            "/api/persons",
            headers=guard_headers,
            json={"name": "Новый", "role": "guard"},
        ).status_code
        == 403
    )
    assert (
        client.patch(
            f"/api/persons/{guard.person_id}",
            headers=guard_headers,
            json={"name": "Изменённый"},
        ).status_code
        == 403
    )
    assert (
        client.delete(
            f"/api/persons/{guard.person_id}", headers=guard_headers
        ).status_code
        == 403
    )

    assert (
        client.post(
            "/api/shifts",
            headers=guard_headers,
            json={
                "date": "2026-02-10",
                "start_time": "09:00",
                "end_time": "21:00",
                "person_id": guard.person_id,
            },
        ).status_code
        == 403
    )
    assert (
        client.patch(
            f"/api/shifts/{guard_shift.id}",
            headers=guard_headers,
            json={"start_time": "10:00"},
        ).status_code
        == 403
    )
    assert (
        client.delete(
            f"/api/shifts/{guard_shift.id}", headers=guard_headers
        ).status_code
        == 403
    )

    created_person = client.post(
        "/api/persons",
        headers=senior_headers,
        json={"name": "Новый Дежурный", "role": "guard"},
    )
    assert created_person.status_code == 201
    created_shift = client.post(
        "/api/shifts",
        headers=senior_headers,
        json={
            "date": "2026-02-11",
            "start_time": "09:00",
            "end_time": "21:00",
            "person_id": created_person.json()["id"],
        },
    )
    assert created_shift.status_code == 201


def test_guard_sees_only_own_requests_and_cannot_moderate(
    client, account_factory, shift_factory, login, db
):
    senior, guard, other, guard_shift, other_shift = setup_people(
        account_factory, shift_factory
    )
    guard_headers = bearer(login("guard"))
    other_headers = bearer(login("other"))
    senior_headers = bearer(login("senior"))

    spoofed = client.post(
        "/api/requests",
        headers=guard_headers,
        json={
            "shift_id": guard_shift.id,
            "target_shift_id": other_shift.id,
            "reason": "Попытка подставить чужой requester_id",
            "requester_id": other.person_id,
        },
    )
    assert spoofed.status_code == 422

    created = create_request(
        client, guard_headers, guard_shift.id, other_shift.id
    )
    assert created.status_code == 201, created.text
    request_id = created.json()["id"]
    assert created.json()["requester_id"] == guard.person_id

    own_requests = client.get("/api/requests", headers=guard_headers)
    assert own_requests.status_code == 200
    assert [item["id"] for item in own_requests.json()] == [request_id]

    assert client.get("/api/requests", headers=other_headers).json() == []
    assert (
        client.get(
            f"/api/requests/{request_id}", headers=other_headers
        ).status_code
        == 403
    )
    assert (
        client.delete(
            f"/api/requests/{request_id}", headers=other_headers
        ).status_code
        == 403
    )

    assert (
        client.post(
            f"/api/requests/{request_id}/approve", headers=guard_headers
        ).status_code
        == 403
    )
    assert (
        client.post(
            f"/api/requests/{request_id}/decline", headers=guard_headers
        ).status_code
        == 403
    )

    all_requests = client.get("/api/requests", headers=senior_headers)
    assert all_requests.status_code == 200
    assert [item["id"] for item in all_requests.json()] == [request_id]

    approved = client.post(
        f"/api/requests/{request_id}/approve",
        headers=senior_headers,
        json={"approved_by_id": guard.person_id},
    )
    assert approved.status_code == 200, approved.text
    assert approved.json()["status"] == "approved"

    swapped_guard_shift = client.get(
        f"/api/shifts/{guard_shift.id}", headers=senior_headers
    ).json()
    swapped_other_shift = client.get(
        f"/api/shifts/{other_shift.id}", headers=senior_headers
    ).json()
    assert swapped_guard_shift["person_id"] == other.person_id
    assert swapped_other_shift["person_id"] == guard.person_id

    db.expire_all()
    records = list(db.scalars(select(ReplacementRecord)))
    assert len(records) == 2
    assert {record.approved_by_id for record in records} == {senior.person_id}


def test_guard_cannot_request_exchange_for_foreign_shift(
    client, account_factory, shift_factory, login
):
    _senior, _guard, _other, guard_shift, other_shift = setup_people(
        account_factory, shift_factory
    )
    guard_headers = bearer(login("guard"))

    foreign = create_request(
        client, guard_headers, other_shift.id, guard_shift.id
    )
    assert foreign.status_code == 403

    senior_headers = bearer(login("senior"))
    senior_attempt = create_request(
        client, senior_headers, guard_shift.id, other_shift.id
    )
    assert senior_attempt.status_code == 403


def test_senior_can_update_shift_date(
    client, account_factory, shift_factory, login
):
    _senior, _guard, _other, guard_shift, _other_shift = setup_people(
        account_factory, shift_factory
    )
    senior_headers = bearer(login("senior"))

    updated = client.patch(
        f"/api/shifts/{guard_shift.id}",
        headers=senior_headers,
        json={"date": "2026-02-20"},
    )
    assert updated.status_code == 200, updated.text
    assert updated.json()["date"] == "2026-02-20"

    fetched = client.get(
        f"/api/shifts/{guard_shift.id}", headers=senior_headers
    )
    assert fetched.json()["date"] == "2026-02-20"


def test_guard_can_delete_own_request(
    client, account_factory, shift_factory, login
):
    _senior, _guard, _other, guard_shift, other_shift = setup_people(
        account_factory, shift_factory
    )
    guard_headers = bearer(login("guard"))

    created = create_request(
        client, guard_headers, guard_shift.id, other_shift.id
    )
    assert created.status_code == 201
    request_id = created.json()["id"]

    deleted = client.delete(
        f"/api/requests/{request_id}", headers=guard_headers
    )
    assert deleted.status_code == 204
    assert client.get("/api/requests", headers=guard_headers).json() == []


def test_declined_request_cannot_be_approved(
    client, account_factory, shift_factory, login
):
    _senior, _guard, _other, guard_shift, other_shift = setup_people(
        account_factory, shift_factory
    )
    guard_headers = bearer(login("guard"))
    senior_headers = bearer(login("senior"))

    created = create_request(
        client, guard_headers, guard_shift.id, other_shift.id
    )
    request_id = created.json()["id"]

    declined = client.post(
        f"/api/requests/{request_id}/decline", headers=senior_headers
    )
    assert declined.status_code == 200
    assert declined.json()["status"] == "declined"

    approved = client.post(
        f"/api/requests/{request_id}/approve", headers=senior_headers
    )
    assert approved.status_code == 400
