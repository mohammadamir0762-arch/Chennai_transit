# Small footprint on purpose: this sits on the same VM as the OTP JVM,
# which is by far the bigger memory consumer (see otp/Dockerfile).
FROM node:22-slim

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY src ./src

EXPOSE 4000

# No .env.local in production — compose passes OTP_BASE_URL, FRONTEND_ORIGIN,
# NOMINATIM_CONTACT, PORT directly as container env (see docker-compose.yml).
CMD ["node", "src/server.js"]
