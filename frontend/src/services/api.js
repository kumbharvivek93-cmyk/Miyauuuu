const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api";

export async function api(path, options = {}) {
  let response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      headers: { ...(options.body ? { "Content-Type": "application/json" } : {}), ...options.headers },
      ...options,
    });
  } catch {
    throw new Error("Could not reach the GitStory API. Check that the backend is running.");
  }

  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = typeof body.detail === "string" ? body.detail : "The request failed.";
    throw new Error(message);
  }
  return body;
}

export function repositoryUrl(owner, repo) {
  return `/repo/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`;
}
