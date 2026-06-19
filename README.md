# VANTERENPRESS

Production-oriented global newsroom platform built with Next.js 15, TypeScript, Tailwind CSS, Prisma, PostgreSQL, Redis, REST, GraphQL, and NextAuth.

## Runtime support

- Recommended Node version: `20.x`
- The platform is kept stable on Node 20 for now.
- Some third-party packages may emit future-support warnings under Node 20 during build. Treat those as dependency-maintenance items, not fatal launch blockers.

## What is implemented

- Live Prisma-backed article CRUD, autosave, workflow transitions, version restore, comments, assignments, and live updates
- Advanced newsroom editor with preview modes, taxonomy controls, SEO fields, editorial notes, and autosave indicator
- Public article experience with author cards, related stories, comments, bookmarks, sharing, newsletter CTA, and premium lock UI
- Premium homepage with breaking ticker, most-read, premium blocks, opinion/editorial, multimedia, regional sections, personalized reader blocks, and desk sections
- Public search, topic/category/tag/region landing pages, author archives, live coverage pages, pricing page, RSS directory, and subscriber account page
- Protected executive, editor, journalist, media-library, and newsletter dashboards
- Super admin dashboard for user, moderation, audit, and system operations views
- Real newsroom navigation with edition selector, breaking news bar, notification dropdown, and mobile drawer
- Public credibility layers with fact-check labels, source transparency boxes, review status, and correction history
- S3-compatible media storage architecture with presigned upload support and tracked media metadata
- Search adapter architecture with PostgreSQL fallback and filters for category, author, edition, type, and dates
- Subscription plans, payment-provider abstraction, premium article metering, and article locking
- Newsletter segmentation, campaign scheduling, article-linked campaigns, and signup flow
- Breaking news banner management and live blog updates
- Redis-backed job dispatch plus a separate worker process for publishing, newsletters, search indexing, and media processing
- Audit logging hooks, per-route RBAC, loading/error states, RSS feed, sitemap, structured metadata, PWA metadata, Docker, CI, and tests
- AI newsroom layer for research assistance, writing support, content intelligence, and translation workflows
- Global distribution layer for editions, syndication partners, syndication feeds, and licensing
- Video and podcast publishing surfaces for Global Press TV and the podcast network
- Revenue and marketplace primitives for advertisers, campaigns, placements, and premium listings
- Data journalism and global operations models for dashboards, bureaus, crisis coverage, and health monitoring

## Final launch polish

- CNN/BBC/Reuters-style newsroom navigation with mega menu grouping, sticky breaking bar, edition selector, notification dropdown, and mobile drawer
- Discovery hubs for latest, most read, categories, regions, topics, tags, RSS, and search-backed editorial exploration
- Logged-in reader personalization blocks for continue-reading, recommendations, newsletter preferences, and breaking-alert summaries
- Article trust layers for fact-check labels, review status, source transparency, corrections, why-this-matters framing, and social share cards
- Commercial reader-growth surfaces including a richer media kit, press release intake pricing, referral placeholder, newsletter growth CTAs, and social follow modules
- Demo-safe fallbacks on key public routes so homepage, search, pricing, article, discovery, and media-kit pages still render when `DATABASE_URL` is not configured
- Seed/live newsroom homepage modes with a real editorial front page, strong imagery, populated desk sections, and free-provider ingestion fallbacks

## Stack

- Frontend: Next.js 15, TypeScript, Tailwind CSS v4, Framer Motion, shadcn-style UI primitives
- Backend: Node.js, PostgreSQL, Prisma ORM, Redis, REST API, GraphQL Yoga
- Auth: NextAuth, credentials login, Google login, TOTP-ready 2FA flow
- Infra: S3-compatible object storage, Redis queues, Docker Compose, GitHub Actions

## Quick start

```bash
cp .env.example .env
docker compose up -d postgres redis minio
npm ci
npm run prisma:generate
npm run db:push
npm run prisma:seed
npm run dev
```

Optional worker process:

```bash
npm run worker
```

MinIO console: `http://localhost:9001`

## Cloudflare R2 media uploads

The article image upload flow already uses S3-compatible presigned uploads. Cloudflare R2 works with the existing implementation by pointing the storage env vars at your R2 bucket.

Use this configuration:

