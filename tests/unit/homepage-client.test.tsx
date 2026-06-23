import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { HomepageClient } from "@/components/home/homepage-client";
import { getSeedHomepageBundle } from "@/lib/news-providers/seed-content";
import type { HomepageNewsApiResponse } from "@/lib/news-providers/types";

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

vi.mock("next/image", () => ({
  default: ({ alt, src }: React.ImgHTMLAttributes<HTMLImageElement> & { src: string; alt: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt={alt} src={src} />
  ),
}));

vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => <div {...props}>{children}</div>,
  },
}));

function buildHomepageResponse(): HomepageNewsApiResponse {
  const bundle = getSeedHomepageBundle();
  const heroStories = Array.from({ length: 7 }, (_, index) => ({
    ...bundle.topStories[index % bundle.topStories.length]!,
    id: `hero-${index + 2}`,
    slug: `saved-db-slug-${index + 2}`,
    title: `Hero story ${index + 2}`,
    summary: `Hero summary ${index + 2}.`,
    featuredImageUrl: `/news/world/world${(index % 3) + 1}.jpg`,
    href: `/articles/saved-db-slug-${index + 2}`,
    provider: "cms",
    storySourceType: "manual" as const,
  }));

  return {
    bundle: {
      ...bundle,
      heroStory: {
        ...bundle.heroStory,
        id: "live-hero",
        slug: "live-wire-headline",
        title: "Live wire headline",
        summary: "This should never render in the homepage hero slider.",
        featuredImageUrl: "/news/world/world1.jpg",
        href: "/articles/live-wire-headline",
        provider: "gnews",
        storySourceType: "live",
      },
      heroCarouselStories: [
        {
          ...bundle.heroStory,
          id: "hero-1",
          slug: "saved-db-slug-1",
          title: "Hero story one",
          summary: "Hero summary one.",
          featuredImageUrl: "/news/world/world1.jpg",
          href: "/articles/saved-db-slug-1",
          provider: "cms",
          storySourceType: "manual",
        },
        ...heroStories,
      ],
      topStories: bundle.topStories.map((story, index) => ({
        ...story,
        id: `live-top-${index + 1}`,
        slug: `live-top-slug-${index + 1}`,
        title: `Live top story ${index + 1}`,
        href: `/articles/live-top-slug-${index + 1}`,
        provider: "newsapi",
        storySourceType: "live",
      })),
    },
    lastUpdated: new Date("2026-06-22T09:00:00.000Z").toISOString(),
    source: "seed",
    providerStatus: {
      gnews: {
        name: "GNews",
        configured: false,
        status: "skipped",
        lastAttemptedAt: null,
        lastSuccessAt: null,
        lastError: null,
        articleCount: 0,
      },
      newsapi: {
        name: "NewsAPI",
        configured: false,
        status: "skipped",
        lastAttemptedAt: null,
        lastSuccessAt: null,
        lastError: null,
        articleCount: 0,
      },
    },
    status: {
      lastUpdated: new Date("2026-06-22T09:00:00.000Z").toISOString(),
      lastSuccessfulLiveRefresh: null,
      nextScheduledRefresh: null,
      providerErrors: [],
      activeNewsMode: "seed",
      refreshIntervalMinutes: 15,
      cacheTtlMinutes: 15,
    },
  };
}

describe("Homepage hero carousel", () => {
  it("switches slides with arrows and dots, keeps saved slugs, and supports 7 slides", async () => {
    const user = userEvent.setup();

    render(
      <HomepageClient
        initialNewsResponse={buildHomepageResponse()}
        refreshIntervalMinutes={0}
        personalized={null}
      />,
    );

    expect(screen.getByRole("heading", { name: "Hero story one" })).toBeVisible();
    expect(screen.getByRole("link", { name: "Read Full Story" })).toHaveAttribute("href", "/articles/saved-db-slug-1");
    expect(screen.getAllByRole("button", { name: /Go to hero story/i })).toHaveLength(7);
    expect(screen.queryByRole("heading", { name: "Live wire headline" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Next hero story" }));

    expect(screen.getByRole("heading", { name: "Hero story 2" })).toBeVisible();
    expect(screen.getByRole("link", { name: "Read Full Story" })).toHaveAttribute("href", "/articles/saved-db-slug-2");

    await user.click(screen.getByRole("button", { name: "Go to hero story 7" }));

    expect(screen.getByRole("heading", { name: "Hero story 7" })).toBeVisible();
    expect(screen.getByRole("link", { name: "Read Full Story" })).toHaveAttribute("href", "/articles/saved-db-slug-7");
  }, 15000);
});
