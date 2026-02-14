from typing import List, Dict, Optional
import os
import requests


def get_commits_between(
    repo_full_name: str,
    since: str,
    until: str,
    token: Optional[str] = None
) -> Dict:
    """Return commits + activity score for a repo within date range."""

    if token is None:
        token = os.getenv("GITHUB_TOKEN")

    headers = {"Accept": "application/vnd.github+json"}
    if token:
        headers["Authorization"] = f"token {token}"

    url = f"https://api.github.com/repos/{repo_full_name.strip()}/commits"
    params = {"since": since, "until": until, "per_page": 100}

    commits: List[Dict] = []
    session = requests.Session()

    try:
        page = 1
        while True:
            params["page"] = page
            resp = session.get(url, headers=headers, params=params, timeout=15)
            resp.raise_for_status()
            data = resp.json()

            if not data:
                break

            for c in data:
                commit = c.get("commit", {})
                author = commit.get("author", {})

                commits.append(
                    {
                        "sha": c.get("sha"),
                        "author": author.get("name") or c.get("author", {}).get("login"),
                        "date": author.get("date"),
                        "message": commit.get("message"),
                        "url": c.get("html_url"),
                    }
                )

            if len(data) < params["per_page"]:
                break

            page += 1

    except Exception:
        return {
            "commits": commits,
            "commit_count": len(commits),
            "score": 0,
            "error": "Failed to fetch commits"
        }

    # ----------------------
    # SCORING LOGIC
    # ----------------------
    commit_count = len(commits)

    if commit_count == 0:
        score = 0
    elif commit_count <= 5:
        score = 0.3
    elif commit_count <= 20:
        score = 0.6
    else:
        score = 1.0

    return {
        "commits": commits,
        "commit_count": commit_count,
        "score": score
    }
