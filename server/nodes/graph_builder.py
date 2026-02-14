from typing import TypedDict, Dict, Any, List
from langgraph.graph import StateGraph, END
from datetime import datetime

# Import your existing nodes
from nodes.resume_parser import node_resume_parser
from nodes.tavily_search import search_tavily
from nodes.github_commits import get_commits_between
from nodes.overlapping_roles import detect_full_time_overlaps
from nodes.location_check import detect_conflicting_locations
from nodes.company_purpose import purpose_matches


# -----------------------------
# STATE
# -----------------------------

class CVState(TypedDict, total=False):
    file_path: str
    parsed_cv: Dict[str, Any]
    tavily_results: List[Dict]
    github_commits: Dict[str, Any]
    overlaps: List
    location_conflicts: List
    company_checks: List[Dict]
    risk: Dict


# -----------------------------
# NODES
# -----------------------------

def resume_parser_node(state: CVState) -> CVState:
    parsed = node_resume_parser(state["file_path"])
    state["parsed_cv"] = parsed
    return state


def tavily_node(state: CVState) -> CVState:
    cv = state["parsed_cv"]
    roles = cv.get("roles", [])
    first_title = roles[0]["title"] if roles else ""
    query = f"{cv.get('name', '')} {first_title}"
    state["tavily_results"] = search_tavily(query)
    return state


def github_node(state: CVState) -> CVState:
    cv = state["parsed_cv"]
    repos = cv.get("github_repos", [])
    results = {}

    for role in cv.get("roles", []):
        since = role.get("start")
        until = role.get("end")

        if not since:
            continue

        # Convert to ISO format
        try:
            since_iso = datetime.strptime(since, "%Y-%m-%d").isoformat() + "Z"
        except:
            continue

        until_iso = datetime.utcnow().isoformat() + "Z"

        for repo in repos:
            commits = get_commits_between(repo, since_iso, until_iso)
            results[repo] = commits

    state["github_commits"] = results
    return state


def overlap_node(state: CVState) -> CVState:
    roles = state["parsed_cv"].get("roles", [])
    state["overlaps"] = detect_full_time_overlaps(roles)
    return state


def location_node(state: CVState) -> CVState:
    roles = state["parsed_cv"].get("roles", [])
    state["location_conflicts"] = detect_conflicting_locations(roles)
    return state


def company_node(state: CVState) -> CVState:
    roles = state["parsed_cv"].get("roles", [])
    checks = []

    for role in roles:
        match, details = purpose_matches(
            role.get("description", ""),
            role.get("expected_keywords", "")
        )
        checks.append({
            "role": role.get("title"),
            "match": match,
            "details": details
        })

    state["company_checks"] = checks
    return state


def risk_node(state: CVState) -> CVState:
    overlaps = state.get("overlaps", [])
    locations = state.get("location_conflicts", [])
    company_checks = state.get("company_checks", [])
    github_data = state.get("github_commits", {})

    score = 0

    # Overlap penalty
    score += min(len(overlaps) * 0.3, 1.0)

    # Location conflict penalty
    score += min(len(locations) * 0.3, 1.0)

    # Company mismatch penalty
    score += sum(0.2 for c in company_checks if not c["match"])

    # GitHub scoring
    total_commits = sum(len(v) for v in github_data.values())
    if total_commits == 0:
        score += 0.5  # suspicious: no commits

    if score > 1.5:
        decision = "Reject"
    elif score > 1.0:
        decision = "Manual Review"
    else:
        decision = "Accept"

    state["risk"] = {
        "risk_score": round(score, 2),
        "decision": decision,
        "total_commits": total_commits
    }

    return state


# -----------------------------
# GRAPH BUILD
# -----------------------------

def build_cv_graph():
    graph = StateGraph(CVState)

    graph.add_node("resume_parser", resume_parser_node)
    graph.add_node("tavily", tavily_node)
    graph.add_node("github", github_node)
    graph.add_node("overlap", overlap_node)
    graph.add_node("location", location_node)
    graph.add_node("company", company_node)
    graph.add_node("risk", risk_node)

    graph.set_entry_point("resume_parser")

    graph.add_edge("resume_parser", "tavily")
    graph.add_edge("tavily", "github")
    graph.add_edge("github", "overlap")
    graph.add_edge("overlap", "location")
    graph.add_edge("location", "company")
    graph.add_edge("company", "risk")
    graph.add_edge("risk", END)

    return graph.compile()


# -----------------------------
# EXECUTION FUNCTION
# -----------------------------

def run_cv_graph(file_path: str):
    app = build_cv_graph()

    initial_state = {
        "file_path": file_path
    }

    result = app.invoke(initial_state)
    return result
