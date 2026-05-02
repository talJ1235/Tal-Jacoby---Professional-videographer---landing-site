# טל יעקבי — פורטפוליו צילום ווידאו

אתר פורטפוליו מקצועי לצלם ווידאוגרף פרילנסר, כולל ניהול לידים.

---

## Local Development

### Prerequisites
- Node.js 18+
- npm 9+

### Setup

```bash
# Install all dependencies (root + client + server)
npm run install:all

# Copy env files and edit values
cp server/.env.example server/.env
cp client/.env.example client/.env
```

### Run

```bash
npm run dev
# Client: http://localhost:5173
# Server: http://localhost:3001
# Admin CRM: http://localhost:5173/admin  (password: TAL2025)
```

### Database

```bash
cd server

# Apply migrations
npx prisma migrate dev

# Seed sample data (3 leads)
node prisma/seed.js

# Open DB GUI
npx prisma studio
```

---

## Project Structure

```
/
├── client/               React 18 + Vite frontend
│   └── src/
│       ├── components/   UI + layout components
│       ├── sections/     Hero, About, Portfolio, Contact
│       ├── pages/        Home, Admin
│       ├── hooks/        useLeads, useScrollLock, useIntersectionObserver
│       ├── services/     api.js (Axios)
│       ├── styles/       tokens.css, global.css, animations.css
│       └── utils/        formatDate, formatPhone, cn
│
└── server/               Node.js + Express backend
    ├── prisma/           Schema + migrations + seed
    └── src/
        ├── routes/       leads.js
        ├── middleware/   auth.js, validate.js, errorHandler.js
        └── services/     emailService.js (Resend)
```

---

## API Reference

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| `POST` | `/api/leads` | Public | Submit contact form |
| `GET` | `/api/leads` | Admin | List leads (paginated, filterable) |
| `GET` | `/api/leads/:id` | Admin | Single lead |
| `PATCH` | `/api/leads/:id` | Admin | Update status / notes |
| `DELETE` | `/api/leads/:id` | Admin | Soft delete |
| `GET` | `/api/leads/export/csv` | Admin | Download CSV |
| `GET` | `/api/health` | Public | Health check |

**Admin auth:** `x-admin-key: <ADMIN_SECRET>` header.

---

## Environment Variables

### Server (`server/.env`)

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment | `development` |
| `PORT` | Server port | `3001` |
| `ADMIN_SECRET` | Admin API key | `TAL2025` |
| `DATABASE_URL` | DB connection | `file:./dev.db` |
| `RESEND_API_KEY` | Email API key | _(empty = skip)_ |
| `RESEND_FROM` | Sender address | `noreply@talyakobi.com` |
| `NOTIFICATION_EMAIL` | Lead alert recipient | `tal@talyakobi.com` |

### Client (`client/.env`)

| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | Backend URL |
| `VITE_WHATSAPP_NUMBER` | WhatsApp number (972...) |
| `VITE_ADMIN_PASSWORD` | Admin UI password |

---

## Production Deployment

| Service | Purpose | Cost |
|---------|---------|------|
| **Vercel** | Frontend hosting | Free |
| **Railway** | Backend + PostgreSQL | Free tier |
| **Cloudflare** | Domain DNS + CDN | Free |
| **Resend** | Transactional email | Free (3k/month) |
| **GitHub** | Source control | Free |

### Steps

#### 1. Switch to PostgreSQL

In `server/prisma/schema.prisma` change:
```prisma
datasource db {
  provider = "postgresql"   # was: sqlite
  url      = env("DATABASE_URL")
}
```

Run migrations:
```bash
DATABASE_URL="postgresql://..." npx prisma migrate deploy
```

#### 2. Deploy Backend → Railway

1. Push repo to GitHub
2. Create new Railway project → "Deploy from GitHub repo"
3. Select the `/server` root
4. Add PostgreSQL plugin → copy `DATABASE_URL` to env vars
5. Set all env vars from `server/.env.example`
6. Railway auto-detects `npm start`

#### 3. Deploy Frontend → Vercel

1. Import repo on vercel.com
2. Set **Root Directory** → `client`
3. Set env vars:
   - `VITE_API_URL` = Railway backend URL
   - `VITE_WHATSAPP_NUMBER` = your number
   - `VITE_ADMIN_PASSWORD` = strong password
4. Deploy — Vercel auto-runs `npm run build`

#### 4. Connect Domain → Cloudflare

1. Add domain to Cloudflare
2. Point `talyakobi.com` → Vercel CNAME
3. Point `api.talyakobi.com` → Railway URL (optional)

#### 5. Activate Email (Resend)

1. Create account at resend.com
2. Verify domain
3. Copy API key → set `RESEND_API_KEY` in Railway env vars
4. Done — emails send automatically on new lead submissions

---

## Features

- **RTL Hebrew** throughout
- **Custom gold cursor** (desktop only)
- **Framer Motion** — page transitions + scroll-triggered animations
- **Hero** — staggered text, floating badges, photo ring animation
- **About** — animated stat counters (count up on scroll)
- **Portfolio** — category filter, masonry grid, YouTube lightbox
- **Contact** — floating labels, client + server validation, success animation
- **WhatsApp CTA** — fixed button + inline CTA
- **Admin CRM** — password gate, leads table, inline status/notes editing, CSV export
- **Email notifications** — Resend (stubbed, activate with API key)
- **Security** — helmet, rate limiting, CORS, input validation, soft deletes
