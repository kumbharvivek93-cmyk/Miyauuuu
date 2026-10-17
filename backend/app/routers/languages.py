from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.github_service import GitHubAPIError
from app.routers.repository import validate_names
from app.services.analytics import get_languages

router = APIRouter(tags=["languages"])


@router.get("/repo/{owner}/{repo}/languages", summary="Get repository language breakdown")
async def repository_languages(
    owner: str, repo: str, db: Session = Depends(get_db)
) -> dict[str, object]:
    validate_names(owner, repo)
    try:
        return {"items": await get_languages(db, owner, repo)}
    except GitHubAPIError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.detail) from exc
