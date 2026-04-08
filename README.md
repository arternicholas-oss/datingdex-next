# DatingDex Next

Next.js 14 App Router rebuild of datingdex.com — proper multi-page site with per-venue, per-neighborhood, and per-vibe routes, JSON-LD structured data, dynamic sitemap, and SSG.

## Routes

- `/` — home, FAQPage JSON-LD, top vibes / neighborhoods / featured
- `/discovery` — all 309 venues, ranked
- `/venue/[slug]` — per-venue page with `Restaurant` + `AggregateRating` + `BreadcrumbList` JSON-LD (309 static pages)
- `/dc/[neighborhood]` — per-neighborhood collection (49 pages)
- `/vibe/[vibe]` — per-vibe collection (7 pages)
- `/sitemap.xml` — dynamic, includes all ~367 routes
- `/robots.txt` — dynamic

Total static pages after `next build`: ~367.

## Dev

```bash
npm install
npm run dev
```

## Deploy

Push to GitHub, connect the repo to Vercel as a new project `datingdex-next`. Once validated side-by-side with the monolith, cut `www.datingdex.com` DNS over.

## Data

`data/venues.json` — 309 venues extracted from the legacy monolith. Regenerate by re-running the extraction script against the old `index.html`.

## Env

Copy `.env.example` to `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```
