# STAXX.GG — Deployment Guide

## Architecture Overview

| Component | Service | Domain |
|-----------|---------|--------|
| Frontend | Vercel | staxx.gg |
| Backend | Render | api.staxx.gg |
| Database | MongoDB Atlas | (internal) |
| Cache | Upstash Redis | (internal) |

## Prerequisites

- GitHub repository
- Vercel account
- Render account
- MongoDB Atlas account
- Upstash account
- Domain: staxx.gg
- Google Cloud project with OAuth credentials

---

## 1. MongoDB Atlas Setup

1. Create a free M0 cluster (or M10+ for production)
2. Create database user with readWrite role on `staxx` database
3. Whitelist Render's IP addresses (or use 0.0.0.0/0 with strong credentials)
4. Get connection string: `mongodb+srv://user:pass@cluster.mongodb.net/staxx`
5. Create indexes by running: `python scripts/import_pokemon.py --mode full`

### Operational Notes
- M0 (free) limits: 512MB storage, 500 connections, no backups
- M10+ recommended for production: automated backups, monitoring
- Enable MongoDB Atlas alerts for disk usage and connection count

---

## 2. Upstash Redis Setup

1. Create a new Redis database
2. Select a region close to your Render deployment
3. Get the REST URL and token
4. Connection string format: `rediss://default:TOKEN@HOST:PORT`

### Operational Notes
- Free tier: 10,000 commands/day, 256MB
- Pay-as-you-go recommended for production
- Set maxmemory-policy to allkeys-lru

---

## 3. Google OAuth Production Setup

1. Go to Google Cloud Console → APIs & Services → Credentials
2. Edit your OAuth 2.0 Client ID
3. Add authorized JavaScript origins:
   - `https://staxx.gg`
   - `https://www.staxx.gg`
4. Add authorized redirect URIs:
   - `https://staxx.gg`
5. Update the OAuth consent screen for production
6. Submit for verification if needed (for >100 users)

---

## 4. Render Backend Deployment

1. Connect your GitHub repository
2. Create a new Web Service:
   - **Root Directory:** `apps/api`
   - **Runtime:** Python 3
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
3. Add environment variables:
   ```
   ENVIRONMENT=production
   FRONTEND_URL=https://staxx.gg
   MONGODB_URI=mongodb+srv://...
   MONGODB_DATABASE=staxx
   REDIS_URL=rediss://...
   GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
   SESSION_SECRET=<generate-64-char-random-string>
   COOKIE_DOMAIN=.staxx.gg
   ```
4. Add custom domain: `api.staxx.gg`
5. Enable auto-deploy on push to main
6. Add health check path: `/api/v1/health`

### Operational Notes
- Free tier: spins down after 15min inactivity, 750h/month
- Starter ($7/mo): always on, better for production
- Set up Render health checks to `/api/v1/ready`

---

## 5. Vercel Frontend Deployment

1. Import your GitHub repository
2. Configure:
   - **Framework Preset:** Next.js
   - **Root Directory:** `apps/web`
   - **Build Command:** `npm run build`
   - **Output Directory:** `.next`
3. Add environment variables:
   ```
   NEXT_PUBLIC_API_URL=https://api.staxx.gg/api/v1
   NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
   ```
4. Add custom domain: `staxx.gg`
5. Enable auto-deploy on push to main

### Operational Notes
- Hobby (free): 100GB bandwidth/month, 6000 build minutes
- Pro ($20/mo): more bandwidth, team features

---

## 6. DNS Configuration

Add these DNS records for `staxx.gg`:

| Type | Name | Value |
|------|------|-------|
| A | @ | Vercel IP (from dashboard) |
| CNAME | www | cname.vercel-dns.com |
| CNAME | api | your-app.onrender.com |

---

## 7. CORS Configuration

The backend must allow:
```python
origins = [
    "https://staxx.gg",
    "https://www.staxx.gg",
]
```

In development:
```python
origins = [
    "http://localhost:3000",
]
```

---

## 8. Initial Data Setup

After deployment, run the Pokémon importer against production:

```bash
# Set production env vars
export MONGODB_URI="mongodb+srv://..."
export MONGODB_DATABASE="staxx"

cd scripts
python import_pokemon.py --mode full --concurrency 5
python validate_pokemon.py
```

---

## 9. GitHub Actions CI/CD

The `.github/workflows/ci.yml` runs on every push:
- Backend: lint, type check, unit tests
- Frontend: lint, type check, build
- Both deploy automatically via Vercel/Render GitHub integrations

---

## 10. Monitoring Checklist

- [ ] Render health checks active
- [ ] MongoDB Atlas alerts configured
- [ ] Upstash usage monitoring
- [ ] Error tracking (consider Sentry)
- [ ] Vercel analytics enabled
- [ ] Google OAuth consent screen verified
- [ ] SSL certificates active on all domains
- [ ] Rate limiting tested
- [ ] Leaderboard reconciliation scheduled

---

## Backup Strategy

- MongoDB Atlas: Enable automated backups (M10+ plans)
- Redis: Non-critical, reconstructable from MongoDB
- Code: GitHub repository
- Environment variables: Securely stored in password manager

---

## Cost Estimates

### Free Tier Setup
| Service | Plan | Monthly Cost |
|---------|------|-------------|
| Vercel | Hobby | $0 |
| Render | Free | $0 |
| MongoDB Atlas | M0 | $0 |
| Upstash Redis | Free | $0 |
| Domain | .gg | ~$10/year |
| **Total** | | **~$1/month** |

### Production Setup
| Service | Plan | Monthly Cost |
|---------|------|-------------|
| Vercel | Pro | $20 |
| Render | Starter | $7 |
| MongoDB Atlas | M10 | $57 |
| Upstash Redis | Pay-as-you-go | ~$5 |
| Domain | .gg | ~$10/year |
| **Total** | | **~$90/month** |

### Limitations on Free Tiers
- Render free tier: Cold starts after 15min idle (500ms-2s delay)
- MongoDB M0: No backups, 500 connection limit
- Upstash free: 10K commands/day may not suffice for active users
- Vercel hobby: No team features, 100GB bandwidth
