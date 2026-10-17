import asyncio
import json
from collections import Counter
from datetime import datetime, timedelta, timezone
from typing import Any
from urllib.parse import quote

from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from app.github_service import GitHubAPIError, fetch_github, repository_path
from app.models import (
    APIResponseCache,
    Commit,
    Contributor,
    FileChange,
    Language,
    Repository,
    SearchHistory,
    utc_now,
)

CACHE_TTL = timedelta(minutes=30)
HOT_FILE_COMMIT_LIMIT = 10
_RESOURCE_LOCKS: dict[str, asyncio.Lock] = {}
_HOT_FILE_LOCKS: dict[str, asyncio.Lock] = {}


def _fresh(entry: APIResponseCache | None) -> bool:
    return entry is not None and datetime.now(timezone.utc).replace(tzinfo=None) - entry.fetched_at < CACHE_TTL


def _get_repo(db: Session, owner: str, repo: str) -> Repository | None:
    return db.scalar(select(Repository).where(Repository.full_name == f"{owner}/{repo}"))


async def get_resource(
    db: Session,
    owner: str,
    repo: str,
    resource_key: str,
    path: str,
    params: dict[str, object] | None = None,
) -> Any:
    lock_key = f"{owner}/{repo}:{resource_key}"
    lock = _RESOURCE_LOCKS.setdefault(lock_key, asyncio.Lock())
    async with lock:
        return await _get_resource_locked(db, owner, repo, resource_key, path, params)


async def _get_resource_locked(
    db: Session,
    owner: str,
    repo: str,
    resource_key: str,
    path: str,
    params: dict[str, object] | None,
) -> Any:
    repository = _get_repo(db, owner, repo)
    if repository is None:
        details = await fetch_github(repository_path(owner, repo))
        if not isinstance(details, dict):
            raise GitHubAPIError(502, "GitHub returned unexpected repository data.")
        repository = Repository(
            full_name=f"{owner}/{repo}",
            owner=owner,
            name=repo,
            details_json=json.dumps(details),
        )
        db.add(repository)
        db.flush()

    entry = db.scalar(
        select(APIResponseCache).where(
            APIResponseCache.repository_id == repository.id,
            APIResponseCache.resource_key == resource_key,
        )
    )
    if _fresh(entry):
        return json.loads(entry.payload_json)

    payload = await fetch_github(path, params)
    if not isinstance(payload, (dict, list)):
        raise GitHubAPIError(502, "GitHub returned an unexpected response format.")
    if entry is None:
        entry = APIResponseCache(
            repository_id=repository.id,
            resource_key=resource_key,
            payload_json=json.dumps(payload),
            fetched_at=utc_now(),
        )
        db.add(entry)
    else:
        entry.payload_json = json.dumps(payload)
        entry.fetched_at = utc_now()
    repository.cached_at = utc_now()
    _persist_entities(db, repository.id, resource_key, payload)
    db.commit()
    return payload


def _persist_entities(db: Session, repository_id: int, key: str, payload: Any) -> None:
    if key.startswith("commits:") and isinstance(payload, list):
        for item in payload:
            if not isinstance(item, dict):
                continue
            sha = item.get("sha")
            commit_data = item.get("commit", {})
            if not isinstance(sha, str) or not isinstance(commit_data, dict):
                continue
            author_data = commit_data.get("author") or {}
            author_name = author_data.get("name", "Unknown") if isinstance(author_data, dict) else "Unknown"
            date_text = author_data.get("date") if isinstance(author_data, dict) else None
            try:
                committed_at = datetime.fromisoformat(date_text.replace("Z", "+00:00")).replace(tzinfo=None)
            except (AttributeError, ValueError):
                committed_at = None
            existing = db.scalar(select(Commit).where(Commit.repository_id == repository_id, Commit.sha == sha))
            if existing is None:
                db.add(
                    Commit(
                        repository_id=repository_id,
                        sha=sha,
                        author=str(author_name),
                        message=str(commit_data.get("message", "")),
                        committed_at=committed_at,
                        url=str(item.get("html_url", "")),
                    )
                )
    elif key == "contributors" and isinstance(payload, list):
        db.execute(delete(Contributor).where(Contributor.repository_id == repository_id))
        for item in payload:
            if isinstance(item, dict) and item.get("login"):
                db.add(
                    Contributor(
                        repository_id=repository_id,
                        username=str(item["login"]),
                        avatar_url=str(item.get("avatar_url", "")),
                        profile_url=str(item.get("html_url", "")),
                        contributions=int(item.get("contributions", 0)),
                    )
                )
    elif key == "languages" and isinstance(payload, dict):
        db.execute(delete(Language).where(Language.repository_id == repository_id))
        for name, byte_count in payload.items():
            db.add(Language(repository_id=repository_id, name=str(name), bytes=int(byte_count)))


