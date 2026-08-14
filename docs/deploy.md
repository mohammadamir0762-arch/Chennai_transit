# Deploying (free tier)

Two independent pieces. Do them in this order.

## 1. Frontend → Vercel (free, no card, ~2 minutes)

1. [vercel.com](https://vercel.com) → sign in with GitHub.
2. **Add New → Project** → select `Chennai_transit`.
3. **Root Directory**: `frontend`.
4. **Environment Variables** → add `NEXT_PUBLIC_API_BASE_URL` — leave it
   pointing at nothing real yet; you'll fill in the real value after step 2
   below, once the backend has a domain.
5. Deploy. You get a `*.vercel.app` URL — that's your live frontend, and
   it's real from this point on.

Route search will show "Could not reach the API" until the backend exists.
That's expected — the site itself is genuinely live already.

## 2. Backend → Oracle Cloud Always Free VM

This is the part that needs a real server, because OTP holds a ~1GB routing
graph in memory and answers live queries — that can't be a static file.

### 2a. Create the Oracle account

[oracle.com/cloud/free](https://www.oracle.com/cloud/free/) → sign up. You'll
enter a card for identity verification — a refundable hold, not a charge; the
free tier does not auto-upgrade to paid. Indian signups sometimes get flagged
for manual review; if so, it can take a day or two, out of anyone's control.

### 2b. Create the VM

**This step trips people up — the free tier has two shapes, and only one is
usable here:**

- **VM.Standard.A1.Flex (Ampere ARM)** — up to 24GB RAM, 4 cores, free
  forever. **Pick this one.**
- VM.Standard.E2.1.Micro (AMD) — only 1GB RAM. Too small for OTP; skip it.

Console → **Compute → Instances → Create Instance**:
- Shape: **VM.Standard.A1.Flex**, 4 OCPUs, 24GB memory (all within the free
  allowance)
- Image: **Ubuntu 24.04** (arm64 — matches the Ampere shape)
- Add your SSH key (or let Oracle generate one and download it)
- Create

Note the **public IP address** once it's running.

### 2c. Open ports 80 and 443

Oracle blocks inbound traffic by default. Instance page → **Subnet** →
**Security Lists** → default list → **Add Ingress Rules**, twice:

| Source CIDR | Protocol | Port |
|---|---|---|
| 0.0.0.0/0 | TCP | 80 |
| 0.0.0.0/0 | TCP | 443 |

Without this, Caddy can't get a certificate and nothing is reachable no
matter how correctly everything else is configured.

### 2d. Free subdomain (needed for real HTTPS)

Caddy needs a real hostname to get a Let's Encrypt certificate — an IP
address alone can't have one issued for it.

1. [duckdns.org](https://www.duckdns.org) → sign in (GitHub/Google, no card).
2. Create a subdomain, e.g. `chennai-transit` → `chennai-transit.duckdns.org`.
3. Point it at your VM's public IP from step 2b.

### 2e. SSH in and install Docker

```bash
ssh ubuntu@<your-vm-public-ip>

curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER
newgrp docker
```

### 2f. Get the code and configure it

```bash
git clone https://github.com/mohammadamir0762-arch/Chennai_transit.git
cd Chennai_transit

cp .env.example .env
nano .env   # fill in DUCKDNS_DOMAIN, NOMINATIM_CONTACT, FRONTEND_ORIGIN
```

`FRONTEND_ORIGIN` is the exact `*.vercel.app` URL from step 1 — this is what
CORS locks the API to, so it has to match precisely (no trailing slash).

### 2g. Build and run

```bash
docker compose up -d --build
```

The `otp` service builds the routing graph during this step — a few minutes
the first time (it's baked into the image, so restarts afterward are fast).
Watch it with:

```bash
docker compose logs -f otp
```

It's ready when `otp` reports healthy:

```bash
docker compose ps
```

### 2h. Verify

```bash
curl https://chennai-transit.duckdns.org/api/health
```

Should return `{"status":"ok",...}`. If it times out: re-check the security
list rules (2c) first — that's the most common cause.

## 3. Connect frontend to backend

Back in Vercel: **Settings → Environment Variables** → set
`NEXT_PUBLIC_API_BASE_URL` to `https://chennai-transit.duckdns.org` (your
real DuckDNS domain, no trailing slash) → **Redeploy**.

Test the whole path in a browser at your `*.vercel.app` URL: search a route,
confirm results come back.

## Keeping it running

- `docker compose ps` — check status
- `docker compose logs -f backend` — tail backend logs
- `docker compose restart` — restart everything
- To pick up new commits: `git pull && docker compose up -d --build`

## What updates the DuckDNS IP if the VM's address changes

Oracle Always Free VMs keep the same public IP unless you explicitly
terminate the instance, so this is a one-time setup, not an ongoing chore.
