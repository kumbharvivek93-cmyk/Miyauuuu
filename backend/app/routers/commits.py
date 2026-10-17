from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.github_service import GitHubAPIError, repository_path
from app.routers.repository import validate_names
from app.services.analytics import get_resource

router = APIRouter(tags=["commits"])


@router.get("/repo/{owner}/{repo}/commits", summary="List repository commits")
async def repository_commits(
    owner: str,
    repo: str,
    page: int = Query(default=1, ge=1),
    per_page: int = Query(default=30, ge=1, le=100),
    db: Session = Depends(get_db),
) -> dict[str, object]:
    validate_names(owner, repo)
    try:
        items = await get_resource(
            db,
            owner,
            repo,
            f"commits:{page}:{per_page}",
            f"{repository_path(owner, repo)}/commits",
            {"page": page, "per_page": per_page},
        )
        return {"page": page, "per_page": per_page, "items": items}
    except GitHubAPIError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.detail) from exc