async def get_repository(db: Session, owner: str, repo: str) -> dict[str, Any]:
    full_name = f"{owner}/{repo}"
    raw = await get_resource(db, owner, repo, "repository", repository_path(owner, repo))
    try:
        owner_data = raw.get("owner") if isinstance(raw, dict) else None
        if not isinstance(owner_data, dict):
            raise ValueError("Missing owner data.")
        result = {
            "id": raw["id"],
            "name": raw["name"],
            "full_name": raw["full_name"],
            "owner": {
                "login": owner_data["login"],
                "avatar_url": owner_data["avatar_url"],
                "html_url": owner_data["html_url"],
            },
            "description": raw.get("description"),
            "html_url": raw["html_url"],
            "stars": raw["stargazers_count"],
            "forks": raw["forks_count"],
            "watchers": raw["subscribers_count"],
            "open_issues": raw["open_issues_count"],
            "default_branch": raw["default_branch"],
            "language": raw.get("language"),
            "created_at": raw["created_at"],
            "updated_at": raw["updated_at"],
        }
    except (KeyError, TypeError, ValueError) as exc:
        raise GitHubAPIError(502, "GitHub returned repository data in an unexpected format.") from exc
    db.add(SearchHistory(full_name=full_name))
    db.commit()
    return result


async def get_repository_tree(db: Session, owner: str, repo: str) -> dict[str, Any]:
    metadata = await get_resource(
        db, owner, repo, "repository", repository_path(owner, repo)
    )
    if not isinstance(metadata, dict) or not isinstance(metadata.get("default_branch"), str):
        raise GitHubAPIError(502, "GitHub returned unexpected repository data.")

    branch = metadata["default_branch"]
    branch_data = await get_resource(
        db,
        owner,
        repo,
        f"tree-branch:{branch}",
        f"{repository_path(owner, repo)}/branches/{quote(branch, safe='')}",
    )
    try:
        tree_sha = branch_data["commit"]["commit"]["tree"]["sha"]
    except (KeyError, TypeError) as exc:
        raise GitHubAPIError(502, "GitHub returned unexpected branch data.") from exc

    tree_data = await get_resource(
        db,
        owner,
        repo,
        f"repository-tree:{tree_sha}",
        f"{repository_path(owner, repo)}/git/trees/{tree_sha}",
        {"recursive": "1"},
    )
    if not isinstance(tree_data, dict) or not isinstance(tree_data.get("tree"), list):
        raise GitHubAPIError(502, "GitHub returned unexpected file tree data.")

    root: dict[str, Any] = {
        "name": f"{owner}/{repo}",
        "path": "",
        "type": "root",
        "children": [],
    }
    nodes_by_path: dict[str, dict[str, Any]] = {"": root}
    entries = tree_data["tree"]
    displayed_entries = entries[:5000]
    for entry in displayed_entries:
        if not isinstance(entry, dict) or not isinstance(entry.get("path"), str):
            continue
        parts = entry["path"].split("/")
        parent_path = ""
        for part_index, part in enumerate(parts):
            node_path = "/".join(parts[: part_index + 1])
            node = nodes_by_path.get(node_path)
            is_leaf = part_index == len(parts) - 1
            entry_type = entry.get("type") if is_leaf else "tree"
            if node is None:
                node = {
                    "name": part,
                    "path": node_path,
                    "type": "directory" if entry_type == "tree" else "file",
                    "children": [],
                }
                nodes_by_path[node_path] = node
                nodes_by_path[parent_path]["children"].append(node)
            if is_leaf and entry_type != "tree":
                node.update(
                    {
                        "sha": entry.get("sha"),
                        "size": entry.get("size"),
                        "url": entry.get("url"),
                        "html_url": f"https://github.com/{owner}/{repo}/blob/{branch}/{entry['path']}",
                    }
                )
            parent_path = node_path

    for node in nodes_by_path.values():
        node["children"].sort(
            key=lambda child: (
                child["type"] == "file",
                child["name"].casefold(),
            )
        )

    recent_commits = await get_resource(
        db,
        owner,
        repo,
        "commits:1:20",
        f"{repository_path(owner, repo)}/commits",
        {"page": 1, "per_page": 20},
    )
    if not isinstance(recent_commits, list):
        raise GitHubAPIError(502, "GitHub returned unexpected commit data.")
    commit_nodes = []
    for item in recent_commits:
        if not isinstance(item, dict):
            continue
        commit_data = item.get("commit", {})
        commit_author = item.get("author") or {}
        git_author = commit_data.get("author") if isinstance(commit_data, dict) else {}
        if not isinstance(git_author, dict):
            git_author = {}
        commit_nodes.append(
            {
                "name": str(commit_data.get("message", "Commit")).splitlines()[0],
                "path": item.get("sha", ""),
                "type": "commit",
                "sha": item.get("sha"),
                "author": commit_author.get("login") or git_author.get("name") or "Unknown author",
                "date": git_author.get("date"),
                "html_url": item.get("html_url"),
                "children": [],
            }
        )
    root["children"].append(
        {
            "name": "Recent commits",
            "path": "__recent_commits__",
            "type": "commit-group",
            "children": commit_nodes,
        }
    )
    return {
        "root": root,
        "files": sum(1 for entry in displayed_entries if isinstance(entry, dict) and entry.get("type") == "blob"),
        "directories": sum(1 for node in nodes_by_path.values() if node["type"] == "directory"),
        "commits": len(commit_nodes),
        "truncated": bool(tree_data.get("truncated")) or len(entries) > len(displayed_entries),
    }


