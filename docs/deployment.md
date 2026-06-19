# Deployment

## Runtime guidance

- Recommended Node version: `20.x`
- Keep production and CI on Node 20 until the AWS SDK dependency stack is explicitly upgraded and revalidated on Node 22.
- If a dependency emits a future-support warning, suppress it only by removing the import path or downgrading the dependency. Do not hide all warnings globally.

## Local development

1. Copy `.env.example` to `.env`.
2. Run `docker compose up -d postgres redis minio`.
3. Run `npm ci`.
4. Run `npm run prisma:generate`.
5. Run `npm run db:push`.
6. Run `npm run prisma:seed`.
7. Run `npm run dev`.
8. In a separate shell, run `npm run worker` if you want scheduled publishing, newsletter sends, search indexing, and media processing to execute locally.

## Full container deployment

1. Build the image with `docker build -t global-press-network .`.
2. Start the full stack with `docker compose up --build`.
3. The compose stack now includes `web`, `worker`, `postgres`, `redis`, and `minio`.
4. For production, replace local Postgres/Redis/MinIO with managed services and attach a CDN in front of object storage.
5. Run the worker as a separate deployment or container so queue processing scales independently from the web tier.

## Media storage setup

- Set `S3_ENDPOINT`, `S3_REGION`, `S3_BUCKET`, `S3_ACCESS_KEY_ID`, and `S3_SECRET_ACCESS_KEY`.
- Set `S3_PUBLIC_URL_BASE` if uploads are served behind a CDN or custom domain.
- The app creates presigned upload URLs through `/api/rest/media/presign` and stores metadata in `MediaAsset`.
- Run lifecycle policies and virus scanning outside the app process for production.

## Database migrations

- Local iteration currently uses `npm run db:push` for speed.
- For team workflows, move to `npm run prisma:migrate` and commit generated migrations.
- Reseed demo content with `npm run prisma:seed` after schema resets.
- The current schema includes AI newsroom, syndication, video, podcast, revenue, data journalism, and global operations tables, so migrations should be reviewed before each release.

## Background workers

- App runtime enqueues jobs in Redis lists through `src/lib/jobs/queues.ts`.
- `npm run worker` starts the job consumer in `src/lib/jobs/worker.ts`.
- Current job types: scheduled publishing, newsletter sending, search indexing, and media processing.
- Treat worker scale-out as a separate concern from web replicas so slow media or analytics jobs never block publishing traffic.

## Deployment notes

- Dashboard routes require authenticated sessions with sufficient roles.
- Article pages use metered access and premium locking based on subscriptions.
- Search defaults to PostgreSQL and can later move behind an external search backend.

## Production checklist

- Put the Next.js app behind a reverse proxy or managed edge platform.
- Store images, video, audio, and live-stream assets outside the app container.
- Use connection pooling for PostgreSQL and enable Prisma migrations in release automation.
- Replace the in-memory rate limiter with a distributed limiter backed by Redis or Upstash.
- Add retry semantics, dead-letter queues, and metrics around worker failures.
- Enable centralized logging, traces, and uptime checks.
- Plan for multi-region read scaling, backup restore drills, and documented recovery procedures before launch traffic reaches the target audience.
