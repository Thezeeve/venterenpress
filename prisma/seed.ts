import bcrypt from "bcryptjs";
import { loadEnvConfig } from "@next/env";
import {
  AccessTier,
  AIJobStatus,
  AdCampaignStatus,
  ArticleStatus,
  ArticleType,
  CredibilityLevel,
  CrisisSeverity,
  CrisisStatus,
  DataProjectStatus,
  DataVisualizationType,
  EditionCode,
  DeploymentRegion,
  DistributionFormat,
  GlobalRegion,
  HealthStatus,
  LanguageCode,
  MarketplaceListingStatus,
  MarketplaceListingType,
  PaymentProvider,
  Prisma,
  PrismaClient,
  PodcastPublicationStatus,
  Role,
  SyndicationStatus,
  SubscriptionStatus,
  VideoPublicationStatus,
  UserStatus,
} from "@prisma/client";
import { slugify } from "../src/lib/utils";

loadEnvConfig(process.cwd());

const prisma = new PrismaClient();

const categories = [
  "World News",
  "Politics",
  "Business",
  "Technology",
  "Artificial Intelligence",
  "Crypto",
  "Finance",
  "Health",
  "Science",
  "Environment",
  "Sports",
  "Entertainment",
  "Travel",
  "Education",
  "Investigations",
  "Opinion",
  "Editorial",
  "Breaking News",
];

const tags = [
  "AI Infrastructure",
  "Elections",
  "Climate Risk",
  "Premium Strategy",
  "Global Markets",
  "Live Coverage",
];

type SeedArticle = {
  slug: string;
  title: string;
  excerpt: string;
  premiumPreview?: string;
  body: Prisma.InputJsonValue;
  status: ArticleStatus;
  articleType: ArticleType;
  accessTier: AccessTier;
  editionId: string;
  authorId: string;
  categories: string[];
  tags: string[];
  featured: boolean;
  breaking: boolean;
  publishedAt?: Date;
};

