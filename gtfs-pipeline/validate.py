#!/usr/bin/env python3
"""Validates a GTFS feed using MobilityData's GTFS validator before it's fed
into OTP. Requires the validator JAR (or Docker image) — see
https://github.com/MobilityData/gtfs-validator

Usage: python validate.py <path-to-gtfs.zip>
"""
import subprocess
import sys
from pathlib import Path

VALIDATOR_JAR = Path(__file__).parent / "gtfs-validator.jar"


def validate(gtfs_zip: str) -> None:
    if not VALIDATOR_JAR.exists():
        print(
            f"{VALIDATOR_JAR} not found. Download the validator JAR from "
            "https://github.com/MobilityData/gtfs-validator/releases"
        )
        sys.exit(1)

    subprocess.run(
        [
            "java", "-jar", str(VALIDATOR_JAR),
            "--input", gtfs_zip,
            "--output_base", str(Path(__file__).parent / "validation-report"),
        ],
        check=True,
    )


if __name__ == "__main__":
    if len(sys.argv) != 2:
        print(__doc__)
        sys.exit(1)
    validate(sys.argv[1])
