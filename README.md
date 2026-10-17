# GitStory — Visual GitHub Repository Explorer

> Live app:https://gitstory-frontend.onrender.com <br>
> Demo video: [Add the project video URL here](#)

## Problem

GitHub contains useful information about a repository's code, history, contributors, and activity, but that information is spread across pages and can be difficult to understand at a glance. New contributors and project viewers may struggle to see how a project is structured and how it has changed over time.

## Solution

GitStory turns public GitHub repository data into a visual dashboard. Enter an `owner/repo` name to explore repository metrics, commit activity, contributors, languages, a tree-style view of the default branch, and frequently changed files. Optional AI Insights can summarize repository data when an OpenAI API key is configured.

## Features

- Repository overview with stars, forks, watchers, open issues, default branch, and dates
- Commit activity charts for 7, 30, 90, or 365 days
- Paginated commit history with author, date, message, and links to GitHub
- Contributor leaderboard and language composition charts
- Visual repository tree with directories, files, and recent commits
- Frequently changed files and folders based on up to 10 recent commits
- SQLite response cache with a 30-minute lifetime and recent search history
- GitHub API token failover for configured tokens when a token is rate-limited
- Optional OpenAI-generated repository insights
- Responsive React dashboard

## Tech stack

| Technology | How it is used |
|---|---|
| React 18 | Component-based dashboard UI |
| Vite | Frontend development server and production build |
| Recharts | Activity and repository analytics charts |
| Lucide React | Interface icons |
| Python 3.10+ | Backend runtime |
| FastAPI | REST API and interactive API documentation |
| SQLAlchemy | Database models and persistence |
| SQLite | Local cache and recent search history by default |
| GitHub REST API | Public repository metadata, commits, tree, contributors, and languages |
| OpenAI API (optional) | AI-generated repository summary |
| Render | Hosting for the API service and static frontend |

## Tech-stack justification

- **React with Vite** makes the dashboard interactive and quick to develop, while producing static assets that can be served efficiently by Render.
- **FastAPI** provides asynchronous API handlers, input validation, and generated OpenAPI documentation with little setup.
- **SQLAlchemy with SQLite** gives the project a simple local persistence layer for API caching and search history without requiring a database server during development.
- **GitHub REST API** provides the repository and development data directly, so the app does not need to clone repositories.
- **Recharts** and **Lucide React** provide reusable charts and icons that fit the data-focused UI.
- **Render** can host the frontend and backend as separate services, matching the app's browser/API architecture.

## Setup and usage

### Requirements

- Python 3.10 or newer
- Node.js 18 or newer and npm
- A GitHub personal access token is recommended to reduce unauthenticated API rate-limit issues.
- `OPENAI_API_KEY` is optional and only needed for AI Insights.

### Run locally on Windows

Open two PowerShell terminals from the project directory.

#### 1. Start the backend

```powershell
cd "C:\path\to\Gitstory\backend"
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
Copy-Item .env.example .env
```

Set `GITHUB_TOKEN` in `backend\.env`. Optionally set `GITHUB_TOKENS` to a comma-separated list of fallback tokens and `OPENAI_API_KEY` to enable AI Insights. Keep tokens private; do not commit them.

Start the API:

```powershell
uvicorn app.main:app --reload
```

The API runs at <http://127.0.0.1:8000>. Interactive API documentation is at <http://127.0.0.1:8000/docs>.

#### 2. Start the frontend

In the second terminal:

```powershell
cd "C:\path\to\Gitstory\frontend"
npm install
Copy-Item .env.example .env
npm run dev
```

Open <http://127.0.0.1:5173>, enter a repository in `owner/repo` format (for example, `psf/requests`), and select **Explore**. The frontend's `VITE_API_URL` should point to the backend API; the default in `frontend/.env.example` is the local API URL.

Press **Ctrl+C** in each terminal to stop its server.

## Deploy to Render

The repository includes [`render.yaml`](./render.yaml), a Render Blueprint that configures a FastAPI web service and a React static site.

1. Push the project to a GitHub repository and connect it to Render.
2. In Render, select **New > Blueprint**, choose the repository, and apply the Blueprint.
3. Render creates `gitstory-api` and `gitstory-frontend`. The frontend is configured to call the API, and the backend's `FRONTEND_URL` allows the frontend origin through CORS.
4. In the `gitstory-api` service's **Environment** settings, add `GITHUB_TOKEN` (recommended), `GITHUB_TOKENS` (optional comma-separated fallbacks), and `OPENAI_API_KEY` (optional). Keep secrets in Render environment settings, not in source code.
5. Wait for both services to deploy, then use the frontend service URL as the live app link above.

The Blueprint uses Render's free web-service plan. SQLite data on a free instance is ephemeral and may be cleared when the service restarts or redeploys; cached API responses and recent search history are not durable. For persistent data, configure a managed PostgreSQL database or a persistent disk and set `DATABASE_URL` accordingly. A persistent disk requires a paid web-service instance.

## Team members

- **[Add team member name]** — [Add role or contribution]
- **[Add team member name]** — [Add role or contribution]
- **[Add or remove entries as needed]**

## Live app and video

- **Live app:** [Add the deployed Render URL here](#)
- **Demo video:** [Add the video URL here](#)

## Configuration

| Variable | Required | Purpose |
|---|---:|---|
| `GITHUB_TOKEN` | No, recommended | Primary GitHub API token |
| `GITHUB_TOKENS` | No | Comma-separated fallback tokens, tried when the active token is rate-limited |
| `OPENAI_API_KEY` | Only for AI Insights | Enables the optional OpenAI summary endpoint |
| `OPENAI_MODEL` | No | OpenAI model name; defaults to `gpt-4o-mini` |
| `DATABASE_URL` | No | SQLAlchemy connection string; defaults to SQLite in the backend directory |
| `FRONTEND_URL` | No | Comma-separated browser origins allowed by the backend; Render configures the frontend URL |
| `VITE_API_URL` | No | Frontend API base URL; defaults to `http://127.0.0.1:8000/api` |

## API overview

All API endpoints are prefixed with `/api`. Errors are returned as JSON with a `detail` message and an appropriate HTTP status.

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/repo/{owner}/{repo}` | Repository metadata |
| `GET` | `/api/repo/{owner}/{repo}/tree` | Default-branch folder/file tree and recent commits |
| `GET` | `/api/repo/{owner}/{repo}/commits?page=1&per_page=30` | Paginated commits (`per_page` 1–100) |
| `GET` | `/api/repo/{owner}/{repo}/activity?range=30` | Daily, weekly, and monthly commit counts |
| `GET` | `/api/repo/{owner}/{repo}/contributors` | Contributors and commit counts |
| `GET` | `/api/repo/{owner}/{repo}/languages` | Language breakdown by bytes |
| `GET` | `/api/repo/{owner}/{repo}/hot-files` | Frequently changed files and folders |
| `POST` | `/api/repo/{owner}/{repo}/ai-summary` | Optional AI-generated summary |
| `GET` | `/api/searches` | Up to 10 recent repository searches |
| `GET` | `/health` | Backend health check |

## GitHub API usage and caching

Cached responses are stored in SQLite and reused for 30 minutes. A first hot-files request fetches the latest 100 commit summaries and at most 10 individual commit details. Configure `GITHUB_TOKEN` for authenticated requests. Additional comma-separated tokens in `GITHUB_TOKENS` are tried when the active token is rate-limited. Multiple tokens belonging to the same GitHub account may share that account's API quota.

## Project structure

```text
Gitstory/
├── backend/
│   ├── app/
│   │   ├── routers/
│   │   ├── services/analytics.py
│   │   ├── database.py
│   │   ├── github_service.py
│   │   ├── main.py
│   │   ├── models.py
│   │   └── schemas.py
│   ├── .env.example
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── services/api.js
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── styles.css
│   ├── .env.example
│   └── package.json
└── render.yaml
```
