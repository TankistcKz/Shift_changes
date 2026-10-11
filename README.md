# Обмен сменами дежурств

## Назначение приложения

Приложение помогает команде дежурных управлять сменами: смотреть график на месяц,
создавать запросы на обмен смен между коллегами, а старшим — подтверждать или
отклонять такие запросы. Завершённые обмены фиксируются в истории замен.

## Пользовательские сценарии

1. **Просмотр графика.** Пользователь открывает страницу «График», видит, кто
   дежурит в каждый день месяца, переключает месяцы и выбирает день для просмотра
   деталей смены.
2. **Создание запроса на обмен.** На странице «Запросы обмена» пользователь
   нажимает «Создать запрос», выбирает свою смену, смену коллеги для обмена и
   указывает причину. Запрос появляется со статусом «На рассмотрении».
3. **Подтверждение старшим.** Запросы в статусе «На рассмотрении» можно
   подтвердить или отклонить (роль старшего). Статус запроса обновляется сразу.
4. **Просмотр истории.** На странице «История замен» отображается таблица
   завершённых обменов: дата смены, кто был назначен, кто заменил, кем
   подтверждено и когда.
5. **Просмотр состава команды.** На странице «Пользователи» показаны участники,
   их роли (старший/дежурный) и число смен за месяц.

## Экраны

- `/` - График
- `/requests` - Запросы обмена
- `/history` - История замен
- `/people` - Пользователи

## Технологический стек

- Frontend: React + TypeScript, сборка Vite, React Router, MUI
- Backend: Python + FastAPI, PostgreSQL + SQLAlchemy, Alembic
- Данные frontend на этапе лабы №1: демонстрационные (mock), `src/data/mock.ts`

## Модель данных

PostgreSQL, таблицы создаются миграциями Alembic (`backend/alembic`).

| Таблица            | Поля и связи                                                                  |
| ------------------ | ----------------------------------------------------------------------------- |
| `persons`          | id (PK), name, role (`senior`/`guard`).                                       |
| `shifts`           | id (PK), date, start_time, end_time, person_id (FK → persons, RESTRICT).      |
| `exchange_requests`| id (PK), requester_id (FK → persons), shift_id (FK → shifts), target_shift_id (FK → shifts), reason, status (`pending`/`approved`/`declined`), created_at. |
| `replacement_history` | id (PK), shift_id (FK → shifts), from_person_id (FK → persons), to_person_id (FK → persons), approved_by_id (FK → persons), approved_at. |

Связи: у пользователя много смен и созданных запросов; смена принадлежит
одному пользователю; запрос ссылается на две смены; запись истории фиксирует
замену на конкретной смене и подтвердившего её старшего.

Бизнес-правила: запрос создаёт только дежурный за свою смену; подтвердить
может только старший и только запрос в статусе `pending`; при подтверждении
в одной транзакции меняются владельцы обеих смен и добавляются две записи
в `replacement_history`.

## Backend: структура

```
backend/
  app/
    main.py             # FastAPI, CORS, подключение роутеров
    config.py           # настройки (.env через pydantic-settings)
    database.py         # engine, SessionLocal, Base, get_db
    models.py           # сущности SQLAlchemy
    schemas.py          # Pydantic-схемы валидации
    crud.py             # операции с данными и бизнес-логика
    seed.py             # загрузка демо-данных
    routers/            # API: persons, shifts, requests, history
  alembic/             # миграции БД
  tests/               # pytest-тесты
  docker-compose.yml   # PostgreSQL
  .env.example         # пример настроек без секретов
```

## Запуск backend

Требуется Python 3.11+ и Docker (для PostgreSQL).

1. Запустить PostgreSQL:

```bash
cd backend
docker compose up -d db
```

2. Настроить окружение (скопировать и при необходимости менять пароли):

```bash
cp .env.example .env
```

3. Создать виртуальное окружение и установить зависимости:

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

4. Создать таблицы (миграции):

```bash
alembic upgrade head
```

5. Залить демо-данные (по желанию):

```bash
python -m app.seed
```

6. Запустить сервер:

```bash
uvicorn app.main:app --reload
```

Документация API: http://localhost:8000/docs, проверка: `/api/health`.

### Основные эндпоинты

- `GET/POST /api/persons`, `GET/PATCH/DELETE /api/persons/{id}`
- `GET/POST /api/shifts` (фильтр `?month=YYYY-MM`), `GET/PATCH/DELETE /api/shifts/{id}`
- `GET/POST /api/requests` (фильтр `?request_status=`), `GET/DELETE /api/requests/{id}`,
  `POST /api/requests/{id}/approve`, `POST /api/requests/{id}/decline`
- `GET /api/history`, `GET /api/history/{id}`

## Тесты

```bash
cd backend
source .venv/bin/activate
pytest
```

Тесты используют отдельную базу `shift_exchange_test` (создаётся автоматически)
и покрывают CRUD, ошибки (404/400/422) и полный сценарий обмена с подтверждением.

## Запуск frontend

Требуется Node.js 18+ и npm

```bash
cd frontend
npm install
npm run dev
```

Приложение откроется на http://localhost:5173
