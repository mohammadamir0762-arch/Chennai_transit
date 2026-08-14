#!/usr/bin/env python3
"""Downloads the launch city's GTFS feed into ./data/ for OTP graph builds.

Usage: python fetch-feed.py <feed-url> [output-name]

Once a launch city is chosen, replace FEED_URL below (or pass it as an
argument) with the official feed URL from the transit authority, or a feed
discovered via transitland.org / mobilitydatabase.org.
"""
import sys
import urllib.request
from pathlib import Path

DATA_DIR = Path(__file__).parent / "data"


def fetch(feed_url: str, output_name: str = "gtfs.zip") -> Path:
    DATA_DIR.mkdir(exist_ok=True)
    dest = DATA_DIR / output_name
    print(f"Downloading {feed_url} -> {dest}")
    urllib.request.urlretrieve(feed_url, dest)
    print(f"Saved {dest.stat().st_size:,} bytes")
    return dest


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)
    feed_url = sys.argv[1]
    output_name = sys.argv[2] if len(sys.argv) > 2 else "gtfs.zip"
    fetch(feed_url, output_name)
