#!/usr/bin/env python3
"""Refresh data/spacetrack.json from the Space-Track.org authenticated API.

Authenticates with Space-Track using credentials passed via environment
variables SPACETRACK_USER and SPACETRACK_PASS (set as GitHub Actions secrets),
then queries the `boxscore` class, which returns object counts by country.
The single COUNTRY="ALL" row holds the global totals shown on the public
Space Scoreboard.

The four figures published on the site mirror the public scoreboard:
    active_payloads = ORBITAL_PAYLOAD_COUNT
    debris          = ORBITAL_DEBRIS_COUNT
    total           = ORBITAL_TOTAL_COUNT
    analyst_objects = total - payloads - debris   (matches the public page's
                      "Analyst Objects", which folds in rocket bodies etc.)

Failure policy: if anything goes wrong (missing creds, network/auth error,
unexpected response), the script logs the reason and exits 0 WITHOUT touching
the existing JSON, so the workflow stays green and the site keeps showing the
last good snapshot. Set STRICT=1 in the environment to exit non-zero instead.

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
BOXSCORE_URL = (
    "https://www.space-track.org/basicspacedata/query/class/boxscore/format/json"
)
OUT = pathlib.Path(__file__).resolve().parent.parent / "data" / "spacetrack.json"
UA = {"User-Agent": "personal-site-scoreboard (github.io; contact: Vithurs@my.yorku.ca)"}

STRICT = os.environ.get("STRICT", "").strip() not in ("", "0", "false", "False")


def skip(reason: str) -> int:
    """Log why we're skipping and keep the existing data file untouched."""
    print(f"SKIP: {reason}", file=sys.stderr)
    print("Keeping existing data/spacetrack.json (last good snapshot).")
    return 1 if STRICT else 0


def to_int(value) -> int:
    try:
        return int(str(value).strip())
    except (ValueError, TypeError, AttributeError):
        return 0


def _existing_alert():
    """Return the alert already stored in the JSON, if any (API has no banner)."""
    try:
        return json.loads(OUT.read_text()).get("alert")
    except Exception:
        return None


def main() -> int:
    user = os.environ.get("SPACETRACK_USER", "").strip()
    pwd = os.environ.get("SPACETRACK_PASS", "").strip()
    if not user or not pwd:
        return skip("SPACETRACK_USER / SPACETRACK_PASS not set in environment.")

    try:
        with requests.Session() as session:
            session.headers.update(UA)

            # Authenticate. A failed login returns HTTP 200 with {"Login": "Failed"}.
            login = session.post(
                LOGIN_URL,
                data={"identity": user, "password": pwd},
                timeout=30,
            )
            login.raise_for_status()
            try:
                body = login.json()
                if isinstance(body, dict) and body.get("Login") == "Failed":
                    return skip("Space-Track rejected the credentials (Login: Failed).")
            except ValueError:
                pass  # a successful login may return a non-JSON body; that's fine

            # Query the boxscore.
            resp = session.get(BOXSCORE_URL, timeout=30)
            resp.raise_for_status()
            rows = resp.json()
    except requests.RequestException as exc:
        return skip(f"network/HTTP error talking to Space-Track: {exc}")
    except ValueError as exc:
        return skip(f"could not parse boxscore JSON: {exc}")

    if not isinstance(rows, list) or not rows:
        return skip(f"unexpected boxscore response: {str(rows)[:200]}")

    all_row = next(
        (r for r in rows if str(r.get("COUNTRY", "")).strip().upper() == "ALL"),
        None,
    )
    if all_row is None:
        return skip("boxscore had no COUNTRY=ALL summary row.")

    payloads = to_int(all_row.get("ORBITAL_PAYLOAD_COUNT"))
    debris = to_int(all_row.get("ORBITAL_DEBRIS_COUNT"))
    total = to_int(all_row.get("ORBITAL_TOTAL_COUNT"))
    analyst = max(total - payloads - debris, 0)

    if total == 0 or payloads == 0:
        return skip(f"boxscore parsed to zero counts; raw ALL row: {all_row}")

    payload = {
        "updated": dt.datetime.now(dt.timezone.utc).strftime("%Y-%m-%d"),
        "scoreboard": {
            "active_payloads": payloads,
            "analyst_objects": analyst,
            "debris": debris,
            "total": total,
        },
        # The advisory banner lives only on the public HTML page, not the API;
        # preserve any previously captured alert rather than blanking it.
        "alert": _existing_alert(),
    }

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {OUT}:")
    print(json.dumps(payload, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())