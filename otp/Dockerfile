# Builds the Chennai OTP graph and serves it. Build context is this
# directory (otp/), so it can see chennai/*.zip and chennai/*.pbf without
# needing them copied anywhere first — they're already committed to the repo.
#
# otp.jar (~175MB) is NOT committed (see README.md) — this Dockerfile
# downloads it at build time from the official OTP 2.9.0 release.
FROM eclipse-temurin:25-jdk-jammy

WORKDIR /app

# The base image doesn't guarantee curl; install it rather than assume.
RUN apt-get update && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/*

# Pin the exact release used and verified locally (CLAUDE.md: OTP 2.9
# requires Java 25, which the base image above provides).
RUN curl -fL -o otp.jar \
    https://github.com/opentripplanner/OpenTripPlanner/releases/download/v2.9.0/otp-shaded-2.9.0.jar

COPY router-config.json graph-dir/router-config.json
COPY chennai/chennai-gtfs.zip graph-dir/chennai-gtfs.zip
COPY chennai/mtc-bus-gtfs.zip graph-dir/mtc-bus-gtfs.zip
COPY chennai/chennai-streets.osm.pbf graph-dir/chennai-streets.osm.pbf

# Baking the build into the image means a container restart just *loads*
# graph.obj (~8s), instead of rebuilding from GTFS+OSM every time (minutes).
# Needs real memory to build (not just to run) — see docs/deploy.md for the
# VM shape this assumes. -Xmx3G matches otp/README.md's local build command.
RUN java -Xmx3G -jar otp.jar --build --save graph-dir

EXPOSE 8080

HEALTHCHECK --interval=10s --timeout=5s --start-period=30s --retries=6 \
  CMD curl -f http://localhost:8080/otp/routers/default/index/graphql -X POST \
    -H "Content-Type: application/json" -d '{"query":"{ stops { gtfsId } }"}' \
    || exit 1

# -Xmx2G, not -Xmx3G: measured live heap after a full GC is ~953MB
# (see chennai-transit-deploy-constraints memory note); running needs far
# less headroom than building does.
CMD ["java", "-Xmx2G", "-jar", "otp.jar", "--load", "graph-dir"]
