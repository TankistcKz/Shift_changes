from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import get_settings
from .routers import history, persons, requests, shifts

settings = get_settings()

app = FastAPI(
    title="Обмен сменами дежурств",
    description="Backend: график, запросы обмена, подтверждение старшими, история замен",
    version="0.2.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(persons.router)
app.include_router(shifts.router)
app.include_router(requests.router)
app.include_router(history.router)


@app.get("/api/health", tags=["health"])
def health_check():
    return {"status": "ok"}