from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.github_service import GitHubAPIError
from app.routers.repository import validate_names
from app.services.analytics import get_contributors

router = APIRouter(tags=["contributors"])


@router.get("/repo/{owner}/{repo}/contributors", summary="Get repository contributors")
async def repository_contributors(
    owner: str, repo: str, db: Session = Depends(get_db)
) -> dict[str, object]:
    validate_names(owner, repo)
    try:
        return {"items": await get_contributors(db, owner, repo)}
    except GitHubAPIError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.detail) from exc
