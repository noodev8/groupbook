# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

> **Start here:** Check `docs/project-status.md` for current phase and progress.

---

## Project Overview

Group Book is a restaurant group booking coordination tool. It helps restaurants manage guest lists for group events (birthdays, work meals, celebrations) after the initial booking is accepted. Restaurants create events and share a link - guests can add themselves without accounts.

## Commands

### Server (groupbook-server)
```bash
cd groupbook-server
npm run dev          # Start server (runs on port 3016)
```

### Web (groupbook-web)
```bash
cd groupbook-web
npm run dev          # Start Next.js dev server (port 3000)
npm run build        # Production build
npm run lint         # ESLint check
```

## Architecture

### Monorepo Structure
- `groupbook-server/` - Express.js API server (Node.js)
- `groupbook-web/` - Next.js frontend (React, TypeScript, Tailwind)
- `docs/` - Project documentation and DB schema

### Database
PostgreSQL with three tables:
- `app_user` - Restaurant staff accounts (email, password_hash, restaurant_name)
- `event` - Group booking events (linked to app_user via app_user_id, has unique link_token for sharing)
- `guest` - Guests attending events (linked to event via event_id)

### API Conventions (CRITICAL)
See `docs/API-RULES.md` for full details. Key points:

**Backend:**
- Always return HTTP 200, even for errors
- Every response has a `return_code` field (`SUCCESS`, `MISSING_FIELDS`, `INVALID_*`, `NOT_FOUND`, `UNAUTHORIZED`, `FORBIDDEN`, `SERVER_ERROR`)
- Use `utils/apiLogger.js` with `logApiCall('endpoint_name')` at the start of each route
- Route files must have structured header comments documenting request/response format

**Frontend:**
- API client functions never throw on API errors - only on network failures
- Return structured `{ success: boolean, data?: T, error?: string }` objects
- Caller decides how to handle errors (toast, redirect, etc.)

### Server Structure
```
groupbook-server/
├── server.js              # Express app entry point
├── database.js            # PostgreSQL pool connection
├── config/config.js       # Centralized env config
├── middleware/auth.js     # JWT verifyToken middleware
├── routes/
│   ├── auth/              # login.js, register.js
│   ├── events/            # create.js, get.js, getPublic.js, list.js
│   └── guests/            # add.js, list.js
└── utils/
    ├── apiLogger.js       # API call logging
    └── transaction.js     # withTransaction wrapper
```

### Frontend Structure
```
groupbook-web/src/
├── app/                   # Next.js App Router pages
│   ├── (auth)/            # Login, register pages
│   ├── (dashboard)/       # Protected dashboard pages
│   ├── event/[link_token] # Public guest-facing event page
│   └── layout.tsx         # Root layout with AuthProvider
├── context/AuthContext.tsx # Auth state management
└── lib/api.ts             # API client functions
```

### Authentication
- JWT tokens stored in localStorage
- `verifyToken` middleware validates Bearer tokens
- JWT contains only user ID - fetch other data from database
- Config in `config/config.js` with values from `.env`

### Environment
Server requires `.env` with: `DATABASE_URL`, `JWT_SECRET`, `CLIENT_URL`, `PORT`
Web requires: `NEXT_PUBLIC_API_URL`

## Development Notes

- React Strict Mode is enabled (causes double API calls in dev only)
- No ORM - uses raw `pg` queries via `database.js`
- Use `withTransaction` wrapper from `utils/transaction.js` for atomic operations