async def get_activity(db: Session, owner: str, repo: str, days: int) -> dict[str, Any]:
    now = datetime.now(timezone.utc)
    since = now - timedelta(days=days - 1)
    commits: list[dict[str, Any]] = []
    max_pages = 50
    for page in range(1, max_pages + 1):
        result = await get_resource(
            db,
            owner,
            repo,
            f"activity:{days}:{page}",
            f"{repository_path(owner, repo)}/commits",
            {"since": since.isoformat(), "per_page": 100, "page": page},
        )
        if not isinstance(result, list):
            raise GitHubAPIError(502, "GitHub returned unexpected commit data.")
        commits.extend(item for item in result if isinstance(item, dict))
        if len(result) < 100:
            break

    daily_counts: Counter[str] = Counter()
    for item in commits:
        commit_data = item.get("commit", {})
        authored = commit_data.get("author", {}) if isinstance(commit_data, dict) else {}
        date_value = authored.get("date") if isinstance(authored, dict) else None
        if not isinstance(date_value, str):
            continue
        try:
            day = datetime.fromisoformat(date_value.replace("Z", "+00:00")).date()
        except ValueError:
            continue
        daily_counts[day.isoformat()] += 1

    daily = [
        {"date": (since.date() + timedelta(days=offset)).isoformat(), "commits": daily_counts.get((since.date() + timedelta(days=offset)).isoformat(), 0)}
        for offset in range(days)
    ]
    weekly: Counter[str] = Counter()
    monthly: Counter[str] = Counter()
    for point in daily:
        date = datetime.fromisoformat(point["date"]).date()
        iso = date.isocalendar()
        weekly[f"{iso.year}-W{iso.week:02d}"] += point["commits"]
        monthly[date.strftime("%Y-%m")] += point["commits"]
    return {
        "range_days": days,
        "total_commits": sum(daily_counts.values()),
        "truncated": len(commits) >= max_pages * 100,
        "daily": daily,
        "weekly": [{"period": period, "commits": count} for period, count in sorted(weekly.items())],
        "monthly": [{"period": period, "commits": count} for period, count in sorted(monthly.items())],
    }


