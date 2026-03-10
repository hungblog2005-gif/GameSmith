# Security Policy

## ⚠️ Production Deployment Warning

The default configuration in this repository is designed for **local development only**.  
Do **not** expose it to the internet without completing the hardening checklist below.

---

## Required Environment Variables Before Deploying

### Backend (`backend/.env`)

```env
# JWT — generate with: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
JWT_SECRET=<strong-random-secret>
JWT_EXPIRES_IN=15m

# MongoDB — use authentication in production
MONGODB_URI=mongodb://<user>:<password>@<host>:27017/gamesmith_db?authSource=admin

# Payment gateway secret — used to verify webhook signatures
PAYMENT_GATEWAY_SECRET=<secret-from-your-payment-provider>

# CORS — restrict to your actual domain
CORS_ORIGIN=https://yourdomain.com

NODE_ENV=production
```

### AI Service (`ai-service/.env`)

```env
QDRANT_HOST=<host>
QDRANT_PORT=6333
BACKEND_URL=https://yourdomain.com
```

---

## Hardening Checklist

### Authentication & Authorization
- [x] Set a strong, random `JWT_SECRET` (minimum 64 bytes) — see `.env.example`
- [x] Enable JWT refresh token rotation — `POST /users/refresh` rotates token, `POST /users/logout` revokes it
- [x] Add `@UseGuards(JwtAuthGuard)` + `@Roles('admin')` to all admin endpoints:
  - `POST /assets/admin/run-featured-score`
  - `GET /assets/admin/score-leaderboard`
- [x] Add `@UseGuards(JwtAuthGuard)` to:
  - `POST /assets` (create asset)
  - `POST /assets/upload-thumbnail`
  - `POST /assets/upload-preview-images`
- [x] Payment ownership check enforced in `GET /payments/user/:userId`

### Payment Security (Critical)
- [x] **Signature verification implemented** in `POST /payments/callback` — HMAC-SHA256 with `crypto.timingSafeEqual` to prevent timing oracle attacks. Set `PAYMENT_GATEWAY_SECRET` in your environment.

### Network & Infrastructure
- [x] Replace `origin: true` in CORS config — now reads `CORS_ORIGIN` env var (comma-separated), defaults to `localhost:5173/4173` in dev
- [x] MongoDB authentication via `MONGO_USERNAME`/`MONGO_PASSWORD` env vars
- [x] MongoDB port `27017` and Qdrant ports `6333/6334` are **not** exposed publicly in production — only via `docker-compose.override.yml` for local dev
- [ ] Use HTTPS (TLS termination via nginx/Caddy in front of services)
- [x] Store JWT in `httpOnly` cookies — refresh token now stored server-side (SHA-256 hash in DB), access token is short-lived (15m), never written to `localStorage`

### Docker Compose
✅ `docker-compose.yml` uses MongoDB credentials via env vars, internal bridge network, healthchecks on all services, non-root users in all containers, and only exposes port 80 publicly. Internal ports are exposed for **local dev only** via `docker-compose.override.yml`.

---

## Known Issues (Open for Contribution)

| Severity | Issue | Location | Status |
|----------|-------|----------|--------|
| 🟢 Critical | Payment callback signature verification (HMAC-SHA256) | `backend/src/modules/payments/payments.service.ts` | ✅ Fixed |
| 🟢 Critical | Asset creation & upload endpoints require JWT | `backend/src/modules/assets/assets.controller.ts` | ✅ Fixed |
| 🟢 Critical | Admin score endpoints require JWT + admin role | `backend/src/modules/assets/assets.controller.ts` | ✅ Fixed |
| 🟢 Critical | Payment ownership check enforced | `backend/src/modules/payments/payments.controller.ts` | ✅ Fixed |

Contributions fixing these issues are welcome. Please open a pull request against `main`.

---

## Reporting a Vulnerability

If you discover a security vulnerability, please **do not** open a public issue.  
Instead, contact the maintainer directly via GitHub private message or email listed on the profile.

We will acknowledge the report within 48 hours and aim to release a fix within 7 days for critical issues.
