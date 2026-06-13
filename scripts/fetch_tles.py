#!/usr/bin/env python3
"""Refresh data/tles.json with current TLEs from CelesTrak.

Run on a schedule by .github/workflows/spacetrack.yml. Fetches a curated
set of catalogue objects spanning the object classes relevant to SSA:
stations, active payloads, a defunct satellite, ASAT/collision debris,
and a spent rocket body.

Per-object failures fall back to the previous entry in data/tles.json,
so a partial CelesTrak outage never blanks the map.
"""

from __future__ import annotations

import datetime as dt
import json
import pathlib
import sys
import time

import requests

OUT = pathlib.Path(__file__).resolve().parent.parent / "data" / "tles.json"
GP = "https://celestrak.org/NORAD/elements/gp.php"
UA = {"User-Agent": "personal-site-groundtrack (github.io; contact: Vithurs@my.yorku.ca)"}

# (query params, category, optional display-name override)
TARGETS = [
    ({"CATNR": 25544}, "station", "ISS (ZARYA)"),
    ({"CATNR": 48274}, "station", "CSS (TIANHE)"),
    ({"CATNR": 20580}, "payload", "HUBBLE (HST)"),
    ({"CATNR": 25994}, "payload", "TERRA"),
    ({"CATNR": 39634}, "payload", "SENTINEL-1A"),
    ({"CATNR": 44713}, "payload", "STARLINK-1007"),
    ({"CATNR": 27386}, "defunct", "ENVISAT (DEFUNCT)"),
    ({"GROUP": "fengyun-1c-debris"}, "debris", "FENGYUN-1C DEB (ASAT)"),
    ({"GROUP": "cosmos-2251-debris"}, "debris", "COSMOS-2251 DEB"),
    ({"NAME": "SL-16 R/B"}, "rb", None),  # keep CelesTrak's name
]


def first_tle(text: str) -> tuple[str, str, str] | None:
    """Return (name, line1, line2) for the first 3LE entry in a response."""
    lines = [ln.rstrip() for ln in text.splitlines() if ln.strip()]
    for i in range(len(lines) - 2):
        if lines[i + 1].startswith("1 ") and lines[i + 2].startswith("2 "):
            return lines[i].strip(), lines[i + 1], lines[i + 2]
    return None


def norad_id(line1: str) -> int:
    return int(line1[2:7])


def main() -> int:
    previous: dict[int, dict] = {}
    if OUT.exists():
        try:
            for o in json.loads(OUT.read_text())["objects"]:
                previous[o["id"]] = o
        except Exception:
            pass

    objects, failures = [], 0
    for params, cat, name_override in TARGETS:
        try:
            r = requests.get(GP, params={**params, "FORMAT": "tle"}, headers=UA, timeout=30)
            r.raise_for_status()
            parsed = first_tle(r.text)
            if not parsed:
                raise ValueError(f"no TLE in response for {params}")
            name, l1, l2 = parsed
            objects.append({
                "id": norad_id(l1),
                "name": name_override or name,
                "cat": cat,
                "line1": l1,
                "line2": l2,
            })
        except Exception as exc:  # keep previous entry if we had one
            failures += 1
            print(f"WARN: {params} failed ({exc})", file=sys.stderr)
            stale = next((p for p in previous.values()
                          if p.get("cat") == cat and (name_override is None or p["name"] == name_override)), None)
            if stale:
                objects.append(stale)
        time.sleep(2)  # be polite to CelesTrak

    if len(objects) < 4:
        print("ERROR: too few objects fetched; keeping existing file.", file=sys.stderr)
        return 1

    payload = {
        "updated": dt.datetime.now(dt.timezone.utc).strftime("%Y-%m-%d"),
        "source": "CelesTrak (celestrak.org)",
        "objects": objects,
    }
    OUT.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {len(objects)} objects ({failures} fallbacks) to {OUT}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