async def get_contributors(db: Session, owner: str, repo: str) -> list[dict[str, Any]]:
    payload = await get_resource(
        db, owner, repo, "contributors", f"{repository_path(owner, repo)}/contributors", {"per_page": 100}
    )
    if not isinstance(payload, list):
        raise GitHubAPIError(502, "GitHub returned unexpected contributor data.")
    total = sum(int(item.get("contributions", 0)) for item in payload if isinstance(item, dict))
    result = []
    for item in payload:
        if isinstance(item, dict):
            result.append(
                {
                    "username": item.get("login"),
                    "avatar_url": item.get("avatar_url"),
                    "profile_url": item.get("html_url"),
                    "contributions": int(item.get("contributions", 0)),
                    "percentage": round(100 * int(item.get("contributions", 0)) / total, 2) if total else 0,
                }
            )
    return result


async def get_languages(db: Session, owner: str, repo: str) -> list[dict[str, Any]]:
    payload = await get_resource(db, owner, repo, "languages", f"{repository_path(owner, repo)}/languages")
    if not isinstance(payload, dict):
        raise GitHubAPIError(502, "GitHub returned unexpected language data.")
    total = sum(int(value) for value in payload.values())
    return [
        {"name": name, "bytes": int(value), "percentage": round(100 * int(value) / total, 2) if total else 0}
        for name, value in sorted(payload.items(), key=lambda item: int(item[1]), reverse=True)
    ]


async def get_hot_files(db: Session, owner: str, repo: str) -> dict[str, Any]:
    lock_key = f"{owner}/{repo}"
    lock = _HOT_FILE_LOCKS.setdefault(lock_key, asyncio.Lock())
    async with lock:
        return await _get_hot_files_locked(db, owner, repo)


async def _get_hot_files_locked(db: Session, owner: str, repo: str) -> dict[str, Any]:
    full_key = "hot-files"
    repository = _get_repo(db, owner, repo)
    if repository:
        entry = db.scalar(
            select(APIResponseCache).where(
                APIResponseCache.repository_id == repository.id,
                APIResponseCache.resource_key == full_key,
            )
        )
        if _fresh(entry):
            return json.loads(entry.payload_json)

    commits = await get_resource(
        db, owner, repo, "hot-files:commits", f"{repository_path(owner, repo)}/commits", {"per_page": 100, "page": 1}
    )
    if not isinstance(commits, list):
        raise GitHubAPIError(502, "GitHub returned unexpected commit data.")
    async def get_commit_files(sha: str) -> list[dict[str, Any]]:
        result = await get_resource(
            db,
            owner,
            repo,
            f"commit-detail:{sha}",
            f"{repository_path(owner, repo)}/commits/{sha}",
        )
        files = result.get("files", []) if isinstance(result, dict) else []
        return [item for item in files if isinstance(item, dict)] if isinstance(files, list) else []

    shas = [
        item["sha"]
        for item in commits[:HOT_FILE_COMMIT_LIMIT]
        if isinstance(item, dict) and isinstance(item.get("sha"), str)
    ]
    grouped_files = []
    for sha in shas:
        grouped_files.append(await get_commit_files(sha))
    file_counts: Counter[str] = Counter()
    folder_counts: Counter[str] = Counter()
    for files in grouped_files:
        for item in files:
            filename = item.get("filename")
            if not isinstance(filename, str):
                continue
            file_counts[filename] += 1
            folder = filename.split("/", 1)[0] if "/" in filename else "(root)"
            folder_counts[folder] += 1
    result = {
        "commits_analyzed": len(shas),
        "files": [{"path": name, "changes": count} for name, count in file_counts.most_common(10)],
        "folders": [{"path": name, "changes": count} for name, count in folder_counts.most_common(10)],
    }
    repository = _get_repo(db, owner, repo)
    if repository:
        db.execute(delete(FileChange).where(FileChange.repository_id == repository.id))
        for path, count in file_counts.items():
            db.add(FileChange(repository_id=repository.id, path=path, changes=count))
        entry = db.scalar(
            select(APIResponseCache).where(
                APIResponseCache.repository_id == repository.id,
                APIResponseCache.resource_key == full_key,
            )
        )
        if entry is None:
            db.add(
                APIResponseCache(
                    repository_id=repository.id,
                    resource_key=full_key,
                    payload_json=json.dumps(result),
                    fetched_at=utc_now(),
                )
            )
        else:
            entry.payload_json = json.dumps(result)
            entry.fetched_at = utc_now()
        db.commit()
    return result


def get_recent_searches(db: Session) -> list[str]:
    rows = db.scalars(select(SearchHistory.full_name).order_by(SearchHistory.searched_at.desc()).limit(10))
    return list(dict.fromkeys(rows))
