import re

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.github_service import GitHubAPIError
from app.schemas import RepositoryResponse
from app.services.analytics import (
    get_activity,
    get_hot_files,
    get_recent_searches,
    get_repository,
    get_repository_tree,
)

router = APIRouter(tags=["repositories"])
GITHUB_NAME_PATTERN = re.compile(r"^[A-Za-z0-9_.-]+$")


@router.get(
    "/repo/{owner}/{repo}",
    response_model=RepositoryResponse,
    summary="Get public GitHub repository details",
)
async def get_repository_details(
    owner: str, repo: str, db: Session = Depends(get_db)
) -> RepositoryResponse:
    validate_names(owner, repo)
    try:
        data = await get_repository(db, owner, repo)
    except GitHubAPIError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.detail) from exc
    try:
        return RepositoryResponse(**data)
    except (KeyError, TypeError, ValueError) as exc:
        raise HTTPException(
            status_code=502,
            detail="GitHub returned repository data in an unexpected format.",
        ) from exc


def validate_names(owner: str, repo: str) -> None:
    if not GITHUB_NAME_PATTERN.fullmatch(owner) or not GITHUB_NAME_PATTERN.fullmatch(repo):
        raise HTTPException(
            status_code=422,
            detail="Owner and repository names may contain only letters, numbers, dots, underscores, and hyphens.",
        )


@router.get("/repo/{owner}/{repo}/tree", summary="Get repository folders, files, and recent commits")
async def repository_tree(
    owner: str, repo: str, db: Session = Depends(get_db)
) -> dict[str, object]:
    validate_names(owner, repo)
    try:
        return await get_repository_tree(db, owner, repo)
    except GitHubAPIError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.detail) from exc


@router.get("/repo/{owner}/{repo}/activity", summary="Get grouped commit activity")
async def repository_activity(
    owner: str,
    repo: str,
    range: int = Query(default=30, ge=7, le=365),
    db: Session = Depends(get_db),
) -> dict[str, object]:
    validate_names(owner, repo)
    if range not in {7, 30, 90, 365}:
        raise HTTPException(status_code=422, detail="Range must be 7, 30, 90, or 365 days.")
    try:
        return await get_activity(db, owner, repo, range)
    except GitHubAPIError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.detail) from exc


@router.get("/repo/{owner}/{repo}/hot-files", summary="Find frequently changed files")
async def repository_hot_files(
    owner: str, repo: str, db: Session = Depends(get_db)
) -> dict[str, object]:
    validate_names(owner, repo)
    try:
        return await get_hot_files(db, owner, repo)
    except GitHubAPIError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.detail) from exc


@router.get("/searches", summary="Get recent repository searches")
def recent_searches(db: Session = Depends(get_db)) -> dict[str, list[str]]:
    return {"items": get_recent_searches(db)}
