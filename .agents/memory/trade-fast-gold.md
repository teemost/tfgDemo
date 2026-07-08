---
name: Trade Fast Gold
description: Key decisions, fixes, and setup facts for the TRADE FAST GOLD fintech investment platform
---

# Trade Fast Gold — Project Notes

## Architecture
- **Frontend**: React 19 + Vite 7 + Tailwind 4 + shadcn/ui + Framer Motion + Wouter + TanStack Query — at `artifacts/trade-fast-gold/`, port 22003
- **Backend**: Express 5 + Drizzle ORM + Zod — at `artifacts/api-server/`, port 8080
- **Auth**: Clerk (Replit-managed, provisioned)
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

## Clerk Setup
Provisioned via `setupClerkWhitelabelAuth()`. Keys auto-set: `CLERK_SECRET_KEY`, `CLERK_PUBLISHABLE_KEY`, `VITE_CLERK_PUBLISHABLE_KEY`. App.tsx and app.ts were already correctly wired for Clerk proxy pattern.

## Artifact Registration
The `artifacts/trade-fast-gold/` directory exists with full code but has no `artifact.toml` — was not registered via `createArtifact`. The "Start application" workflow has `outputType = "webview"` in `.replit` so preview works without artifact registration.

## pg Seeding Path
When running Node scripts to seed DB, must use full pnpm path: `/home/runner/workspace/node_modules/.pnpm/pg@8.22.0/node_modules/pg`
