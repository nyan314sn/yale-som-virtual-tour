"""Read-only access to the Yale SOM course database (data/yale_som.db).

The table is small (a few hundred course sections), so it is loaded into memory once
and every lookup is plain Python filtering.
"""

import re
import sqlite3
from functools import lru_cache
from pathlib import Path

DB_PATH = Path(__file__).resolve().parent.parent / "data" / "yale_som.db"

FIELDS = [
    "course_number", "course_title", "course_category", "course_type", "course_session",
    "course_description", "faculty_1", "faculty_bio", "daytimes", "timings_day",
    "timings_start", "timings_end", "room", "section", "units", "syllabus",
]
DAY_CODES = {"mon": "Mo", "tue": "Tu", "wed": "We", "thu": "Th", "fri": "Fr", "sat": "Sa", "sun": "Su"}


@lru_cache(maxsize=1)
def courses() -> list[dict]:
    conn = sqlite3.connect(f"file:{DB_PATH.as_posix()}?mode=ro", uri=True)
    conn.row_factory = sqlite3.Row
    try:
        rows = conn.execute(f"select {', '.join(FIELDS)} from courses order by course_number, section").fetchall()
    finally:
        conn.close()
    return [{k: (r[k] or "").strip() if isinstance(r[k], str) else r[k] for k in FIELDS} for r in rows]


def display_name(faculty: str) -> str:
    """'Zaman, Tauhid' -> 'Tauhid Zaman'."""
    last, _, first = faculty.partition(",")
    return f"{first.strip()} {last.strip()}".strip()


def slug(faculty: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", display_name(faculty).lower()).strip("-")


def summary(c: dict) -> dict:
    """Compact view of one section, for search results."""
    return {
        "course": c["course_number"],
        "title": c["course_title"],
        "professor": display_name(c["faculty_1"]) or "TBA",
        "session": c["course_session"],
        "when": " ".join(c["daytimes"].split()) or "not scheduled / TBA",
        "room": c["room"] or "TBA",
        "section": c["section"],
    }


def details(c: dict) -> dict:
    return summary(c) | {
        "category": c["course_category"],
        "units": c["units"],
        "description": c["course_description"],
        "syllabus_link": c["syllabus"] or None,
    }


def _norm(s: str) -> str:
    return re.sub(r"\s+", " ", s.lower()).strip()


def search(query: str, limit: int = 10) -> list[dict]:
    """Rank courses (one result per course, not per section) by whole-word matches of the query
    in number/title/professor (weighted 3) and description (weighted 1)."""
    words = [w for w in re.findall(r"[a-z0-9]+", query.lower()) if len(w) > 1]
    if not words:
        return []
    pats = [re.compile(rf"\b{re.escape(w)}\b") for w in words]
    groups: dict[tuple, dict] = {}
    for c in courses():
        head = _norm(f"{c['course_number']} {c['course_number'].replace(' ', '')} {c['course_title']} {c['faculty_1']}")
        body = _norm(c["course_description"])
        score = sum(3 if p.search(head) else 1 if p.search(body) else 0 for p in pats)
        if score:
            g = groups.setdefault((c["course_number"], c["course_title"], c["faculty_1"]), {"score": 0, "first": c, "n": 0})
            g["score"] = max(g["score"], score)
            g["n"] += 1
    ranked = sorted(groups.values(), key=lambda g: -g["score"])[:limit]
    return [summary(g["first"]) | {"sections": g["n"]} for g in ranked]


def by_number(course_number: str) -> list[dict]:
    key = re.sub(r"\s+", "", course_number.upper())
    return [details(c) for c in courses() if re.sub(r"\s+", "", c["course_number"].upper()) == key]


def by_professor(name: str) -> list[dict]:
    words = re.findall(r"[a-z]+", name.lower())
    hits = [c for c in courses() if c["faculty_1"] and all(w in c["faculty_1"].lower() for w in words)]
    return _dedupe([summary(c) for c in hits])


def schedule(day: str | None = None, room: str | None = None, session: str | None = None) -> list[dict]:
    code = DAY_CODES.get((day or "")[:3].lower())
    room_key = re.sub(r"\D", "", room or "")
    out = []
    for c in courses():
        if code and code not in c["timings_day"]:
            continue
        if room_key and room_key not in c["room"]:
            continue
        if session and session.lower() != c["course_session"].lower():
            continue
        out.append(summary(c))
    return sorted(_dedupe(out), key=lambda s: s["when"])


def bio(faculty: str) -> str:
    return next((c["faculty_bio"] for c in courses() if c["faculty_1"] == faculty and c["faculty_bio"]), "")


def faculty_names() -> list[str]:
    return sorted({c["faculty_1"] for c in courses() if c["faculty_1"]})


def _dedupe(items: list[dict]) -> list[dict]:
    seen, out = set(), []
    for it in items:
        key = tuple(sorted(it.items()))
        if key not in seen:
            seen.add(key)
            out.append(it)
    return out
