"""Detect overlapping full-time roles in a list of role records.

Each role is expected to be a dict with at least:
  - "title": str
  - "start": "YYYY-MM-DD"
  - "end": "YYYY-MM-DD" or None for ongoing
  - "full_time": bool

The primary helper `detect_full_time_overlaps` returns pairs of roles that
overlap while both marked full-time.
"""
from typing import List, Dict, Tuple
from datetime import datetime


def _parse_date(d: str):
	if d is None:
		return None
	# Be tolerant: accept ISO formats or common human formats like 'Jun 2025'
	if d is None:
		return None
	if isinstance(d, str):
		d = d.strip()
		# Try ISO first
		try:
			return datetime.fromisoformat(d)
		except Exception:
			pass
		# Try YYYY-MM-DD or YYYY-MM
		for fmt in ("%Y-%m-%d", "%Y-%m", "%Y"):
			try:
				return datetime.strptime(d, fmt)
			except Exception:
				continue
		# Try 'Jun 2025' or 'June 2025'
		for fmt in ("%b %Y", "%B %Y"):
			try:
				return datetime.strptime(d, fmt)
			except Exception:
				continue
		# last resort: None
		return None
	# If not a string, return None
	return None


def detect_full_time_overlaps(roles: List[Dict]) -> List[Tuple[Dict, Dict]]:
	"""Return list of pairs (role_a, role_b) that are both full-time and overlap.

	Args:
		roles: list of role dicts with `start`, `end`, and `full_time`.

	Returns:
		list of tuple pairs indicating overlapping roles.
	"""
	normalized = []
	for r in roles:
		start = _parse_date(r.get("start"))
		# skip roles without a valid start date since we can't compare
		if start is None:
			continue
		end = _parse_date(r.get("end"))
		if end is None:
			# treat ongoing as far future
			end = datetime.max
		normalized.append((r, start, end))

	overlaps = []
	n = len(normalized)
	for i in range(n):
		ri, si, ei = normalized[i]
		if not ri.get("full_time", False):
			continue
		for j in range(i + 1, n):
			rj, sj, ej = normalized[j]
			if not rj.get("full_time", False):
				continue
			latest_start = max(si, sj)
			earliest_end = min(ei, ej)
			if latest_start <= earliest_end:
				overlaps.append((ri, rj))

	return overlaps

