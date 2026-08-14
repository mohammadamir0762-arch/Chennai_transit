#!/usr/bin/env python3
"""Regenerates backend/src/data/knownStops.js from the GTFS feeds in this
directory (chennai-gtfs.zip = rail, mtc-bus-gtfs.zip = bus). Run this
whenever either feed changes.

Usage: python3 generate-known-stops.py
"""
import csv
import io
import json
import zipfile
from datetime import date
from pathlib import Path

HERE = Path(__file__).parent
OUT_PATH = HERE.parent.parent / "backend" / "src" / "data" / "knownStops.js"

FEEDS = [
    ("chennai-gtfs.zip", "rail"),
    ("mtc-bus-gtfs.zip", "bus"),
]


def read_stops(zip_path):
    with zipfile.ZipFile(zip_path) as z:
        with z.open("stops.txt") as f:
            text = io.TextIOWrapper(f, encoding="utf-8")
            return list(csv.DictReader(text))


def main():
    seen_ids = set()
    stops = []
    for filename, mode in FEEDS:
        for row in read_stops(HERE / filename):
            stop_id = row["stop_id"]
            if stop_id in seen_ids:
                continue
            seen_ids.add(stop_id)
            stops.append(
                {
                    "id": stop_id,
                    "name": row["stop_name"].strip(),
                    "lat": round(float(row["stop_lat"]), 6),
                    "lng": round(float(row["stop_lon"]), 6),
                }
            )

    stops.sort(key=lambda s: s["name"])

    lines = [
        "// Real Chennai stops (rail + MTC bus), generated from the GTFS feeds",
        "// in otp/chennai/ by otp/chennai/generate-known-stops.py — do not edit",
        "// by hand, regenerate instead. Raw feed data: lookup and display",
        "// formatting live in ../data/stopSearch.js and ../data/stopNames.js.",
        "",
        "// When the underlying GTFS feeds were last rebuilt from upstream. Surfaced",
        "// in the UI so riders can judge how current the schedule data is.",
        f'export const dataGeneratedAt = "{date.today().isoformat()}";',
        "",
        "export const knownStops = [",
    ]
    for s in stops:
        name = json.dumps(s["name"])
        lines.append(f'  {{ id: {json.dumps(s["id"])}, name: {name}, lat: {s["lat"]}, lng: {s["lng"]} }},')
    lines.append("];")
    lines.append("")

    OUT_PATH.write_text("\n".join(lines))
    print(f"wrote {OUT_PATH} ({len(stops)} stops)")


if __name__ == "__main__":
    main()
