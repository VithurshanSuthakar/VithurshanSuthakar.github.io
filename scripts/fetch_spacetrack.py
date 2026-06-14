#!/usr/bin/env python3
"""Refresh data/spacetrack.json from the Space-Track.org authenticated API.

Authenticates with Space-Track using credentials passed via environment
variables SPACETRACK_USER and SPACETRACK_PASS (set as GitHub Actions secrets).
Fetches the boxscore endpoint which returns object counts by category.

If the fetch or parse fails the script exits non-zero WITHOUT touching the
existing JSON, so the site keeps showing the last good snapshot.

Run on a schedule by .github/workflows/spacetrack.yml.
"""

from __future__ import annotations

import datetime as dt
import json
import os
import pathlib
import sys

import requests

LOGIN_URL = "https://www.space-track.org/ajaxauth/login"
BOXSCORE_URL = "https://www.space-track.org/basicspacedata/query/class/boxscore/format/json"
OUT = pathlib.Path(__file__).resolve().parent.parent / "data" / "spacetrack.json"
UA = {"User-Agent": "personal-site-scoreboard (github.io; contact: Vithurs@my.yorku.ca)"}

# Map Space-Track boxscore field names -> our JSON keys
# The boxscore returns one row per country; we sum across all rows.
FIELD_MAP = {
    "PAYLOAD_COUNT":        "active_payloads",
    "ROCKET_BODY_COUNT":    "rocket_bodies",
    "DEBRIS_COUNT":         "debris",
    "TOTAL_COUNT":          "total",
}


def get_credentials() -> tuple[str, str]:
    user = os.environ.get("SPACETRACK_USER", "").strip()
    pwd  = os.environ.get("SPACETRACK_PASS", "").strip()
    if not user or not pwd:
        print(
            "ERROR: SPACETRACK_USER and SPACETRACK_PASS must be set as environment variables.",
            file=sys.stderr,
        )
        sys.exit(1)
    return user, pwd


def fetch_boxscore(session: requests.Session) -> list[dict]:
    resp = session.get(BOXSCORE_URL, headers=UA, timeout=30)
    resp.raise_for_status()
    data = resp.json()
    if not isinstance(data, list) or len(data) == 0:
        raise ValueError(f"Unexpected boxscore response: {resp.text[:300]}")
    return data


def sum_counts(rows: list[dict]) -> dict[str, int]:
    """Sum numeric fields across all country rows."""
    totals: dict[str, int] = {v: 0 for v in FIELD_MAP.values()}
    for row in rows:
        for src_key, dst_key in FIELD_MAP.items():
            val = row.get(src_key)
            if val is not None:
                try:
                    totals[dst_key] += int(val)
                except (ValueError, TypeError):
                    pass
    return totals


def main() -> int:
    user, pwd = get_credentials()

    with requests.Session() as session:
        # Authenticate
        login_resp = session.post(
            LOGIN_URL,
            data={"identity": user, "password": pwd},
            headers=UA,
            timeout=30,
        )
        login_resp.raise_for_status()
        if "login" in login_resp.url.lower() or '"Login"' in login_resp.text:
            print("ERROR: Space-Track login failed — check credentials.", file=sys.stderr)
            return 1

        # Fetch boxscore
        try:
            rows = fetch_boxscore(session)
        except Exception as exc:
            print(f"ERROR: boxscore fetch failed: {exc}", file=sys.stderr)
            return 1

    counts = sum_counts(rows)

    # Sanity check — all keys must be present and non-zero
    missing = [k for k, v in counts.items() if v == 0]
    if missing:
        print(f"ERROR: zero counts for {missing} — parse may have failed.", file=sys.stderr)
        print(f"Raw first row: {rows[0]}", file=sys.stderr)
        return 1

    payload = {
        "updated": dt.datetime.now(dt.timezone.utc).strftime("%Y-%m-%d"),
        "scoreboard": counts,
        "alert": None,   # alert banners require scraping; omitted in API mode
    }

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {OUT}:")
    print(json.dumps(payload, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