```env
S3_ENDPOINT="https://ACCOUNT_ID.r2.cloudflarestorage.com"
S3_REGION="auto"
S3_BUCKET="vanterenpress-media"
S3_ACCESS_KEY_ID="R2_ACCESS_KEY_ID"
S3_SECRET_ACCESS_KEY="R2_SECRET_ACCESS_KEY"
S3_PUBLIC_BASE_URL="https://PUBLIC_R2_URL_OR_CUSTOM_DOMAIN"
S3_FORCE_PATH_STYLE="false"
```

Important details:

- `S3_ENDPOINT` must be the R2 S3 API endpoint. Presigned uploads are generated against this endpoint.
- `S3_PUBLIC_BASE_URL` must be the public R2 asset URL or your custom domain. Rendered article images use this value instead of the S3 API endpoint.
- `/api/rest/health` now reports storage configuration and bucket reachability so you can verify the R2 connection after deployment.
- If any required storage env var is missing, the upload API returns a clear storage configuration error instead of a generic upload failure.

## Free news setup

The homepage ingestion layer supports two modes:

- `NEWS_MODE=seed`: use the built-in editorial package and seeded article inventory
- `NEWS_MODE=live`: refresh live homepage news from GNews and NewsAPI on a background cadence, persist the last successful homepage payload, and fall back safely when providers fail or keys are missing

Supported free providers today:

- News: RSS feeds, Guardian Open Platform, GNews, NewsAPI, Currents, TheNewsAPI
- Finance: Alpha Vantage, Finnhub, CoinGecko
- Technology: RSS feeds and public technology/news feeds through the same provider layer

Key environment variables:

- `NEWS_MODE`
- `NEWS_REFRESH_INTERVAL_MINUTES`
- `NEWS_CACHE_TTL_SECONDS`
- `ENABLE_RSS_NEWS`
- `RSS_WORLD_FEED_URL`, `RSS_BUSINESS_FEED_URL`, `RSS_TECH_FEED_URL`
- `GUARDIAN_OPEN_PLATFORM_KEY`
- `GNEWS_API_KEY`
- `NEWS_API_KEY`
- `CURRENTS_API_KEY`
- `THENEWSAPI_API_TOKEN`
- `ALPHA_VANTAGE_API_KEY`
- `FINNHUB_API_KEY`
- `COINGECKO_API_KEY`

If none of the live providers are configured, the homepage and public discovery routes automatically fall back to seeded editorial stories instead of rendering empty sections.

## News ingestion architecture

Provider abstraction lives in `src/lib/news-providers/`:

- `rss-provider.ts`
- `guardian-provider.ts`
- `gnews-provider.ts`
- `newsapi-provider.ts`
- `currents-provider.ts`
- `the-news-provider.ts`
- `finance-provider.ts`
- `index.ts`
- `cache.ts`
- `seed-content.ts`

How it works:

- Each provider implements the shared `NewsProvider` interface from `src/lib/news-providers/types.ts`
- `getHomepageNewsResponse()` composes provider output into homepage sections and returns the latest homepage payload plus refresh metadata
- Live provider output is normalized into the same `EditorialStory` model used by seed content
- Section population always uses seeded stories as fallback, so `Latest News`, `World`, `Business`, `Technology`, `Sports`, `Live Coverage`, `Opinion`, and `Most Read` never come back empty
- A background refresh job runs every `NEWS_REFRESH_INTERVAL_MINUTES`, stores the last successful homepage payload in the `SiteSetting` table, and preserves the previous successful payload if GNews or NewsAPI fail
- The homepage browser client polls `/api/rest/news/homepage` on the same cadence and shows a `New stories available` refresh notice when a newer payload is available
- Provider status, last successful refresh, next scheduled refresh, active `NEWS_MODE`, and provider errors are returned by the homepage API for debugging

Adding a new provider:

1. Create a new file under `src/lib/news-providers/`
2. Implement `name`, `isConfigured()`, and `fetchLatest()`
3. Return normalized `EditorialStory[]`
4. Register the provider in `src/lib/news-providers/index.ts`
5. Add any new environment variables to `.env.example` and this README

Fallback behavior:

- Missing API keys: provider is skipped
- Provider fetch failure: the previous successful persisted homepage payload is kept
- No live provider data at all: the full seed homepage bundle is returned
- Public discovery and article/live routes also use seeded editorial fallbacks when database content is unavailable

