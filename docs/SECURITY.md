# Aqua Flow — Security Configuration

## Required Environment Variables

| Variable | Requirement |
|----------|-------------|
| `JWT_SECRET` | **Required.** Min 32 chars in production. Must not be `dev-secret`, `secret`, or `changeme`. App refuses to start if missing/insecure. |
| `MONGODB_URI` | **Required.** |
| `CORS_ORIGIN` | Set to production frontend URL. |

## Optional

| Variable | Default | Purpose |
|----------|---------|---------|
| `JWT_EXPIRES_IN` | `24h` | Token lifetime |
| `DEMO_MODE` | off in production | Backend demo features |
| `VITE_DEMO_MODE` | off | Show demo login hints in frontend |

## Backup Security

- JSON export **excludes** user password hashes
- Production: use `mongodump` for full backups
- After JSON restore: reset passwords manually

## Hardening Enabled

- Helmet security headers
- API rate limiting (300/min)
- Login rate limiting (20/15min)
- Driver session ownership on settlements/collections
- Mass-assignment protection on master data updates
