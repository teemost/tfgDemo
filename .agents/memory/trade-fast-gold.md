---
name: Trade Fast Gold
description: Key decisions, fixes, and setup facts for the TRADE FAST GOLD fintech investment platform
---

# Trade Fast Gold — Project Notes

## Architecture
- **Frontend**: React 19 + Vite 7 + Tailwind 4 + shadcn/ui + Framer Motion + Wouter + TanStack Query — at `artifacts/trade-fast-gold/`, port 22003
- **Backend**: Express 5 + Drizzle ORM + Zod — at `artifacts/api-server/`, port 8080
- **Auth**: Replit Auth (OIDC via `openid-client`/`passport`), migrated off Clerk on 2026-07-08. `usersTable.clerkId` renamed to `authId`; session store table `sessionsTable` added.
- **DB**: PostgreSQL via Drizzle ORM

## Critical Fix: api-client-react Sub-path Exports
Pages import deeply from `@workspace/api-client-react/src/generated/api` and `@workspace/api-client-react/src/generated/api.schemas`. Added explicit exports to `lib/api-client-react/package.json`:
```json
"exports": {
  ".": "./src/index.ts",
  "./src/generated/api": "./src/generated/api.ts",
  "./src/generated/api.schemas": "./src/generated/api.schemas.ts"
}
```
**Why:** Vite's dep scanner (esbuild) enforces package exports — deep path imports without exports entries cause build failure.

## Database Seeding
Investment plans seeded manually via pg client (no seed script exists). 4 plans:
- Starter: 5% ROI / 30d / $100–$4,999
- Silver: 8% ROI / 30d / $5,000–$24,999
- Gold: 12% ROI / 30d / $25,000–$99,999
- Platinum: 18% ROI / 30d / $100,000–$999,999

## Auth: Clerk → Replit Auth Migration
Replaced Clerk entirely with the `javascript_log_in_with_replit` blueprint pattern (manual OIDC via `openid-client`+`passport`, not the raw scaffold files). Frontend never talks to the IdP directly — it only calls `POST /api/users/me/ensure` (a `useSession` hook) to check/create the session, and redirects to `/api/login` / `/api/logout` for the actual auth flow.
**Why:** user explicitly wanted zero third-party auth SDKs; Clerk's proxy middleware pattern doesn't map onto Replit Auth's server-side session/passport model, so it needed a full rewrite of the auth layer, not just a key swap.
**Gotcha:** the OIDC `callbackURL`/`redirect_uri` is built from `req.hostname`, so testing `/api/login` via direct `curl localhost:PORT` produces a bogus `https://localhost/api/callback` redirect — this is expected (curl bypasses Replit's proxy) and not a bug. Verify with `curl -H "Host: $REPLIT_DEV_DOMAIN"` instead.

## Artifact Registration
The `artifacts/trade-fast-gold/` directory exists with full code but has no `artifact.toml` — was not registered via `createArtifact`. The "Start application" workflow has `outputType = "webview"` in `.replit` so preview works without artifact registration.

## pg Seeding Path
When running Node scripts to seed DB, must use full pnpm path: `/home/runner/workspace/node_modules/.pnpm/pg@8.22.0/node_modules/pg`

## Auth Migration Leftovers
The Clerk→Replit Auth migration left `admin/login.tsx` and `admin/register.tsx` importing a nonexistent OIDC-style `login` redirect helper from `use-session.ts`, even though the rest of the app had already switched to email/password auth (`useLogin`/`useRegister` hooks, real forms at `/login` and `/register`). Fixed by pointing the admin CTA buttons to the real `/login` and `/register` pages instead.
**Why:** partial migrations across a multi-page app can leave stale symbol references that only surface as a Vite/esbuild dep-scan failure at dev-server start, not a type error caught earlier.
**How to apply:** after any auth-pattern migration, grep the whole app for the old helper names (not just the primary flow pages) before considering it done.
