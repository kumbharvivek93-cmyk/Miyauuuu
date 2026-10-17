Ask User
Completed with input: {
  "message": "Let’s fill the README details. First, what is your team name? If you haven’t chosen one yet, say “not decided.”",
  "requestedSchema": {
    "properties": {
      "team_name": {
        "type": "string",
        "title": "Team name",
        "description": "Enter the team name exactly as you want it shown in the README."
      }
    }
  }
}

Ask User
Completed with input: {
  "message": "Great. Who are the team members? Please give each member’s name and, if you want, their role or contribution. You can list multiple people in one response.",
  "requestedSchema": {
    "properties": {
      "team_members": {
        "type": "string",
        "title": "Team members",
        "description": "For example: Vivek Kumbhar — Backend and deployment; Name — Frontend."
      }
    }
  }
}

Ask User
Completed with input: {
  "message": "What project title and short overview should the README use? Tell me in your own words what GitStory does and who it helps.",
  "requestedSchema": {
    "properties": {
      "project_title": {
        "type": "string",
        "title": "Project title",
        "default": "GitStory — GitHub Repository Explorer"
      }
    },
    "project_overview": {
      "type": "string",
      "title": "Project overview",
      "description": "Describe what the project does and who it is for, in your own words."
    }
  }
}

Ask User
Completed with input: {
  "message": "What should the project overview say? In your own words, describe what the app lets people do and what problem it solves. I’ll polish the wording for the README.",
  "requestedSchema": {
    "properties": {
      "overview": {
        "type": "string",
        "title": "Project overview",
        "description": "A rough sentence or two is enough."
      }
    }
  }
}

Ask User
Completed with input: {
  "message": "I’ll use the project’s existing stack: React, Vite, Recharts, Lucide React, Python, FastAPI, SQLAlchemy, SQLite, GitHub REST API, optional OpenAI API, and Render. Is that accurate, or should any technology be added or removed?",
  "requestedSchema": {
    "properties": {
      "stack_confirmation": {
        "type": "string",
        "title": "Tech stack",
        "enum": [
          "Yes, use this stack",
          "I need to change it"
        ],
        "default": "Yes, use this stack"
      },
      "changes": {
        "type": "string",
        "title": "Changes (if any)",
        "description": "If you chose to change it, list technologies to add or remove."
      }
    }
  }
}

Ask User
Completed with input: {
  "message": "What role or contributions should I list for Vivek Dadaso Kumbhar? If this is a solo project and you prefer no role listed, say “no role.”",
  "requestedSchema": {
    "properties": {
      "role": {
        "type": "string",
        "title": "Role or contribution",
        "description": "For example: Full-stack development, UI/UX, backend, deployment, or no role."
      }
    }
  }
}

Ask User
Completed with input: {
  "message": "The deployed app appears to be https://gitstory-frontend.onrender.com/. Is that the link you want in the README, and what is your demo video URL? If you don’t have one yet, say “not ready” and I’ll leave a clear placeholder.",
  "requestedSchema": {
    "properties": {
      "deployed_link": {
        "type": "string",
        "title": "Deployed app link",
        "default": "https://gitstory-frontend.onrender.com/"
      },
      "demo_video_link": {
        "type": "string",
        "title": "Demo video link",
        "description": "Paste the video URL, or enter “not ready” to use a placeholder."
      }
    }
  }
}

```markdown
# GitStory — GitHub Repository Explorer

## Team Name

Miyauuuu

## Team Members

- Vivek Dadaso Kumbhar — Solo developer

## Project Overview

GitStory is a web application that helps users understand GitHub repositories at a glance. By entering a repository name, users can explore its details, commit history and activity, contributors, programming languages, file structure, and frequently changed files in one visual dashboard.

## Tech Stack and Justification

| Technology | How it is used | Why it was chosen |
|---|---|---|
| **React** | Builds the interactive frontend dashboard. | Its reusable components help organize the interface and make features easier to maintain. |
| **Vite** | Runs the frontend during development and builds it for production. | It provides a fast development workflow and creates optimized files for deployment. |
| **Recharts** | Displays commit activity and language data as charts. | Visual charts make repository statistics easier to understand at a glance. |
| **Lucide React** | Provides icons throughout the interface. | It offers a consistent collection of icons that integrates well with React. |
| **Python** | Powers the backend application and data-processing logic. | Its readable syntax and broad ecosystem make it suitable for building the API. |
| **FastAPI** | Provides the backend REST API. | It supports asynchronous endpoints, request validation, and automatic API documentation. |
| **SQLAlchemy** | Handles database models and database access. | It keeps data operations structured and makes the application’s database code easier to maintain. |
| **SQLite** | Stores cached API responses and recent searches. | It requires no separate database server, keeping setup simple for this project. |
| **GitHub REST API** | Supplies repository details, commits, contributors, languages, and file-tree information. | It provides the GitHub data the dashboard needs without requiring repositories to be cloned. |
| **OpenAI API (optional)** | Generates AI summaries of repositories. | It provides an optional natural-language overview when an OpenAI API key is configured. |
| **Render** | Hosts the frontend website and backend API as separate services. | It deploys both parts of the application from the project repository. |

## Deployed Application

[Open GitStory](https://gitstory-frontend.onrender.com/)

## Demo Video

[Add the demo video link here](PASTE_YOUR_DEMO_VIDEO_LINK_HERE)
```
