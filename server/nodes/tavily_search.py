"""Tavily / Google search helper node.

This module provides a small helper `search_tavily` that will attempt to
call a Tavily search API when an API URL / key are provided via environment
variables. When no API is configured the function returns a structured
placeholder so callers can be tested locally.

The function is intentionally small and easy to replace with a real
integration later.
"""
from typing import List, Dict, Optional
import os
import json
import urllib.parse
import urllib.request


def search_tavily(query: str, max_results: int = 5) -> List[Dict[str, str]]:
	"""Search Tavily (or return placeholder results).

	Behavior:
	- If environment variable `TAVILY_API_URL` is set, make a GET request
	  to that URL with query parameters `q` and `limit` and return parsed
	  JSON results (expected to be a list of dicts).
	- Otherwise return an empty list with a debug placeholder entry.

	Args:
		query: Search query string.
		max_results: Maximum number of results to return.

	Returns:
		A list of result dicts with at least `title` and `link` keys.
	"""
	api_url = os.getenv("TAVILY_API_URL")
	if not api_url:
		# No external API configured — return a stable placeholder
		return [
			{
				"title": f"placeholder result for: {query}",
				"snippet": "No Tavily API configured; this is a placeholder.",
				"link": "",
			}
		]

	params = {"q": query, "limit": str(max_results)}
	url = api_url + "?" + urllib.parse.urlencode(params)

	try:
		with urllib.request.urlopen(url, timeout=10) as resp:
			body = resp.read()
			data = json.loads(body)
			if isinstance(data, list):
				return data[:max_results]
			# If the API returns a dict with `results` key
			if isinstance(data, dict) and "results" in data:
				return data["results"][:max_results]
	except Exception:
		# On any error return an empty placeholder to avoid raising in nodes
		return [
			{
				"title": f"error fetching results for: {query}",
				"snippet": "Request failed or returned unexpected data.",
				"link": "",
			}
		]

	return []