async function main() {
  const passwordHash = await bcrypt.hash("Password123!", 10);
  const vanterenAdminPasswordHash = await bcrypt.hash("Chukwuemeka2019$", 10);

  await Promise.all(
    categories.map((name) =>
      prisma.category.upsert({
        where: { slug: slugify(name) },
        update: {},
        create: {
          name,
          slug: slugify(name),
          isBreaking: name === "Breaking News",
        },
      }),
    ),
  );

  await Promise.all(
    tags.map((name) =>
      prisma.tag.upsert({
        where: { slug: slugify(name) },
        update: {},
        create: {
          name,
          slug: slugify(name),
        },
      }),
    ),
  );

  const editions = [
    [EditionCode.UNITED_STATES, "United States", "North America", "en-US"],
    [EditionCode.UNITED_KINGDOM, "United Kingdom", "Europe", "en-GB"],
    [EditionCode.CANADA, "Canada", "North America", "en-CA"],
    [EditionCode.EUROPE, "Europe", "Europe", "en-EU"],
    [EditionCode.AFRICA, "Africa", "Africa", "en-NG"],
    [EditionCode.ASIA, "Asia", "Asia", "en-SG"],
    [EditionCode.MIDDLE_EAST, "Middle East", "Middle East", "en-AE"],
    [EditionCode.LATIN_AMERICA, "Latin America", "Latin America", "es-MX"],
  ] as const;

  await Promise.all(
    editions.map(([code, name, region, locale]) =>
      prisma.edition.upsert({
        where: { code },
        update: {},
        create: {
          code,
          name,
          region,
          locale,
          description: `${name} regional edition`,
        },
      }),
    ),
  );

  const demoUsers = [
    ["admin@globalpress.network", "Global Press Admin", Role.SUPER_ADMIN, "Runs platform operations, permissions, and global publishing infrastructure."],
    ["eic@globalpress.network", "Editor in Chief", Role.EDITOR_IN_CHIEF, "Leads newsroom standards, premium packages, and editorial strategy across editions."],
    ["managing@globalpress.network", "Managing Editor", Role.MANAGING_EDITOR, "Coordinates desks, live coverage, and cross-edition workflows."],
    ["journalist@globalpress.network", "Amina Yusuf", Role.JOURNALIST, "Covers technology, geopolitical infrastructure, and accountability reporting."],
    ["factcheck@globalpress.network", "Daniel Ross", Role.FACT_CHECKER, "Leads verification and sourcing integrity across investigations and live coverage."],
    ["contributor@globalpress.network", "Mei Chen", Role.CONTRIBUTOR, "Reports on climate adaptation, sports business, and city resilience."],
    ["subscriber@globalpress.network", "Subscriber Demo", Role.SUBSCRIBER, "Demo subscriber for premium access, comments, and follow flows."],
  ] as const;

  const users = await Promise.all(
    demoUsers.map(([email, name, role, bio]) =>
      prisma.user.upsert({
        where: { email },
        update: {
          name,
          role,
          bio,
          passwordHash,
          status: UserStatus.ACTIVE,
          beats: role === Role.JOURNALIST ? ["technology", "investigations"] : [],
        },
        create: {
          email,
          name,
          role,
          bio,
          passwordHash,
          status: UserStatus.ACTIVE,
          beats: role === Role.JOURNALIST ? ["technology", "investigations"] : [],
        },
      }),
    ),
  );

  const userByRole = new Map(users.map((user) => [user.role, user]));

  if (process.env.NODE_ENV !== "production" || process.env.ALLOW_DEFAULT_ADMIN_SEED === "true") {
    await prisma.user.upsert({
      where: { email: "admin@vanterenpress.com" },
      update: {
        name: "admin",
        role: Role.SUPER_ADMIN,
        bio: "Default local VANTERENPRESS administrator for editorial and publishing workflows.",
        passwordHash: vanterenAdminPasswordHash,
        status: UserStatus.ACTIVE,
        isVerifiedJournalist: true,
        beats: ["world", "politics", "business"],
      },
      create: {
        email: "admin@vanterenpress.com",
        name: "admin",
        role: Role.SUPER_ADMIN,
        bio: "Default local VANTERENPRESS administrator for editorial and publishing workflows.",
        passwordHash: vanterenAdminPasswordHash,
        status: UserStatus.ACTIVE,
        isVerifiedJournalist: true,
        beats: ["world", "politics", "business"],
      },
    });
  }

  await prisma.user.update({
    where: { id: userByRole.get(Role.JOURNALIST)!.id },
    data: {
      image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=512&q=80",
      isVerifiedJournalist: true,
      contractUrl: "https://globalpress.network/contracts/amina-yusuf",
      contractNotes: "International reporting contract with bureau access and travel clearance.",
      socialLinks: {
        x: "https://x.com/aminayusuf",
        linkedin: "https://linkedin.com/in/aminayusuf",
        mastodon: "https://news.social/@aminayusuf",
      },
      notificationPreferences: { email: true, push: true, breakingNews: true },
      newsletterPreferences: { topics: ["Technology", "Investigations"], regions: ["Africa", "Americas"] },
    },
  });

  await prisma.user.update({
    where: { id: userByRole.get(Role.EDITOR_IN_CHIEF)!.id },
    data: {
      image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=512&q=80",
      isVerifiedJournalist: true,
      socialLinks: {
        x: "https://x.com/globalpressedit",
        linkedin: "https://linkedin.com/in/editorinchief",
      },
    },
  });

  const africaEdition = await prisma.edition.findUniqueOrThrow({
    where: { code: EditionCode.AFRICA },
  });
  const usEdition = await prisma.edition.findUniqueOrThrow({
    where: { code: EditionCode.UNITED_STATES },
  });

  const technology = await prisma.category.findUniqueOrThrow({
    where: { slug: "technology" },
  });
  const ai = await prisma.category.findUniqueOrThrow({
    where: { slug: "artificial-intelligence" },
  });
  const investigations = await prisma.category.findUniqueOrThrow({
    where: { slug: "investigations" },
  });
  const breaking = await prisma.category.findUniqueOrThrow({
    where: { slug: "breaking-news" },
  });

  const aiTag = await prisma.tag.findUniqueOrThrow({ where: { slug: "ai-infrastructure" } });
  const liveTag = await prisma.tag.findUniqueOrThrow({ where: { slug: "live-coverage" } });

  const seededArticles: SeedArticle[] = [
    {
      slug: "global-chip-alliances-reshape-ai-infrastructure-competition",
      title: "Global chip alliances reshape AI infrastructure competition",
      excerpt:
        "Governments and hyperscale platforms are redrawing semiconductor strategy around energy, supply chains, and sovereign cloud capacity.",
      premiumPreview:
        "This premium briefing examines how AI infrastructure is becoming a geopolitical and industrial policy contest.",
      body: {
        type: "doc",
        content: [
          { type: "paragraph", text: "Governments and hyperscale providers are shifting from isolated procurement strategies toward explicit infrastructure alliances spanning fabs, power contracts, and sovereign cloud incentives." },
        ],
      },
      status: ArticleStatus.PUBLISHED,
      articleType: ArticleType.NEWS,
      accessTier: AccessTier.PREMIUM,
      editionId: usEdition.id,
      authorId: userByRole.get(Role.JOURNALIST)!.id,
      categories: [technology.id, ai.id],
      tags: [aiTag.id],
      featured: true,
      breaking: true,
      publishedAt: new Date(),
    },
    {
      slug: "g20-live-negotiations-enter-final-round",
      title: "G20 live negotiations enter final round",
      excerpt:
        "Delegations head into a late-stage push over cross-border investment rules and critical infrastructure language.",
      body: {
        type: "doc",
        content: [{ type: "paragraph", text: "Live coverage continues as negotiators attempt to finalize language across trade and security tracks." }],
      },
      status: ArticleStatus.PUBLISHED,
      articleType: ArticleType.LIVE_BLOG,
      accessTier: AccessTier.FREE,
      editionId: africaEdition.id,
      authorId: userByRole.get(Role.JOURNALIST)!.id,
      categories: [breaking.id],
      tags: [liveTag.id],
      featured: false,
      breaking: true,
      publishedAt: new Date(),
    },
    {
      slug: "inside-illicit-shipping-routes",
      title: "Inside illicit shipping routes that evade sanctions controls",
      excerpt:
        "An investigations desk package traces how operators exploit opaque ownership structures and patchy enforcement.",
      body: {
        type: "doc",
        content: [{ type: "paragraph", text: "The reporting follows vessel registries, insurance gaps, and transshipment patterns across multiple jurisdictions." }],
      },
      status: ArticleStatus.EDITOR_REVIEW,
      articleType: ArticleType.INVESTIGATION,
      accessTier: AccessTier.MEMBERS_ONLY,
      editionId: africaEdition.id,
      authorId: userByRole.get(Role.JOURNALIST)!.id,
      categories: [investigations.id],
      tags: [liveTag.id],
      featured: false,
      breaking: false,
    },
    {
      slug: "markets-brace-for-coordinated-rate-signals",
      title: "Markets brace for coordinated rate signals across major economies",
      excerpt:
        "Bond desks and currency traders are positioning for central-bank messaging that could reset risk appetite.",
      body: {
        type: "doc",
        content: [
          { type: "paragraph", text: "Investors are treating this week’s central-bank communications as a combined signal rather than a collection of isolated events." },
          { type: "table", headers: ["Desk", "Positioning"], rows: [["Rates", "Defensive"], ["FX", "Selective dollar strength"], ["Equities", "Quality bias"]] },
        ],
      },
      status: ArticleStatus.PUBLISHED,
      articleType: ArticleType.ANALYSIS,
      accessTier: AccessTier.FREE,
      editionId: usEdition.id,
      authorId: userByRole.get(Role.JOURNALIST)!.id,
      categories: [(await prisma.category.findUniqueOrThrow({ where: { slug: "finance" } })).id],
      tags: [(await prisma.tag.findUniqueOrThrow({ where: { slug: "global-markets" } })).id],
      featured: false,
      breaking: false,
      publishedAt: new Date(),
    },
    {
      slug: "how-cities-are-funding-climate-adaptation",
      title: "How cities are funding climate adaptation as extreme heat rewrites budgets",
      excerpt:
        "Urban leaders are shifting capital plans toward cooling, flood resilience, and emergency readiness.",
      body: {
        type: "doc",
        content: [
          { type: "heading", text: "Why the numbers are shifting", level: 2 },
          { type: "paragraph", text: "Municipal finance teams are reclassifying resilience spending as core infrastructure, not optional sustainability programming." },
          { type: "callout", title: "Budget pressure point", text: "Cooling and water resilience are becoming recurring budget lines in fast-growing urban regions." },
        ],
      },
      status: ArticleStatus.PUBLISHED,
      articleType: ArticleType.NEWS,
      accessTier: AccessTier.FREE,
      editionId: africaEdition.id,
      authorId: userByRole.get(Role.CONTRIBUTOR)!.id,
      categories: [(await prisma.category.findUniqueOrThrow({ where: { slug: "environment" } })).id],
      tags: [(await prisma.tag.findUniqueOrThrow({ where: { slug: "climate-risk" } })).id],
      featured: false,
      breaking: false,
      publishedAt: new Date(),
    },
    {
      slug: "why-premium-news-subscribers-stay",
      title: "Why premium news subscribers stay when the market turns noisy",
      excerpt:
        "Retention is increasingly driven by habit-forming briefings, trusted beat expertise, and useful utility.",
      body: {
        type: "doc",
        content: [
          { type: "paragraph", text: "Audience research shows that premium retention is strongest where subscription products tie daily utility to differentiated reporting." },
          { type: "blockquote", text: "The winning subscription is not only exclusive. It is indispensable." },
        ],
      },
      status: ArticleStatus.PUBLISHED,
      articleType: ArticleType.OPINION,
      accessTier: AccessTier.PREMIUM,
      editionId: usEdition.id,
      authorId: userByRole.get(Role.EDITOR_IN_CHIEF)!.id,
      categories: [(await prisma.category.findUniqueOrThrow({ where: { slug: "opinion" } })).id],
      tags: [(await prisma.tag.findUniqueOrThrow({ where: { slug: "premium-strategy" } })).id],
      featured: false,
      breaking: false,
      publishedAt: new Date(),
    },
    {
      slug: "inside-the-global-crypto-liquidity-reset",
      title: "Inside the global crypto liquidity reset",
      excerpt:
        "Token markets are adjusting to a new mix of regulatory pressure, institutional flows, and macro sensitivity.",
      body: {
        type: "doc",
        content: [
          { type: "paragraph", text: "Crypto market structure is becoming more entwined with traditional liquidity cycles and regulatory interpretation." },
          { type: "citation", sourceName: "Market Structure Desk", sourceUrl: "https://globalpress.network", quote: "Liquidity is no longer a crypto-only story." },
        ],
      },
      status: ArticleStatus.PUBLISHED,
      articleType: ArticleType.NEWS,
      accessTier: AccessTier.FREE,
      editionId: usEdition.id,
      authorId: userByRole.get(Role.JOURNALIST)!.id,
      categories: [(await prisma.category.findUniqueOrThrow({ where: { slug: "crypto" } })).id],
      tags: [(await prisma.tag.findUniqueOrThrow({ where: { slug: "global-markets" } })).id],
      featured: false,
      breaking: false,
      publishedAt: new Date(),
    },
    {
      slug: "the-streaming-wars-enter-a-profit-era",
      title: "The streaming wars enter a profit era",
      excerpt:
        "Media companies are redesigning release strategies, bundle logic, and ad tiers around margin discipline.",
      body: {
        type: "doc",
        content: [
          { type: "paragraph", text: "Entertainment groups are emphasizing cash generation over pure subscriber scale in the next phase of streaming competition." },
        ],
      },
      status: ArticleStatus.PUBLISHED,
      articleType: ArticleType.EDITORIAL,
      accessTier: AccessTier.FREE,
      editionId: usEdition.id,
      authorId: userByRole.get(Role.MANAGING_EDITOR)!.id,
      categories: [(await prisma.category.findUniqueOrThrow({ where: { slug: "entertainment" } })).id],
      tags: [(await prisma.tag.findUniqueOrThrow({ where: { slug: "premium-strategy" } })).id],
      featured: false,
      breaking: false,
      publishedAt: new Date(),
    },
    {
      slug: "championship-clubs-rebuild-around-data-and-depth",
      title: "Championship clubs rebuild around data, depth, and sports science",
      excerpt:
        "Elite teams are treating roster construction as a continuous optimization problem, not a seasonal reset.",
      body: {
        type: "doc",
        content: [
          { type: "paragraph", text: "Performance departments are now central to competitive planning, with data and recovery shaping team value." },
        ],
      },
      status: ArticleStatus.PUBLISHED,
      articleType: ArticleType.NEWS,
      accessTier: AccessTier.FREE,
      editionId: usEdition.id,
      authorId: userByRole.get(Role.CONTRIBUTOR)!.id,
      categories: [(await prisma.category.findUniqueOrThrow({ where: { slug: "sports" } })).id],
      tags: [(await prisma.tag.findUniqueOrThrow({ where: { slug: "live-coverage" } })).id],
      featured: false,
      breaking: false,
      publishedAt: new Date(),
    },
  ] as const;

  for (const articleInput of seededArticles) {
    const article = await prisma.article.upsert({
      where: { slug: articleInput.slug },
      update: {
        title: articleInput.title,
        excerpt: articleInput.excerpt,
        premiumPreview: articleInput.premiumPreview ?? null,
        body: articleInput.body,
        status: articleInput.status,
        articleType: articleInput.articleType,
        accessTier: articleInput.accessTier,
        editionId: articleInput.editionId,
        authorId: articleInput.authorId,
        featured: articleInput.featured,
        breaking: articleInput.breaking,
        publishedAt: articleInput.publishedAt ?? null,
      },
      create: {
        slug: articleInput.slug,
        title: articleInput.title,
        excerpt: articleInput.excerpt,
        premiumPreview: articleInput.premiumPreview ?? null,
        body: articleInput.body,
        status: articleInput.status,
        articleType: articleInput.articleType,
        accessTier: articleInput.accessTier,
        editionId: articleInput.editionId,
        authorId: articleInput.authorId,
        featured: articleInput.featured,
        breaking: articleInput.breaking,
        publishedAt: articleInput.publishedAt ?? null,
      },
    });

    await prisma.articleCategory.deleteMany({ where: { articleId: article.id } });
    await prisma.articleTag.deleteMany({ where: { articleId: article.id } });

    await prisma.articleCategory.createMany({
      data: articleInput.categories.map((categoryId) => ({
        articleId: article.id,
        categoryId,
      })),
    });

    await prisma.articleTag.createMany({
      data: articleInput.tags.map((tagId) => ({
        articleId: article.id,
        tagId,
      })),
    });

    await prisma.articleVersion.upsert({
      where: {
        articleId_version: {
          articleId: article.id,
          version: 1,
        },
      },
      update: {
        title: article.title,
        excerpt: article.excerpt,
        body: article.body as Prisma.InputJsonValue,
        status: article.status,
      },
      create: {
        articleId: article.id,
        authorId: article.authorId,
        version: 1,
        title: article.title,
        excerpt: article.excerpt,
        body: article.body as Prisma.InputJsonValue,
        status: article.status,
        changelog: "Seeded article",
      },
    });
  }

  await prisma.article.update({
    where: { slug: "markets-brace-for-coordinated-rate-signals" },
    data: {
      correctionNotice:
        "A previous version misstated the timing of one central-bank statement. The article has been updated and the chronology clarified.",
      correctionIssuedAt: new Date(),
      updatedOn: new Date(),
    },
  });

  const article = await prisma.article.findUniqueOrThrow({
    where: { slug: "inside-illicit-shipping-routes" },
  });

  await prisma.workflowComment.createMany({
    data: [
      {
        articleId: article.id,
        userId: userByRole.get(Role.MANAGING_EDITOR)!.id,
        body: "Tighten the sourcing paragraph and surface the sanctions methodology earlier.",
        visibility: "INTERNAL",
      },
      {
        articleId: article.id,
        userId: userByRole.get(Role.FACT_CHECKER)!.id,
        body: "Cross-check vessel ownership references against the registry export before approval.",
        visibility: "FACT_CHECK_ONLY",
      },
    ],
    skipDuplicates: true,
  });

  await prisma.assignment.create({
    data: {
      title: "Finalize sanctions investigation package",
      brief: "Coordinate the final reported copy, image selection, and legal review notes for publication.",
      articleId: article.id,
      assigneeId: userByRole.get(Role.JOURNALIST)!.id,
      createdById: userByRole.get(Role.MANAGING_EDITOR)!.id,
      status: "IN_PROGRESS",
      dueAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
  }).catch(() => null);

  await prisma.liveUpdate.create({
    data: {
      articleId: (
        await prisma.article.findUniqueOrThrow({
          where: { slug: "g20-live-negotiations-enter-final-round" },
        })
      ).id,
      title: "Delegations return from bilateral caucus",
      body: "Trade and energy language remains under negotiation as delegates resume the plenary session.",
    },
  }).catch(() => null);

  await prisma.subscriptionPlan.upsert({
    where: { slug: "premium-digital" },
    update: {},
    create: {
      slug: "premium-digital",
      name: "Premium Digital",
      description: "Unlimited premium stories, newsletters, podcasts, and briefings.",
      priceMonthly: 19.99,
      priceYearly: 199.0,
      freeArticleLimit: 5,
      currency: "USD",
      features: ["Unlimited premium access", "Regional newsletters", "Podcasts", "Live blog alerts"],
      provider: PaymentProvider.MOCK,
    },
  });

  const premiumPlan = await prisma.subscriptionPlan.findUniqueOrThrow({
    where: { slug: "premium-digital" },
  });

  await prisma.subscription.upsert({
    where: {
      id: "seed-subscriber-subscription",
    },
    update: {
      userId: userByRole.get(Role.SUBSCRIBER)!.id,
      planId: premiumPlan.id,
      status: SubscriptionStatus.ACTIVE,
    },
    create: {
      id: "seed-subscriber-subscription",
      userId: userByRole.get(Role.SUBSCRIBER)!.id,
      planId: premiumPlan.id,
      status: SubscriptionStatus.ACTIVE,
      renewsAt: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000),
    },
  });

  const africaSegment = await prisma.newsletterSegment.upsert({
    where: { slug: "africa-politics-daily" },
    update: {},
    create: {
      slug: "africa-politics-daily",
      name: "Africa Politics Daily",
      description: "Regional politics briefing",
      regions: ["Africa"],
      topics: ["Politics", "Breaking News"],
      editionId: africaEdition.id,
    },
  });

  await prisma.newsletterSubscriber.upsert({
    where: { email: "briefing@demo-reader.com" },
    update: {
      topics: ["Artificial Intelligence", "Politics"],
      regions: ["Africa", "United States"],
    },
    create: {
      email: "briefing@demo-reader.com",
      name: "Demo Reader",
      topics: ["Artificial Intelligence", "Politics"],
      regions: ["Africa", "United States"],
    },
  });

  await prisma.newsletterCampaign.create({
    data: {
      title: "Morning global briefing",
      subject: "GPN Morning Briefing: AI infrastructure, G20, and markets",
      preheader: "The lead stories global decision-makers are reading now.",
      bodyHtml: "<p>Today’s briefing links our top AI infrastructure, live negotiations, and markets coverage.</p>",
      articleId: (
        await prisma.article.findUniqueOrThrow({
          where: { slug: "global-chip-alliances-reshape-ai-infrastructure-competition" },
        })
      ).id,
      segmentId: africaSegment.id,
      createdById: userByRole.get(Role.EDITOR_IN_CHIEF)!.id,
      status: "SCHEDULED",
      scheduledFor: new Date(Date.now() + 60 * 60 * 1000),
    },
  }).catch(() => null);

  await prisma.article.upsert({
    where: { slug: "global-health-systems-brace-for-climate-driven-heatwaves" },
    update: {},
    create: {
      slug: "global-health-systems-brace-for-climate-driven-heatwaves",
      title: "Global health systems brace for climate-driven heatwaves",
      excerpt:
        "Hospitals across several regions are reshaping emergency protocols as heat exposure, air quality, and staffing pressures rise.",
      premiumPreview:
        "This premium briefing tracks how public health systems are adapting emergency planning, bed capacity, and urban cooling policy.",
      body: {
        type: "doc",
        content: [
          { type: "paragraph", text: "Public health planners are linking emergency-room capacity to heat alerts, regional power resilience, and transport access." },
          { type: "callout", title: "System pressure", text: "Urban hospitals are preparing for repeated demand spikes during extreme heat events." },
        ],
      },
      status: ArticleStatus.PUBLISHED,
      articleType: ArticleType.NEWS,
      accessTier: AccessTier.PREMIUM,
      editionId: africaEdition.id,
      authorId: userByRole.get(Role.CONTRIBUTOR)!.id,
      featured: false,
      breaking: false,
      publishedAt: new Date(),
      categories: {
        create: [{ categoryId: (await prisma.category.findUniqueOrThrow({ where: { slug: "health" } })).id }],
      },
      tags: {
        create: [{ tagId: (await prisma.tag.findUniqueOrThrow({ where: { slug: "climate-risk" } })).id }],
      },
    },
  });

  await prisma.article.upsert({
    where: { slug: "classroom-ai-tools-spark-new-education-policy-debate" },
    update: {},
    create: {
      slug: "classroom-ai-tools-spark-new-education-policy-debate",
      title: "Classroom AI tools spark a new education policy debate",
      excerpt:
        "School systems are balancing productivity gains against questions over assessment, equity, and student data.",
      body: {
        type: "doc",
        content: [
          { type: "paragraph", text: "Education ministries are moving toward clearer policy frameworks for generative AI in classrooms and assessment." },
        ],
      },
      status: ArticleStatus.PUBLISHED,
      articleType: ArticleType.ANALYSIS,
      accessTier: AccessTier.FREE,
      editionId: usEdition.id,
      authorId: userByRole.get(Role.JOURNALIST)!.id,
      featured: false,
      breaking: false,
      publishedAt: new Date(),
      categories: {
        create: [{ categoryId: (await prisma.category.findUniqueOrThrow({ where: { slug: "education" } })).id }],
      },
      tags: {
        create: [{ tagId: aiTag.id }],
      },
    },
  });

  await prisma.breakingNewsBanner.create({
    data: {
      title: "Live: G20 negotiations enter the final round",
      summary: "Delegates are still negotiating cross-border investment and energy language.",
      priority: 90,
      editionId: africaEdition.id,
      linkUrl: "/articles/g20-live-negotiations-enter-final-round",
    },
  }).catch(() => null);

  await prisma.mediaAsset.create({
    data: {
      title: "Newsroom hero visual",
      altText: "Global Press Network newsroom",
      bucket: process.env.S3_BUCKET ?? "global-press-network",
      objectKey: "images/demo/newsroom-hero.jpg",
      url: "https://images.unsplash.com/photo-1495020689067-958852a7765e?auto=format&fit=crop&w=1200&q=80",
      type: "IMAGE",
      mimeType: "image/jpeg",
      sizeBytes: 245000,
      width: 1600,
      height: 900,
      processingStatus: "READY",
      uploaderId: userByRole.get(Role.MANAGING_EDITOR)!.id,
    },
  }).catch(() => null);

  await prisma.analyticsSnapshot.createMany({
    data: [
      {
        articleId: (
          await prisma.article.findUniqueOrThrow({
            where: { slug: "global-chip-alliances-reshape-ai-infrastructure-competition" },
          })
        ).id,
        views: 540000,
        uniqueVisitors: 418000,
        averageReadTime: 278,
        bounceRate: 34.2,
        conversions: 1420,
      },
      {
        articleId: (
          await prisma.article.findUniqueOrThrow({
            where: { slug: "g20-live-negotiations-enter-final-round" },
          })
        ).id,
        views: 810000,
        uniqueVisitors: 620000,
        averageReadTime: 214,
        bounceRate: 41.9,
        conversions: 860,
      },
    ],
    skipDuplicates: true,
  });

  const globalPartner = await prisma.syndicationPartner.upsert({
    where: { slug: "reuters-global" },
    update: {
      name: "Reuters Global",
      website: "https://www.reuters.com",
      status: SyndicationStatus.ACTIVE,
      regions: [GlobalRegion.AMERICAS, GlobalRegion.EUROPE, GlobalRegion.AFRICA],
      languages: [LanguageCode.ENGLISH, LanguageCode.SPANISH, LanguageCode.FRENCH],
      apiKeyPrefix: "reuters",
    },
    create: {
      slug: "reuters-global",
      name: "Reuters Global",
      website: "https://www.reuters.com",
      status: SyndicationStatus.ACTIVE,
      regions: [GlobalRegion.AMERICAS, GlobalRegion.EUROPE, GlobalRegion.AFRICA],
      languages: [LanguageCode.ENGLISH, LanguageCode.SPANISH, LanguageCode.FRENCH],
      apiKeyPrefix: "reuters",
    },
  });

  await prisma.organization.upsert({
    where: { slug: "global-press-enterprise" },
    update: {
      name: "Global Press Enterprise",
      plan: "Enterprise",
      seats: 250,
      regions: [GlobalRegion.AMERICAS, GlobalRegion.EUROPE, GlobalRegion.ASIA_PACIFIC],
      languages: [LanguageCode.ENGLISH, LanguageCode.FRENCH, LanguageCode.SPANISH],
    },
    create: {
      slug: "global-press-enterprise",
      name: "Global Press Enterprise",
      plan: "Enterprise",
      seats: 250,
      regions: [GlobalRegion.AMERICAS, GlobalRegion.EUROPE, GlobalRegion.ASIA_PACIFIC],
      languages: [LanguageCode.ENGLISH, LanguageCode.FRENCH, LanguageCode.SPANISH],
    },
  });

  await prisma.aIResearchSession.deleteMany();
  await prisma.aIWritingSuggestion.deleteMany();
  await prisma.aIContentInsight.deleteMany();
  await prisma.translationJob.deleteMany();

  await prisma.aIResearchSession.create({
    data: {
      articleId: article.id,
      userId: userByRole.get(Role.JOURNALIST)!.id,
      topic: "Global sanctions enforcement",
      query: "sanctions enforcement shipping routes",
      status: AIJobStatus.COMPLETED,
      sourceCount: 3,
      verificationScore: 92,
      contradictionCount: 1,
      notes: "Use primary customs, vessel registry, and court filings. Flag contradictions before approval.",
      sources: {
        create: [
          {
            title: "Sanctions registry export",
            url: "https://globalpress.network/research/sanctions-registry",
            publisher: "Global Press Network",
            credibility: CredibilityLevel.VERIFIED,
            isContradictory: false,
            summary: "Primary export data used to verify vessel movements.",
            score: 96,
          },
          {
            title: "Ownership disclosure filing",
            url: "https://globalpress.network/research/ownership-disclosure",
            publisher: "Court Records",
            credibility: CredibilityLevel.HIGH,
            isContradictory: false,
            summary: "Corporate disclosure used to trace beneficial ownership.",
            score: 89,
          },
        ],
      },
      findings: {
        create: [
          {
            title: "Verify travel sequence",
            body: "Cross-check departure and docking timestamps with customs logs before publication.",
            category: "verification",
            importance: 9,
          },
          {
            title: "Add follow-up angle",
            body: "Build a companion package on enforcement coordination across regional bureaus.",
            category: "coverage",
            importance: 7,
          },
        ],
      },
    },
  });

  await prisma.aIWritingSuggestion.createMany({
    data: [
      {
        articleId: article.id,
        userId: userByRole.get(Role.JOURNALIST)!.id,
        suggestionType: "headline",
        language: LanguageCode.ENGLISH,
        title: "Global chip alliances reshape AI infrastructure competition",
        body: "Global chip alliances reshape AI infrastructure competition",
        confidence: 0.94,
      },
      {
        articleId: article.id,
        userId: userByRole.get(Role.JOURNALIST)!.id,
        suggestionType: "summary",
        language: LanguageCode.ENGLISH,
        title: "AI infrastructure is now a geopolitical contest",
        body: "AI infrastructure is now a geopolitical contest",
        confidence: 0.91,
      },
    ],
  });

  await prisma.aIContentInsight.createMany({
    data: [
      {
        articleId: article.id,
        relatedArticleId: article.id,
        insightType: "duplicate-detection",
        title: "Potential overlap with prior sanctions coverage",
        description: "Refresh older shipping and enforcement coverage to avoid duplication and preserve novelty.",
        score: 0.82,
      },
      {
        articleId: article.id,
        relatedArticleId: article.id,
        insightType: "follow-up",
        title: "Recommend bureau follow-up",
        description: "Commission a bureau-level explainer on enforcement capacity and regional gaps.",
        score: 0.88,
      },
    ],
  });

  await prisma.translationJob.create({
    data: {
      articleId: article.id,
      sourceLanguage: LanguageCode.ENGLISH,
      targetLanguage: LanguageCode.FRENCH,
      status: AIJobStatus.COMPLETED,
      translatedTitle: "Les alliances mondiales de puces redessinent la concurrence autour de l'infrastructure de l'IA",
      translatedExcerpt: "Les gouvernements et les plateformes hyperscale redessinent la stratégie des semi-conducteurs autour de l'energie et des chaines d'approvisionnement.",
      translatedBody: "Les gouvernements et les plateformes hyperscale se deplacent vers des alliances d'infrastructure explicites.",
      completedAt: new Date(),
    },
  });

  await prisma.syndicationFeed.deleteMany({ where: { partnerId: globalPartner.id } });
  await prisma.syndicationFeed.create({
    data: {
      partnerId: globalPartner.id,
      slug: "reuters-global-en",
      title: "Reuters Global English Feed",
      format: DistributionFormat.API,
      isPublic: false,
      regions: [GlobalRegion.AMERICAS, GlobalRegion.EUROPE],
      languages: [LanguageCode.ENGLISH],
    },
  });

  await prisma.syndicationLicense.deleteMany();
  await prisma.syndicationLicense.create({
    data: {
      articleId: article.id,
      partnerId: globalPartner.id,
      terms: "Regional syndication for enterprise partner distribution and licensing tests.",
      status: SyndicationStatus.ACTIVE,
      startsAt: new Date(),
      endsAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.videoChannel.upsert({
    where: { slug: "global-press-tv" },
    update: {
      name: "Global Press TV",
      description: "Featured broadcasts, live coverage, and scheduled programs.",
      featured: true,
    },
    create: {
      slug: "global-press-tv",
      name: "Global Press TV",
      description: "Featured broadcasts, live coverage, and scheduled programs.",
      featured: true,
    },
  });

  await prisma.videoProgram.upsert({
    where: { slug: "global-markets-live" },
    update: {
      title: "Global Markets Live",
      description: "Daily live market coverage and interview segments.",
      status: VideoPublicationStatus.LIVE,
      scheduledFor: new Date(Date.now() + 30 * 60 * 1000),
      publishedAt: new Date(),
      durationSec: 1800,
      liveUrl: "https://globalpress.network/video/global-markets-live",
    },
    create: {
      slug: "global-markets-live",
      title: "Global Markets Live",
      description: "Daily live market coverage and interview segments.",
      status: VideoPublicationStatus.LIVE,
      scheduledFor: new Date(Date.now() + 30 * 60 * 1000),
      publishedAt: new Date(),
      durationSec: 1800,
      liveUrl: "https://globalpress.network/video/global-markets-live",
    },
  });

  await prisma.podcastShow.upsert({
    where: { slug: "global-press-daily" },
    update: {
      title: "Global Press Daily",
      description: "Briefings and explainers from the newsroom.",
      coverUrl: "https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=1200&q=80",
      status: PodcastPublicationStatus.PUBLISHED,
    },
    create: {
      slug: "global-press-daily",
      title: "Global Press Daily",
      description: "Briefings and explainers from the newsroom.",
      coverUrl: "https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=1200&q=80",
      status: PodcastPublicationStatus.PUBLISHED,
    },
  });

  await prisma.podcastEpisode.upsert({
    where: { slug: "markets-ai-and-energy" },
    update: {
      title: "Markets, AI, and energy",
      description: "A briefing on how infrastructure constraints are shaping the AI race.",
      audioUrl: "https://globalpress.network/podcasts/markets-ai-and-energy.mp3",
      videoUrl: "https://globalpress.network/podcasts/markets-ai-and-energy.mp4",
      durationSec: 2100,
      status: PodcastPublicationStatus.PUBLISHED,
      publishedAt: new Date(),
    },
    create: {
      slug: "markets-ai-and-energy",
      title: "Markets, AI, and energy",
      description: "A briefing on how infrastructure constraints are shaping the AI race.",
      audioUrl: "https://globalpress.network/podcasts/markets-ai-and-energy.mp3",
      videoUrl: "https://globalpress.network/podcasts/markets-ai-and-energy.mp4",
      durationSec: 2100,
      status: PodcastPublicationStatus.PUBLISHED,
      publishedAt: new Date(),
    },
  });

  await prisma.adPlacement.upsert({
    where: { name: "Homepage masthead" },
    update: {
      page: "/",
      size: "970x250",
      isActive: true,
    },
    create: {
      name: "Homepage masthead",
      page: "/",
      size: "970x250",
      isActive: true,
    },
  });

  await prisma.advertiser.upsert({
    where: { slug: "global-press-partners" },
    update: {
      name: "Global Press Partners",
      contactEmail: "ads@globalpress.network",
      website: "https://globalpress.network/advertise",
    },
    create: {
      slug: "global-press-partners",
      name: "Global Press Partners",
      contactEmail: "ads@globalpress.network",
      website: "https://globalpress.network/advertise",
    },
  });

  const advertiser = await prisma.advertiser.findUniqueOrThrow({ where: { slug: "global-press-partners" } });

  await prisma.adCampaign.upsert({
    where: { id: "seed-enterprise-campaign" },
    update: {
      advertiserId: advertiser.id,
      title: "Enterprise newsroom launch",
      status: AdCampaignStatus.ACTIVE,
      startsAt: new Date(),
      endsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      budget: new Prisma.Decimal("45000"),
      impressions: 145000,
      clicks: 3200,
    },
    create: {
      id: "seed-enterprise-campaign",
      advertiserId: advertiser.id,
      title: "Enterprise newsroom launch",
      status: AdCampaignStatus.ACTIVE,
      startsAt: new Date(),
      endsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      budget: new Prisma.Decimal("45000"),
      impressions: 145000,
      clicks: 3200,
    },
  });

  await prisma.marketplaceListing.upsert({
    where: { slug: "sponsored-investigations-package" },
    update: {
      title: "Sponsored investigations package",
      type: MarketplaceListingType.SPONSORED_REPORT,
      status: MarketplaceListingStatus.ACTIVE,
      description: "Premium sponsored report placement with editorial review gates.",
      price: new Prisma.Decimal("12000"),
      currency: "USD",
      authorId: userByRole.get(Role.EDITOR_IN_CHIEF)!.id,
      articleId: article.id,
    },
    create: {
      slug: "sponsored-investigations-package",
      title: "Sponsored investigations package",
      type: MarketplaceListingType.SPONSORED_REPORT,
      status: MarketplaceListingStatus.ACTIVE,
      description: "Premium sponsored report placement with editorial review gates.",
      price: new Prisma.Decimal("12000"),
      currency: "USD",
      authorId: userByRole.get(Role.EDITOR_IN_CHIEF)!.id,
      articleId: article.id,
    },
  });

  await prisma.dataProject.upsert({
    where: { slug: "global-ai-infrastructure-index" },
    update: {
      title: "Global AI infrastructure index",
      type: DataVisualizationType.DASHBOARD,
      status: DataProjectStatus.PUBLISHED,
      description: "Interactive tracking of AI infrastructure, power, and supply chain constraints.",
      sourceUrl: "https://globalpress.network/data/ai-infrastructure",
      publishedAt: new Date(),
    },
    create: {
      slug: "global-ai-infrastructure-index",
      title: "Global AI infrastructure index",
      type: DataVisualizationType.DASHBOARD,
      status: DataProjectStatus.PUBLISHED,
      description: "Interactive tracking of AI infrastructure, power, and supply chain constraints.",
      sourceUrl: "https://globalpress.network/data/ai-infrastructure",
      publishedAt: new Date(),
    },
  });

  const dataProject = await prisma.dataProject.findUniqueOrThrow({
    where: { slug: "global-ai-infrastructure-index" },
  });

  await prisma.dataVisualization.deleteMany({ where: { projectId: dataProject.id } });
  await prisma.dataVisualization.createMany({
    data: [
      {
        projectId: dataProject.id,
        title: "Power demand trend",
        chartType: DataVisualizationType.CHART,
        config: { type: "line", series: ["power", "capacity"] },
        sortOrder: 1,
      },
      {
        projectId: dataProject.id,
        title: "Regional buildout",
        chartType: DataVisualizationType.MAP,
        config: { type: "choropleth", metric: "capacity" },
        sortOrder: 2,
      },
    ],
  });

  await prisma.bureau.upsert({
    where: { slug: "nairobi-bureau" },
    update: {
      country: "Kenya",
      city: "Nairobi",
      region: GlobalRegion.AFRICA,
      leadEditorId: userByRole.get(Role.MANAGING_EDITOR)!.id,
      active: true,
    },
    create: {
      slug: "nairobi-bureau",
      country: "Kenya",
      city: "Nairobi",
      region: GlobalRegion.AFRICA,
      leadEditorId: userByRole.get(Role.MANAGING_EDITOR)!.id,
      active: true,
    },
  });

  const bureau = await prisma.bureau.findUniqueOrThrow({ where: { slug: "nairobi-bureau" } });
  await prisma.bureauAssignment.deleteMany({ where: { bureauId: bureau.id } });
  await prisma.bureauAssignment.create({
    data: {
      bureauId: bureau.id,
      userId: userByRole.get(Role.JOURNALIST)!.id,
      title: "Cover the AI supply chain desk",
      description: "Track bureaus, suppliers, and energy constraints feeding the infrastructure story.",
      dueAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
      status: "IN_PROGRESS",
    },
  });

  await prisma.crisisEvent.upsert({
    where: { slug: "global-chip-shortage-alert" },
    update: {
      title: "Global chip shortage alert",
      severity: CrisisSeverity.ACTIVE,
      status: CrisisStatus.ACTIVE,
      description: "High-priority coverage coordination for semiconductor supply chain pressure.",
    },
    create: {
      slug: "global-chip-shortage-alert",
      title: "Global chip shortage alert",
      severity: CrisisSeverity.ACTIVE,
      status: CrisisStatus.ACTIVE,
      description: "High-priority coverage coordination for semiconductor supply chain pressure.",
    },
  });

  const crisis = await prisma.crisisEvent.findUniqueOrThrow({
    where: { slug: "global-chip-shortage-alert" },
  });
  await prisma.crisisUpdate.deleteMany({ where: { crisisEventId: crisis.id } });
  await prisma.crisisUpdate.create({
    data: {
      crisisEventId: crisis.id,
      articleId: article.id,
      title: "Editors pin a verification update",
      body: "Verification notes now point to customs records and alternate supplier confirmations.",
      isPinned: true,
    },
  });

  await prisma.platformHealthSnapshot.deleteMany();
  await prisma.platformHealthSnapshot.createMany({
    data: [
      {
        region: DeploymentRegion.US_EAST,
        status: HealthStatus.OK,
        apiLatencyMs: 82,
        errorRate: 0.2,
        queueDepth: 14,
        audienceRequests: 54000,
        revenueCents: 124000,
      },
      {
        region: DeploymentRegion.EUROPE,
        status: HealthStatus.DEGRADED,
        apiLatencyMs: 154,
        errorRate: 1.1,
        queueDepth: 32,
        audienceRequests: 39000,
        revenueCents: 88000,
      },
    ],
  });

  await prisma.disasterRecoveryPlan.upsert({
    where: { id: "seed-global-dr-plan" },
    update: {
      name: "Global newsroom failover plan",
      rpoMinutes: 15,
      rtoMinutes: 30,
      description: "Cross-region restore plan for publishing, auth, and media services.",
    },
    create: {
      id: "seed-global-dr-plan",
      name: "Global newsroom failover plan",
      rpoMinutes: 15,
      rtoMinutes: 30,
      description: "Cross-region restore plan for publishing, auth, and media services.",
    },
  });

  await prisma.siteSetting.upsert({
    where: { key: "site_identity" },
    update: {
      value: {
        name: "VANTERENPRESS",
        slogan: "International reporting with sharper context, cleaner signal, and premium editorial discipline.",
        footerCopy: "VANTERENPRESS delivers breaking news, business intelligence, technology coverage, and global reporting with a publication-grade newsroom workflow.",
        logoUrl: "/vanterenpress-broadcast-logo.png",
        faviconUrl: "/favicon.ico",
        supportEmail: "support@vanterenpress.com",
        socialLinks: [
          "X: https://x.com/vanterenpress",
          "LinkedIn: https://linkedin.com/company/vanterenpress",
          "YouTube: https://youtube.com/@vanterenpress",
        ],
      },
    },
    create: {
      key: "site_identity",
      value: {
        name: "VANTERENPRESS",
        slogan: "International reporting with sharper context, cleaner signal, and premium editorial discipline.",
        footerCopy: "VANTERENPRESS delivers breaking news, business intelligence, technology coverage, and global reporting with a publication-grade newsroom workflow.",
        logoUrl: "/vanterenpress-broadcast-logo.png",
        faviconUrl: "/favicon.ico",
        supportEmail: "support@vanterenpress.com",
        socialLinks: [
          "X: https://x.com/vanterenpress",
          "LinkedIn: https://linkedin.com/company/vanterenpress",
          "YouTube: https://youtube.com/@vanterenpress",
        ],
      },
    },
  });

  await prisma.siteSetting.upsert({
    where: { key: "homepage_layout" },
    update: {
      value: {
        heroLayout: "breaking-led",
        sections: ["breaking", "top-stories", "video", "opinion", "most-read"],
      },
    },
    create: {
      key: "homepage_layout",
      value: {
        heroLayout: "breaking-led",
        sections: ["breaking", "top-stories", "video", "opinion", "most-read"],
      },
    },
  });

  await prisma.siteSetting.upsert({
    where: { key: "theme" },
    update: {
      value: {
        mode: "system",
        homepageStyle: "breaking-led",
        typography: "editorial",
        accent: "#b42318",
        background: "#f8f5ef",
        foreground: "#0f1728",
      },
    },
    create: {
      key: "theme",
      value: {
        mode: "system",
        homepageStyle: "breaking-led",
        typography: "editorial",
        accent: "#b42318",
        background: "#f8f5ef",
        foreground: "#0f1728",
      },
    },
  });

  await prisma.siteSetting.upsert({
    where: { key: "breaking_news" },
    update: {
      value: {
        enabled: true,
        headline: "Live global coverage",
      },
    },
    create: {
      key: "breaking_news",
      value: {
        enabled: true,
        headline: "Live global coverage",
      },
    },
  });

  await prisma.siteSetting.upsert({
    where: { key: "paywall" },
    update: {
      value: {
        freeArticleLimit: 5,
        warning: "You have reached your free article limit this month.",
        premiumLabel: "Premium",
      },
    },
    create: {
      key: "paywall",
      value: {
        freeArticleLimit: 5,
        warning: "You have reached your free article limit this month.",
        premiumLabel: "Premium",
      },
    },
  });

  await prisma.siteSetting.upsert({
    where: { key: "ads" },
    update: {
      value: {
        placements: ["homepage-masthead", "sidebar", "in-article"],
      },
    },
    create: {
      key: "ads",
      value: {
        placements: ["homepage-masthead", "sidebar", "in-article"],
      },
    },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
