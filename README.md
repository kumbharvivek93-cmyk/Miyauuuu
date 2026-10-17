# 🌳 GitStory — Turn Your GitHub Repository into a Tree

<p align="center">
  <strong>Every repository has a story. GitStory helps you visualize it.</strong>
</p>

<p align="center">
  <a href="https://gitstory-frontend.onrender.com/">🚀 Live Demo</a> •
  <a href="https://youtu.be/0GvRJxOoypw?si=t9dqNk4MsBuHscva">🎥 Watch Demo</a> •
  <a href="https://github.com/kumbharvivek93-cmyk">👨‍💻 Developer</a>
</p>

## 🎯 1. Problem Statement

GitHub repositories can become difficult to understand as projects grow. Developers often need to explore nested directories, hundreds of files, commit histories, contributor activity, and programming-language statistics to understand a codebase.

Traditional repository browsing can make it challenging to see the overall project structure and development patterns at a glance.

**The challenge:** How can we make GitHub repositories easier to explore, understand, and analyze through an intuitive visual experience?

## 💡 2. Solution

**GitStory** is a web application that transforms GitHub repository data into a visual and analytical experience.

Its central concept is a tree analogy:

- 🌱 **Root → Repository:** The root represents the entire GitHub repository.
- 🌿 **Branches → Directories:** Branches represent folders and nested directories.
- 🍃 **Leaves → Files:** Leaves represent individual files within the project.

Alongside repository visualization, GitStory brings repository analytics and optional AI-powered insights into one interface, helping developers understand project structure, technologies, contributors, and development activity.

## ✨ 3. Features

- 🌳 **Repository Visualization:** Explore repository structure using a tree-inspired mental model.
- 📁 **Directory and File Exploration:** Understand how folders and files are organized.
- 📊 **Repository Analytics:** Explore development activity and repository statistics.
- 🕒 **Commit Analysis:** Review commit history and development patterns.
- 👥 **Contributor Analytics:** Understand contributor activity.
- 💻 **Language Distribution:** Explore the programming languages used in a repository.
- 🔎 **Frequently Modified Files:** Identify files that receive repeated changes.
- 🤖 **AI-Powered Insights:** Generate natural-language repository summaries when AI integration is configured.
- ⚡ **API Integration:** Retrieve repository data through GitHub's API.
- 🛡️ **Error Handling:** Handle common API errors, missing repositories, and rate limits.

## 🛠️ 4. Tech Stack

| Component | Technologies |
|---|---|
| Frontend | React 18, JavaScript |
| Build Tool | Vite |
| Routing | React Router |
| Charts | Recharts |
| Icons | Lucide React |
| Backend | Python, FastAPI |
| HTTP Client | HTTPX |
| External API | GitHub REST API |
| Database / ORM | SQLite-compatible setup, SQLAlchemy |
| Validation | Pydantic |
| AI Integration | OpenAI API |
| Environment Variables | python-dotenv |
| ASGI Server | Uvicorn |
| Deployment | Render |
| Version Control | Git, GitHub |

## 🧠 5. Tech-Stack Justification

**React and Vite:** React enables reusable UI components and interactive repository dashboards, while Vite provides a fast development experience and production builds.

**FastAPI:** Provides structured REST endpoints, request validation, automatic API documentation, and support for asynchronous operations.

**GitHub REST API:** Supplies repository metadata, file-tree information, commits, contributors, and language statistics without requiring users to upload their repositories.

**HTTPX:** Supports asynchronous HTTP requests to external services, helping the backend communicate efficiently with GitHub and AI providers.

**SQLAlchemy and SQLite:** Provide a lightweight persistence layer and ORM-based database operations for supported application data and caching.

**Recharts:** Converts numerical repository data into charts that make development patterns easier to understand.

**OpenAI API:** Supports optional AI-generated summaries that explain repository information in natural language.

**Render:** Provides cloud hosting for deploying the web application and making it accessible through a public URL.

