"""Detect working-in-two-cities overlaps from role/location records.

Each role is expected to contain:
  - "location": string (e.g. "New York, NY")
  - "start": "YYYY-MM-DD"
  - "end": "YYYY-MM-DD" or None

This module exposes `detect_conflicting_locations` which returns overlapping
roles that were in different cities at the same time.
"""
from typing import List, Dict, Tuple
from datetime import datetime


def _parse_date(d: str):
	if d is None:
		return None
	# tolerant parsing: try ISO then common formats
	if isinstance(d, str):
		d = d.strip()
		try:
			return datetime.fromisoformat(d)
		except Exception:
			pass
		for fmt in ("%Y-%m-%d", "%Y-%m", "%Y", "%b %Y", "%B %Y"):
			try:
				return datetime.strptime(d, fmt)
			except Exception:
				continue
		return None
	return None


def detect_conflicting_locations(roles: List[Dict]) -> List[Tuple[Dict, Dict]]:
	"""Return pairs of roles that overlap in time but have different cities.

	Args:
		roles: list of role dicts with `start`, `end`, and `location`.

	Returns:
		list of tuple pairs (role_a, role_b) representing conflicts.
	"""
	normalized = []
	for r in roles:
		start = _parse_date(r.get("start"))
		# skip roles without a valid start date
		if start is None:
			continue
		end = _parse_date(r.get("end"))
		if end is None:
			end = datetime.max
		loc = (r.get("location") or "").strip().lower()
		normalized.append((r, start, end, loc))

	conflicts = []
	n = len(normalized)
	for i in range(n):
		ri, si, ei, li = normalized[i]
		for j in range(i + 1, n):
			rj, sj, ej, lj = normalized[j]
			latest_start = max(si, sj)
			earliest_end = min(ei, ej)
			if latest_start <= earliest_end and li and lj and li != lj:
				conflicts.append((ri, rj))

	return conflicts
