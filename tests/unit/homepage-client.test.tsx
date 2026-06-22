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
  default: ({ alt, src, ...props }: React.ImgHTMLAttributes<HTMLImageElement> & { src: string; alt: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt={alt} src={src} {...props} />
  ),
}));

vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => <div {...props}>{children}</div>,
  },
}));

function buildHomepageResponse(): HomepageNewsApiResponse {
  const bundle = getSeedHomepageBundle();

  return {
    bundle: {
      ...bundle,
      heroStory: {
        ...bundle.heroStory,
        id: "hero-1",
        slug: "hero-one",
        title: "Hero story one",
        summary: "Hero summary one.",
        featuredImageUrl: "/news/world/world1.jpg",
        href: "/articles/hero-one",
      },
      topStories: [
        {
          ...bundle.topStories[0]!,
          id: "hero-2",
          slug: "hero-two",
          title: "Hero story two",
          summary: "Hero summary two.",
          featuredImageUrl: "/news/world/world2.jpg",
          href: "/articles/hero-two",
        },
        {
          ...bundle.topStories[1]!,
          id: "hero-3",
          slug: "hero-three",
          title: "Hero story three",
          summary: "Hero summary three.",
          featuredImageUrl: "/news/world/world3.jpg",
          href: "/articles/hero-three",
        },
        ...bundle.topStories.slice(2),
      ],
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
  it("switches slides with arrows and dots and keeps story links aligned", async () => {
    const user = userEvent.setup();

    render(
      <HomepageClient
        initialNewsResponse={buildHomepageResponse()}
        refreshIntervalMinutes={0}
        personalized={null}
      />,
    );

    expect(screen.getByRole("heading", { name: "Hero story one" })).toBeVisible();
    expect(screen.getByRole("link", { name: "Read Full Story" })).toHaveAttribute("href", "/articles/hero-one");

    await user.click(screen.getByRole("button", { name: "Next hero story" }));

    expect(screen.getByRole("heading", { name: "Hero story two" })).toBeVisible();
    expect(screen.getByRole("link", { name: "Read Full Story" })).toHaveAttribute("href", "/articles/hero-two");

    await user.click(screen.getByRole("button", { name: "Go to hero story 3" }));

    expect(screen.getByRole("heading", { name: "Hero story three" })).toBeVisible();
    expect(screen.getByRole("link", { name: "Read Full Story" })).toHaveAttribute("href", "/articles/hero-three");
  });
});