## Live news setup

To use live news:

1. Open `.env.local`
2. Add:

```env
NEWS_MODE=live
GNEWS_API_KEY=your_gnews_key_here
NEWS_API_KEY=your_newsapi_key_here
NEWS_REFRESH_INTERVAL_MINUTES=15
```

3. Restart the dev server:

```bash
npm run dev
```

`NEWS_MODE=seed` keeps the homepage on seeded editorial content only. `NEWS_MODE=live` tries GNews and NewsAPI first, caches the result, and falls back to seed content if keys are missing or provider requests fail.

`NEWS_REFRESH_INTERVAL_MINUTES` now controls both:

- The background live-news refresh cadence on the server
- The lightweight homepage polling interval in the browser

Open homepage tabs do not need a full reload. They check `/api/rest/news/homepage` on the configured interval and can apply new stories in place when a newer payload exists.

Homepage API:

- `GET /api/rest/news/homepage`
- Returns:
  - `bundle`
  - `lastUpdated`
  - `source: seed | live | cached`
  - `providerStatus` for GNews and NewsAPI
  - refresh/debug status including `lastSuccessfulLiveRefresh`, `nextScheduledRefresh`, `providerErrors`, active `NEWS_MODE`, and cache TTL

## Database setup

Add this to `.env.local`:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public"
```

For a local Docker/Postgres setup, a typical value looks like:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/vanterenpress?schema=public"
```

Then run:

```bash
npm run prisma:generate
npm run prisma:migrate
npm run db:seed
npm run dev
```

## Demo credentials

- `admin@globalpress.network` / `Password123!`
- `eic@globalpress.network` / `Password123!`
- `journalist@globalpress.network` / `Password123!`
- `subscriber@globalpress.network` / `Password123!`

## Local admin seed

The credentials provider signs in with `email` plus `password`. `username` is not a login field in the current Prisma schema.

Seed the database:

```bash
npm run db:seed
```

Local VANTERENPRESS admin:

- Email: `admin@vanterenpress.com`
- Display name: `admin`
- Password: `Chukwuemeka2019$`
- Role: `SUPER_ADMIN`

Notes:

- The seed is idempotent and updates the local admin if it already exists.
- The default VANTERENPRESS admin is only seeded outside production by default. To allow it in production intentionally, set `ALLOW_DEFAULT_ADMIN_SEED=true` before seeding.
- Change this password before any production deployment by updating the user record after seeding or by disabling the default admin seed and creating a production-only admin account with your own secret.

## Core routes

- `/` live homepage with breaking banners and published article feed
- `/articles/[slug]` live article page with premium locking and live updates
- `/latest`, `/most-read`, `/topics`, `/categories`, `/regions`, `/tags`, `/rss` public discovery routes
- `/dashboard` executive dashboard
- `/dashboard/editor` editor workflow dashboard
- `/dashboard/journalist` journalist workspace
- `/dashboard/admin` super admin operations
- `/dashboard/ai` AI newsroom workbench
- `/dashboard/distribution` regional editions and syndication controls
- `/dashboard/revenue` advertising, subscriptions, and marketplace overview
- `/dashboard/operations` bureaus, crises, health, and disaster recovery
- `/dashboard/data` data journalism projects and visualizations
- `/dashboard/media` media library dashboard
- `/dashboard/newsletters` newsletter operations dashboard
- `/authors/[id]` journalist/editor profile archive
- `/live/[slug]` live coverage page
- `/search` public search experience
- `/pricing` pricing page
- `/account/subscription` subscriber account page
- `/account/notifications`, `/account/newsletters`, `/account/saved`, `/account/following`, `/account/history`, `/account/settings` reader account surfaces
- `/distribution` public syndication and editions overview
- `/video` Global Press TV
- `/podcasts` podcast network
- `/advertise` advertiser and sponsorship overview
- `/about`, `/contact`, `/careers`, `/ethics`, `/editorial-standards`, `/corrections`, `/privacy`, `/terms`, `/press-releases`, `/subscribe` public trust pages
- `/status` public uptime and health page
- `/login` authentication entry

## Core APIs

