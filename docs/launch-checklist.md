# Launch Checklist

Use this checklist before exposing Global Press Network to public traffic.

## Database setup

- Provision PostgreSQL with connection pooling.
- Set `DATABASE_URL` and `DIRECT_URL`.
- Run `npm run prisma:generate`.
- Run `npm run db:push` or `npm run prisma:migrate` depending on release workflow.
- Verify that seed data only runs in non-production environments.

## Migrations

- Review `prisma/schema.prisma` for breaking changes before each release.
- Commit generated migrations when moving from local development to team workflows.
- Test rollback and restore procedures in a staging clone.

## Seed data

- Run `npm run prisma:seed` only against development or staging environments.
- Confirm demo accounts, editions, categories, and launch settings are present.

## Auth setup

- Configure `NEXTAUTH_URL`, `NEXTAUTH_SECRET`, and Google OAuth credentials.
- Verify credentials login and Google login in staging.
- Confirm two-factor flows are enabled for staff roles.
- Confirm middleware-based protection for `/account/*` and `/dashboard/*` redirects unauthenticated traffic to `/login`.

## Storage setup

- Set `S3_ENDPOINT`, `S3_REGION`, `S3_BUCKET`, `S3_ACCESS_KEY_ID`, and `S3_SECRET_ACCESS_KEY`.
- Set `S3_PUBLIC_URL_BASE` or CDN origin for public asset delivery.
- Test upload, presign, and metadata flows with article images and video assets.

## Redis and jobs

- Set `REDIS_URL` or Upstash credentials.
- Run `npm run worker` as a separate process.
- Confirm scheduled publishing, newsletters, media processing, analytics, and notifications are consuming jobs.

## Email and newsletters

- Configure SMTP or a transactional email provider.
- Verify newsletter signup, segmentation, campaign scheduling, and unsubscribes.
- Confirm sender identity and SPF / DKIM / DMARC records.

## Payments

- Set `PAYMENT_PROVIDER` to the live provider in production.
- Configure Stripe keys and webhook secrets if Stripe is enabled.
- Test checkout success and cancel flows.
- Confirm invoice and receipt data is visible in the subscriber account.

## Public experience QA

- Verify newsroom navigation across desktop and mobile: mega menu, edition selector, sticky breaking bar, notification dropdown, and drawer.
- Verify public discovery pages: `/latest`, `/most-read`, `/topics`, `/tags`, `/categories`, `/regions`, and `/rss`.
- Verify article trust surfaces: fact-check labels, source transparency, correction history, review status, and share cards.
- Verify personalization surfaces for authenticated readers: recommendations, continue reading, newsletter preferences, and alert preferences.
- Verify media-kit and press-release commercial flows for copy, pricing, and intake links.

## Domain and SSL

- Point the primary domain at the production deployment.
- Enable TLS/SSL and HTTP to HTTPS redirects.
- Verify canonical URLs, sitemap, robots, and Open Graph metadata.

## Backups

- Enable automated database backups.
- Store offsite backups for database and critical assets.
- Run a restore drill before launch.

## Monitoring

- Configure uptime checks for `/api/health` and `/status`.
- Add error logging, performance logging, and worker monitoring alerts.
- Verify audit log retention and admin action visibility.
- Keep the demo-mode public fallbacks limited to non-production environments and confirm production routes are fully data-backed before launch.

## Admin account creation

- Seed or create at least one `SUPER_ADMIN`.
- Verify admin access to `/dashboard/admin` and `/dashboard/admin/settings`.
- Confirm audit logging for settings changes and moderation actions.
