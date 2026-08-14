#!/usr/bin/env python3
"""Generates a small synthetic-but-valid GTFS feed (sample-gtfs.zip) for
testing the OTP pipeline before real launch-city data is sourced. One bus
route, 4 stops spaced ~7km apart (Bengaluru-area coordinates, chosen to be
far enough apart that a real trip planner prefers the bus over walking),
running every 30 minutes from 06:00 to 22:30 in both directions.

Usage: python generate-sample-gtfs.py
Produces sample-gtfs.zip in this directory. Pair with streets.osm.xml
(converted to streets.osm.pbf via `osmium cat streets.osm.xml -o
streets.osm.pbf`) as the OSM input for the OTP graph build.
"""
import csv
import io
import zipfile
from pathlib import Path

OUT_DIR = Path(__file__).parent

STOPS = [
    ("S1", "Main St Bus Stop", 12.9716, 77.5946),
    ("S2", "Market Square", 12.9850, 77.6050),
    ("S3", "University Gate", 13.0000, 77.6200),
    ("S4", "Central Station", 13.0150, 77.6450),
]

OFFSETS_OUT = [0, 8, 18, 30]  # minutes from trip start, per stop above
OFFSETS_IN = [0, 9, 19, 30]  # reverse direction


def write_csv(rows, header):
    buf = io.StringIO()
    writer = csv.writer(buf, lineterminator="\n")
    writer.writerow(header)
    writer.writerows(rows)
    return buf.getvalue()


def build_trips_and_stop_times():
    trips = []
    stop_times = []
    stop_ids_out = [s[0] for s in STOPS]
    stop_ids_in = list(reversed(stop_ids_out))

    trip_n = 0
    for hour in range(6, 23):
        for minute in (0, 30):
            trip_n += 1
            tid = f"T_OUT_{trip_n}"
            trips.append(["R42A", "EVERYDAY", tid, "Central Station", "0"])
            for i, (stop, off) in enumerate(zip(stop_ids_out, OFFSETS_OUT)):
                total_min = hour * 60 + minute + off
                t = f"{total_min // 60:02d}:{total_min % 60:02d}:00"
                stop_times.append([tid, t, t, stop, i + 1])

            trip_n += 1
            tid = f"T_IN_{trip_n}"
            trips.append(["R42A", "EVERYDAY", tid, "Main St Bus Stop", "1"])
            for i, (stop, off) in enumerate(zip(stop_ids_in, OFFSETS_IN)):
                total_min = hour * 60 + minute + off
                t = f"{total_min // 60:02d}:{total_min % 60:02d}:00"
                stop_times.append([tid, t, t, stop, i + 1])

    return trips, stop_times


def main():
    agency = write_csv(
        [["sample", "Sample Transit Agency", "https://example.com", "Asia/Kolkata"]],
        ["agency_id", "agency_name", "agency_url", "agency_timezone"],
    )
    stops = write_csv(
        [[s[0], s[1], s[2], s[3]] for s in STOPS],
        ["stop_id", "stop_name", "stop_lat", "stop_lon"],
    )
    routes = write_csv(
        [["R42A", "sample", "42A", "Main St - Central Station", "3"]],
        ["route_id", "agency_id", "route_short_name", "route_long_name", "route_type"],
    )
    calendar = write_csv(
        [["EVERYDAY", 1, 1, 1, 1, 1, 1, 1, "20260101", "20261231"]],
        [
            "service_id", "monday", "tuesday", "wednesday", "thursday",
            "friday", "saturday", "sunday", "start_date", "end_date",
        ],
    )
    trips_rows, stop_times_rows = build_trips_and_stop_times()
    trips = write_csv(
        trips_rows, ["route_id", "service_id", "trip_id", "trip_headsign", "direction_id"]
    )
    stop_times = write_csv(
        stop_times_rows,
        ["trip_id", "arrival_time", "departure_time", "stop_id", "stop_sequence"],
    )

    out_path = OUT_DIR / "sample-gtfs.zip"
    with zipfile.ZipFile(out_path, "w", zipfile.ZIP_DEFLATED) as z:
        z.writestr("agency.txt", agency)
        z.writestr("stops.txt", stops)
        z.writestr("routes.txt", routes)
        z.writestr("calendar.txt", calendar)
        z.writestr("trips.txt", trips)
        z.writestr("stop_times.txt", stop_times)

    print(f"wrote {out_path} ({out_path.stat().st_size} bytes, {len(trips_rows)} trips)")


if __name__ == "__main__":
    main()
