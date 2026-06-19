# API Architecture

Global Press Network exposes two server interfaces inside the Next.js application:

- REST under `/api/rest/*` for frontend fetches, external integrations, automation, and editorial tooling.
- GraphQL under `/api/graphql` for flexible dashboard queries, mobile clients, and federated consumers.

## REST modules

- `GET /api/health`: infrastructure health probe for uptime monitoring and load balancers.
- `GET /api/rest/articles`: live article listing with filters.
- `POST /api/rest/articles`: create article with categories, tags, workflow-ready metadata, and initial version history.
- `GET|PATCH|DELETE /api/rest/articles/[id]`: read, update, and soft-delete articles.
- `POST /api/rest/articles/[id]/autosave`: store autosave snapshots.
- `POST /api/rest/articles/[id]/workflow`: workflow actions including submit, fact-check, approve, schedule, publish, and archive.
- `GET /api/rest/articles/[id]/versions`: article version history.
- `POST /api/rest/articles/[id]/versions/restore`: restore a previous version.
- `GET|POST /api/rest/articles/[id]/comments`: internal workflow comments.
- `GET|POST /api/rest/articles/[id]/live-updates`: live blog updates.
- `GET|POST /api/rest/assignments`: assignment management.
- `GET /api/rest/media`: media library listing.
- `POST /api/rest/media/presign`: S3-compatible presigned upload creation plus media record creation.
- `GET /api/rest/search`: article search with author/category/date/type filters.
- `GET /api/rest/search/suggestions`: suggestion feed for public search UX.
- `GET /api/rest/subscriptions/plans`: subscription plan catalog.
- `POST /api/rest/subscriptions/checkout`: payment-provider abstraction checkout entry point.
- `POST /api/rest/newsletter/signup`: public newsletter signup.
- `GET|POST /api/rest/newsletters`: campaign listing and scheduling.
- `GET|POST /api/rest/breaking-news`: breaking news banner management.
- `POST /api/rest/articles/[id]/bookmark`: authenticated bookmark toggle.
- `GET|POST /api/rest/articles/[id]/public-comments`: public article discussion.
- `POST /api/rest/authors/[id]/follow`: follow journalist toggle.
- `GET /api/rest/dashboard`: live dashboard metrics.
- `GET|POST /api/rest/ai/research`: AI-assisted source research sessions with verification notes.
- `POST /api/rest/ai/writing`: headline, summary, SEO, translation, and style suggestions.
- `GET /api/rest/ai/intelligence`: duplicate detection, trending topic analysis, and follow-up recommendations.
- `GET|POST /api/rest/distribution/partners`: syndication partner registry.
- `GET|POST /api/rest/distribution/feeds`: partner feed management.
- `GET|POST /api/rest/video`: video publishing center entries.
- `GET|POST /api/rest/podcasts`: podcast show and episode management.
- `GET|POST /api/rest/revenue/ads`: advertising inventory and campaign management.
- `GET|POST /api/rest/revenue/marketplace`: sponsored content and premium listing management.
- `GET|POST /api/rest/operations/bureaus`: bureau and assignment management.
- `GET|POST /api/rest/operations/crisis`: crisis event and live coverage controls.
- `GET /api/rest/operations/health`: platform health snapshots for ops dashboards.

## GraphQL

- `POST /api/graphql`: GraphQL Yoga endpoint for article, category, and dashboard metric queries.

## Cross-cutting concerns

- `src/middleware.ts` applies rate limiting to all `/api/*` routes.
- `src/lib/validation.ts` centralizes request schemas with Zod.
- `src/lib/redis.ts` provides Redis-backed cache helpers.
- `src/lib/rbac.ts` and `src/lib/server-auth.ts` enforce route-level RBAC and dashboard protection.
- `src/lib/audit.ts` records sensitive actions into `AuditLog`.
- `src/lib/jobs/queues.ts` dispatches Redis-backed background jobs.
- `src/lib/storage.ts` owns S3-compatible upload URL creation and media URL generation.
- `src/lib/payments.ts` abstracts payment checkout providers.
- `src/lib/search.ts` provides the swappable search adapter layer.
- `src/lib/ai.ts` centralizes AI newsroom heuristics and intelligence helpers.
- Metadata routes and feeds cover sitemap, robots, RSS, and Open Graph generation.
- Prisma is the persistence boundary and owns all relational reads and writes.

## Recommended next production steps

- Split REST handlers into explicit bounded contexts or service packages as the team grows.
- Add provider-specific payment implementation for Stripe and webhook reconciliation.
- Move search to Meilisearch, Typesense, or Elasticsearch when corpus size and ranking needs justify it.
- Replace the in-memory rate limiter with a Redis-backed distributed limiter.
- Put GraphQL behind persisted queries and auth-aware field guards.
- Add OpenTelemetry traces, structured logging, and audit-log event publishing.
