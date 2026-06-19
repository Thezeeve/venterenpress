# Platform Scale

This repository is structured so the web tier, worker tier, storage tier, and analytics workloads can scale independently.

## Current strategy

- SSR and dynamic routes serve reader-facing pages.
- Prisma owns the transactional source of truth.
- Redis backs cache and queue transport.
- S3-compatible storage keeps media and generated assets off the app server.

## Scale guidance

- Put the worker process on separate replicas from the Next.js app.
- Add Redis-backed distributed rate limiting before large-scale traffic.
- Move search to Meilisearch, Typesense, or Elasticsearch when article volume or ranking needs exceed the PostgreSQL fallback.
- Use CDN edge caching for media, Open Graph images, and static assets.
- Split large jobs such as media processing, newsletter sends, and analytics aggregation away from time-sensitive publishing operations.

## Recovery guidance

- Keep database backups on a tested schedule.
- Run restore drills before launch traffic.
- Document the failover order for web, worker, storage, search, and reporting dependencies.