## 🚀 6. Setup and Usage

### Prerequisites

- Python 3.10 or newer
- Node.js and npm
- Git
- GitHub token (optional, depending on API usage)
- OpenAI API key (optional, for AI insights)

### Step 1: Clone the repository

```bash
git clone <YOUR_GITHUB_REPOSITORY_URL>
cd Gitstory
```

### Step 2: Configure the backend

```bash
cd backend
python -m venv .venv
```

Activate the virtual environment.

**Windows PowerShell:**

```powershell
.\.venv\Scripts\Activate.ps1
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Create a `.env` file in the `backend` directory using `.env.example` as a reference.

Configure the necessary environment variables, for example:

```env
GITHUB_TOKEN=your_github_token
OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL=gpt-4o-mini
```

Use the variable names expected by your application. AI credentials are only required when using the corresponding AI features. Never commit real API keys.

### Step 3: Run the backend

From the `backend` directory:

```bash
uvicorn app.main:app --reload
```

Backend address:

`http://127.0.0.1:8000`

Interactive API documentation:

`http://127.0.0.1:8000/docs`

### Step 4: Configure the frontend

Open another terminal:

```bash
cd frontend
npm install
```

Create a frontend `.env` file if required:

```env
VITE_API_URL=http://127.0.0.1:8000/api
```

Ensure this URL matches the backend API configuration.

### Step 5: Run the frontend

```bash
npm run dev
```

Open the local address printed by Vite, usually:

`http://localhost:5173`

### Step 6: Explore GitStory

1. Open GitStory in your browser.
2. Enter the owner and repository name of a public GitHub project.
3. Explore the repository's directories and files.
4. Review available commit, contributor, and language analytics.
5. Generate AI-powered insights if the feature is configured.

**Note:** API rate limits, repository permissions, and optional credentials may affect available data and features.

## 👨‍💻 7. Team Members

### Vivek Kumbhar — Creator and Developer

- **Role:** Solo Developer / Project Lead
- **Responsibilities:** Project ideation, application development, frontend and backend integration, GitHub API integration, analytics, AI integration, and deployment.
- **GitHub:** [@kumbharvivek93-cmyk](https://github.com/kumbharvivek93-cmyk)

GitStory is an independently developed project built to explore a more intuitive way of understanding GitHub repositories.

## 🌐 8. Live Application

🚀 **Try GitStory:** https://gitstory-frontend.onrender.com/

Explore the deployed application and experience the project firsthand.

## 🎥 9. Video Demonstration

▶️ **Watch GitStory's Demo on YouTube:**

https://youtu.be/0GvRJxOoypw?si=t9dqNk4MsBuHscva

Watch the demonstration to understand the project's concept, interface, repository exploration workflow, and available functionality.

## 🔮 10. Future Scope

- 🌲 More interactive and expandable repository tree visualizations.
- 🔍 Advanced file and directory search.
- 🧠 Deeper AI-assisted codebase understanding.
- 📈 Enhanced commit-history and development timeline visualizations.
- 👥 Contributor collaboration graphs.
- 🆚 Repository comparison tools.
- 📄 Exportable repository reports.
- 🎨 More customization options for visualizing large codebases.

These are planned possibilities rather than a claim that every feature is currently implemented.

## 🤝 11. Contributing

Suggestions, feedback, bug reports, and contributions are welcome.

1. Fork the repository.
2. Create a feature branch.
3. Implement and test your changes.
4. Commit your work with a meaningful message.
5. Submit a pull request.

Please avoid committing secrets, environment files containing credentials, virtual environments, or generated dependency directories.

## 📜 12. License

A license has not yet been specified. Add a `LICENSE` file to define the terms under which others can use, modify, and distribute the project.

---

<p align="center">
  <strong>🌳 GitStory — Every Repository Has a Story.</strong>
  <br/>
  Built with curiosity, creativity, and code by Vivek Kumbhar.
</p>
