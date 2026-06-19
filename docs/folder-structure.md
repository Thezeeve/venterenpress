# Folder Structure

```text
international/
├─ prisma/
│  ├─ schema.prisma
│  └─ seed.ts
├─ src/
│  ├─ app/
│  │  ├─ (platform)/
│  │  │  └─ dashboard/
│  │  ├─ api/
│  │  ├─ articles/[slug]/
│  │  ├─ authors/[id]/
│  │  ├─ live/[slug]/
│  │  ├─ pricing/
│  │  ├─ search/
│  │  ├─ account/subscription/
│  │  ├─ login/
│  │  ├─ error.tsx
│  │  ├─ feed.xml/
│  │  ├─ globals.css
│  │  ├─ layout.tsx
│  │  ├─ loading.tsx
│  │  ├─ manifest.ts
│  │  ├─ opengraph-image.tsx
│  │  ├─ page.tsx
│  │  ├─ robots.ts
│  │  └─ sitemap.ts
│  ├─ components/
│  │  ├─ article/
│  │  ├─ home/
│  │  ├─ search/
│  │  ├─ charts/
│  │  ├─ dashboard/
│  │  ├─ editor/
│  │  ├─ layout/
│  │  ├─ providers/
│  │  └─ ui/
│  ├─ lib/
│  │  ├─ data/
│  │  ├─ graphql/
│  │  ├─ jobs/
│  │  ├─ auth.ts
│  │  ├─ articles.ts
│  │  ├─ audit.ts
│  │  ├─ dashboard-data.ts
│  │  ├─ payments.ts
│  │  ├─ prisma.ts
│  │  ├─ rate-limit.ts
│  │  ├─ rbac.ts
│  │  ├─ redis.ts
│  │  ├─ search.ts
│  │  ├─ server-auth.ts
│  │  ├─ site.ts
│  │  ├─ storage.ts
│  │  ├─ subscriptions.ts
│  │  ├─ utils.ts
│  │  └─ validation.ts
│  └─ types/
│     └─ next-auth.d.ts
├─ tests/e2e/
├─ docs/
├─ .github/workflows/
├─ Dockerfile
├─ docker-compose.yml
├─ prisma.config.ts
├─ playwright.config.ts
└─ vitest.config.ts
```

This is organized around product surfaces and platform concerns. As the project grows, split `src/lib` into bounded contexts and move backend-heavy code into dedicated service modules.