- `/api/rest/articles`
- `/api/rest/articles/[id]`
- `/api/rest/articles/[id]/autosave`
- `/api/rest/articles/[id]/workflow`
- `/api/rest/articles/[id]/versions`
- `/api/rest/articles/[id]/comments`
- `/api/rest/articles/[id]/live-updates`
- `/api/rest/assignments`
- `/api/rest/media`
- `/api/rest/media/presign`
- `/api/rest/newsletter/signup`
- `/api/rest/newsletters`
- `/api/rest/breaking-news`
- `/api/rest/search`
- `/api/rest/search/suggestions`
- `/api/rest/subscriptions/plans`
- `/api/rest/subscriptions/checkout`
- `/api/rest/articles/[id]/bookmark`
- `/api/rest/articles/[id]/public-comments`
- `/api/rest/authors/[id]/follow`
- `/api/rest/ai/research`
- `/api/rest/ai/writing`
- `/api/rest/ai/intelligence`
- `/api/rest/distribution/partners`
- `/api/rest/distribution/feeds`
- `/api/rest/video`
- `/api/rest/podcasts`
- `/api/rest/revenue/ads`
- `/api/rest/revenue/marketplace`
- `/api/rest/operations/bureaus`
- `/api/rest/operations/crisis`
- `/api/rest/operations/health`

## Environment variables

- `APP_URL`, `NEXTAUTH_URL`, `NEXTAUTH_SECRET`
- `SITE_NAME`, `SITE_SUPPORT_EMAIL`, `DEFAULT_LOCALE`, `LOG_LEVEL`
- `DATABASE_URL`, `DIRECT_URL`
- `NEWS_MODE`, `NEWS_REFRESH_INTERVAL_MINUTES`, `NEWS_CACHE_TTL_SECONDS`, `ENABLE_RSS_NEWS`
- `RSS_WORLD_FEED_URL`, `RSS_BUSINESS_FEED_URL`, `RSS_TECH_FEED_URL`
- `GUARDIAN_OPEN_PLATFORM_KEY`, `GNEWS_API_KEY`, `NEWS_API_KEY`, `CURRENTS_API_KEY`, `THENEWSAPI_API_TOKEN`
- `ALPHA_VANTAGE_API_KEY`, `FINNHUB_API_KEY`, `COINGECKO_API_KEY`
- `REDIS_URL`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
- `S3_ENDPOINT`, `S3_REGION`, `S3_BUCKET`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`
- `S3_PUBLIC_BASE_URL`, `S3_FORCE_PATH_STYLE`, `CDN_BASE_URL`
- `EMAIL_PROVIDER`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM`, `RESEND_API_KEY`
- `PAYMENT_PROVIDER`, `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`
- `FREE_ARTICLE_LIMIT`, `PAYWALL_PREMIUM_LABEL`
- `AI_PROVIDER`, `OPENAI_API_KEY`
- `SEARCH_PROVIDER`, `MEILISEARCH_URL`, `MEILISEARCH_MASTER_KEY`, `TYPESENSE_HOST`, `TYPESENSE_API_KEY`, `ELASTICSEARCH_URL`
- `POSTHOG_KEY`, `POSTHOG_HOST`, `SENTRY_DSN`, `ENABLE_SENTRY`

## Commands

- `npm run prisma:generate`
- `npm run prisma:migrate`
- `npm run db:push`
- `npm run prisma:seed`
- `npm run db:seed`
- `npm run worker`
- `npm run lint`
- `npm run test`
- `npm run test:e2e`
- `npm run build`

## Validation status

The following commands were run successfully against the current codebase:

- `npm run prisma:generate`
- `npm run lint`
- `npm run test`
- `npm run test:e2e`
- `npm run build`

## Docs

- `docs/api-architecture.md`
- `docs/folder-structure.md`
- `docs/ui-wireframes.md`
- `docs/deployment.md`
- `docs/media-storage.md`
- `docs/background-workers.md`
- `docs/ai-newsroom.md`
- `docs/global-distribution.md`
- `docs/video-network.md`
- `docs/revenue-platform.md`
- `docs/data-journalism.md`
- `docs/global-operations.md`
- `docs/platform-scale.md`
- `docs/launch-checklist.md`
- `docs/demo-script.md`
- `docs/accessibility-notes.md`
- `docs/public-discovery.md`

## Notes

The codebase now covers a much fuller publishing experience, but a real launch would still want production billing, object-storage lifecycle rules, richer collaborative presence, external search integration, distributed rate limiting, and formal observability.
