import os
from pathlib import Path
from urllib.parse import quote

import httpx
from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parents[1] / ".env")

GITHUB_API_URL = "https://api.github.com"
REQUEST_TIMEOUT_SECONDS = 15.0
_active_token_index = 0


class GitHubAPIError(Exception):
    def __init__(self, status_code: int, detail: str) -> None:
        self.status_code = status_code
        self.detail = detail
        super().__init__(detail)


def _github_tokens() -> list[str]:
    tokens = []
    primary = os.getenv("GITHUB_TOKEN", "").strip()
    if primary:
        tokens.append(primary)
    for token in os.getenv("GITHUB_TOKENS", "").split(","):
        token = token.strip()
        if token and token not in tokens:
            tokens.append(token)
    return tokens


def _is_rate_limited(response: httpx.Response) -> bool:
    if response.status_code == 429 or response.headers.get("X-RateLimit-Remaining") == "0":
        return True
    if response.status_code != 403:
        return False
    if response.headers.get("Retry-After"):
        return True
    try:
        message = response.json().get("message", "")
    except (ValueError, AttributeError):
        return False
    return isinstance(message, str) and (
        "rate limit" in message.lower() or "abuse detection" in message.lower()
    )


async def fetch_github(path: str, params: dict[str, object] | None = None) -> object:
    global _active_token_index
    headers = {
        "Accept": "application/vnd.github+json",
        "User-Agent": "GitStory",
        "X-GitHub-Api-Version": "2022-11-28",
    }
    tokens = _github_tokens()
    token_index = _active_token_index % len(tokens) if tokens else -1
    token = tokens[token_index] if tokens else None
    if token:
        headers["Authorization"] = f"Bearer {token}"

    try:
        async with httpx.AsyncClient(timeout=REQUEST_TIMEOUT_SECONDS) as client:
            response = await client.get(f"{GITHUB_API_URL}{path}", headers=headers, params=params)
    except httpx.TimeoutException as exc:
        raise GitHubAPIError(503, "GitHub request timed out. Please try again.") from exc
    except httpx.RequestError as exc:
        raise GitHubAPIError(503, "Could not connect to GitHub. Please try again.") from exc

    if _is_rate_limited(response):
        last_rate_limit = response
        for offset in range(1, len(tokens)):
            fallback_index = (token_index + offset) % len(tokens)
            fallback_headers = headers.copy()
            fallback_headers["Authorization"] = f"token {tokens[fallback_index]}"
            try:
                async with httpx.AsyncClient(timeout=REQUEST_TIMEOUT_SECONDS) as client:
                    fallback_response = await client.get(
                        f"{GITHUB_API_URL}{path}", headers=fallback_headers, params=params
                    )
            except httpx.TimeoutException as exc:
                raise GitHubAPIError(503, "GitHub request timed out. Please try again.") from exc
            except httpx.RequestError as exc:
                raise GitHubAPIError(503, "Could not connect to GitHub. Please try again.") from exc

            if _is_rate_limited(fallback_response):
                last_rate_limit = fallback_response
                continue
            response = fallback_response
            token_index = fallback_index
            break
        else:
            detail = "GitHub API rate limit exceeded. Please try again later."
            if len(tokens) > 1:
                detail = "GitHub API rate limits exceeded for all configured tokens. Please try again later."
            reset_at = last_rate_limit.headers.get("X-RateLimit-Reset")
            if reset_at:
                detail += f" The limit resets at Unix time {reset_at}."
            raise GitHubAPIError(429, detail)
    if response.status_code == 404:
        raise GitHubAPIError(404, "Repository not found or it is not public.")
    if response.status_code == 401:
        raise GitHubAPIError(
            502,
            "GitHub rejected the configured token. Check GITHUB_TOKEN or GITHUB_TOKENS in the backend environment.",
        )
    if response.status_code == 403:
        raise GitHubAPIError(403, "GitHub denied access to this resource.")
    if response.status_code >= 500:
        raise GitHubAPIError(502, "GitHub is temporarily unavailable. Please try again.")
    if response.is_error:
        raise GitHubAPIError(502, f"GitHub returned an unexpected status ({response.status_code}).")

    if tokens:
        _active_token_index = token_index
    try:
        return response.json()
    except ValueError as exc:
        raise GitHubAPIError(502, "GitHub returned an invalid response.") from exc


def repository_path(owner: str, repo: str) -> str:
    return f"/repos/{quote(owner, safe='')}/{quote(repo, safe='')}"
