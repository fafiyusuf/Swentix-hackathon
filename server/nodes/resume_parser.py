from typing import List, Dict, Any, Tuple
import re
import pdfplumber
import os


def extract_lines(text: str) -> List[str]:
    if not text:
        return []
    return [line.strip() for line in text.splitlines() if line.strip()]


def parse_dates(line: str) -> Tuple[str, str]:
    # Try common date patterns and normalize to ISO YYYY-MM-DD (best-effort)
    def normalize_date(token: str):
        if not token:
            return None
        token = token.strip()
        lower = token.lower()
        if lower in ("present", "ongoing", "current", "now"):
            return None

        # YYYY-MM-DD or YYYY-MM
        m = re.match(r"^(\d{4})-(\d{2})-(\d{2})$", token)
        if m:
            return token
        m = re.match(r"^(\d{4})-(\d{2})$", token)
        if m:
            return f"{m.group(1)}-{m.group(2)}-01"

        # YYYY
        m = re.match(r"^(\d{4})$", token)
        if m:
            return f"{m.group(1)}-01-01"

        # Month YYYY like 'Jun 2025' or 'June 2025'
        months = {
            'jan': '01','feb':'02','mar':'03','apr':'04','may':'05','jun':'06',
            'jul':'07','aug':'08','sep':'09','oct':'10','nov':'11','dec':'12'
        }
        m = re.match(r"^([A-Za-z]{3,9})\s+(\d{4})$", token)
        if m:
            mon = m.group(1)[:3].lower()
            mm = months.get(mon)
            if mm:
                return f"{m.group(2)}-{mm}-01"

        return None

    # capture common date-like tokens separated by non-word chars
    matches = re.findall(r"(\d{4}-\d{2}-\d{2}|\d{4}-\d{2}|\b[A-Za-z]{3,9}\s\d{4}\b|\d{4}|present|ongoing|current|now)", line, flags=re.I)
    start = normalize_date(matches[0]) if matches else None
    end = None
    if len(matches) > 1:
        end = normalize_date(matches[1])
    return start, end


def parse_location(line: str) -> str:
    match = re.search(r"\b[A-Z][a-z]+,\s?[A-Z]{2}\b", line)
    return match.group(0) if match else ""


def parse_roles(lines: List[str]) -> List[Dict[str, Any]]:
    roles: List[Dict[str, Any]] = []
    for line in lines:
        if re.search(r"(Engineer|Developer|Intern|Manager|Director)", line, re.I):
            start, end = parse_dates(line)
            location = parse_location(line)
            title_match = re.search(r"(Engineer|Developer|Intern|Manager|Director)", line, re.I)
            title = title_match.group(0) if title_match else line.strip()
            company = line.split(title)[0].strip() if title in line else "Unknown"
            roles.append({
                "title": title,
                "company": company,
                "start": start,
                "end": end,
                "full_time": "full-time" in line.lower() or True,
                "location": location,
                "description": line.strip(),
                "expected_keywords": ""
            })
    return roles


def parse_github(text: str) -> List[str]:
    return re.findall(r"https?://github\.com/[\w\-\./]+", text)


def parse_linkedin(text: str) -> str:
    matches = re.findall(r"https?://www\.linkedin\.com/in/[\w\-]+", text)
    return matches[0] if matches else ""


def node_resume_parser(file_path: str) -> Dict[str, Any]:
    text = ""
    try:
        if file_path.lower().endswith(".pdf"):
            # file_path may be absolute or relative to configured upload dir
            with pdfplumber.open(file_path) as pdf:
                for page in pdf.pages:
                    t = page.extract_text()
                    if t:
                        text += t + "\n"
        else:
            with open(file_path, "r", encoding="utf-8") as f:
                text = f.read()
    except Exception:
        text = ""

    lines = extract_lines(text)

    cv = {
        "roles": parse_roles(lines),
        "github_repos": parse_github(text),
        "linkedin": parse_linkedin(text),
    }

    return cv
