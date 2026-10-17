import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import Base, engine
from app import models  # Register SQLAlchemy models before creating tables.
from app.routers.ai import router as ai_router
from app.routers.commits import router as commits_router
from app.routers.contributors import router as contributors_router
from app.routers.languages import router as languages_router
from app.routers.repository import router as repository_router

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="GitStory API",
    description="Explore public GitHub repositories and their development activity.",
    version="0.1.0",
)
allowed_origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    *(
        origin.strip().rstrip("/")
        for origin in os.getenv("FRONTEND_URL", "").split(",")
        if origin.strip()
    ),
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(repository_router, prefix="/api")
app.include_router(commits_router, prefix="/api")
app.include_router(contributors_router, prefix="/api")
app.include_router(languages_router, prefix="/api")
app.include_router(ai_router, prefix="/api")


@app.get("/health", tags=["health"])
async def health_check() -> dict[str, str]:
    return {"status": "ok"}
