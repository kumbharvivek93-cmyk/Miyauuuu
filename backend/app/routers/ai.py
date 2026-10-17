import json
import os

import httpx
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.github_service import GitHubAPIError
from app.routers.repository import validate_names
from app.services.analytics import get_activity, get_contributors, get_hot_files, get_languages, get_repository

router = APIRouter(tags=["AI insights"])


@router.post("/repo/{owner}/{repo}/ai-summary", summary="Generate AI repository insights")
async def repository_ai_summary(
    owner: str, repo: str, db: Session = Depends(get_db)
) -> dict[str, str]:
    validate_names(owner, repo)
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise HTTPException(
            status_code=503,
            detail="AI summaries are not configured. Set OPENAI_API_KEY in backend/.env.",
        )

    try:
        metadata = await get_repository(db, owner, repo)
        contributors = await get_contributors(db, owner, repo)
        languages = await get_languages(db, owner, repo)
        activity = await get_activity(db, owner, repo, 30)
        hot_files = await get_hot_files(db, owner, repo)
    except GitHubAPIError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.detail) from exc

    context = {
        "repository": metadata,
        "top_contributors": contributors[:10],
        "languages": languages,
        "last_30_days_activity": activity,
        "frequently_changed_files": hot_files,
    }
    prompt = (
        "Summarize this public GitHub repository using only the supplied data. "
        "Cover: what it does (use the description; do not invent), activity level, "
        "main technologies, active development areas, and contributor pattern. "
        "Be concise and flag uncertainty.\n\n"
        + json.dumps(context)
    )
    try:
        async with httpx.AsyncClient(timeout=45) as client:
            response = await client.post(
                "https://api.openai.com/v1/chat/completions",
                headers={"Authorization": f"Bearer {api_key}"},
                json={
                    "model": os.getenv("OPENAI_MODEL", "gpt-4o-mini"),
                    "messages": [{"role": "user", "content": prompt}],
                    "temperature": 0.3,
                },
            )
        if response.is_error:
            raise HTTPException(status_code=502, detail="The AI provider could not generate a summary.")
        answer = response.json()["choices"][0]["message"]["content"]
        if not isinstance(answer, str) or not answer.strip():
            raise HTTPException(status_code=502, detail="The AI provider returned an empty summary.")
        return {"label": "AI-generated insight", "summary": answer.strip()}
    except httpx.TimeoutException as exc:
        raise HTTPException(status_code=504, detail="AI summary generation timed out.") from exc
    except httpx.RequestError as exc:
        raise HTTPException(status_code=502, detail="Could not connect to the AI provider.") from exc
    except (KeyError, IndexError, TypeError, ValueError) as exc:
        raise HTTPException(status_code=502, detail="The AI provider returned an invalid response.") from exc
