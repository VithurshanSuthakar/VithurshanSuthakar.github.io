#!/usr/bin/env python3
"""Refresh data/spacetrack.json from the public Space-Track.org login page.

The "Space Scoreboard" table and the advisory banners are shown on
https://www.space-track.org/auth/login *before* authentication, so this
script needs no credentials. It is run on a schedule by
.github/workflows/spacetrack.yml.

If the page layout changes and parsing fails, the script exits non-zero
WITHOUT touching the existing JSON, so the site keeps showing the last
good snapshot.
"""

from __future__ import annotations

import datetime as dt
import json
import pathlib
import re
import sys

import requests
from bs4 import BeautifulSoup

URL = "https://www.space-track.org/auth/login"
OUT = pathlib.Path(__file__).resolve().parent.parent / "data" / "spacetrack.json"

KEY_MAP = {
    "active payloads": "active_payloads",
    "analyst objects": "analyst_objects",
    "debris": "debris",
    "total": "total",
}


def parse_scoreboard(soup: BeautifulSoup) -> dict[str, int]:
    """Find the table whose header mentions OBJECT TYPE and map its rows."""
    scoreboard: dict[str, int] = {}
    for table in soup.find_all("table"):
        header = table.get_text(" ", strip=True).upper()
        if "OBJECT TYPE" not in header:
            continue
        for row in table.find_all("tr"):
            cells = [c.get_text(strip=True) for c in row.find_all(["td", "th"])]
            if len(cells) < 2:
                continue
            key = KEY_MAP.get(cells[0].strip().lower())
            num = re.sub(r"[^\d]", "", cells[1])
            if key and num:
                scoreboard[key] = int(num)
        if scoreboard:
            break
    return scoreboard


def parse_alert(soup: BeautifulSoup) -> str | None:
    """Return the red (danger) advisory if present, else the first banner."""
    candidates = soup.select(".alert-danger") or soup.select(".alert")
    for el in candidates:
        # Drop dismiss buttons / inline links' decorations, keep the text
        for btn in el.select("button, .close"):
            btn.decompose()
        text = " ".join(el.get_text(" ", strip=True).split())
        text = text.strip(" ×x")
        if len(text) > 40:  # skip empty/cosmetic banners
            return text
    return None


def main() -> int:
    resp = requests.get(
        URL,
        timeout=30,
        headers={"User-Agent": "personal-site-scoreboard (github.io; contact: Vithurs@my.yorku.ca)"},
    )
    resp.raise_for_status()
    soup = BeautifulSoup(resp.text, "html.parser")

    scoreboard = parse_scoreboard(soup)
    missing = set(KEY_MAP.values()) - scoreboard.keys()
    if missing:
        print(f"ERROR: scoreboard parse incomplete, missing {sorted(missing)}", file=sys.stderr)
        return 1

    payload = {
        "updated": dt.datetime.now(dt.timezone.utc).strftime("%Y-%m-%d"),
        "scoreboard": scoreboard,
        "alert": parse_alert(soup),
    }

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {OUT}:")
    print(json.dumps(payload, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
