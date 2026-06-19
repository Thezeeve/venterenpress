import { expect, test } from "@playwright/test";

test("article page renders newsroom trust surfaces", async ({ page }) => {
  await page.goto("/articles/spacex-ipo-speculation-grows-as-private-market-demand-accelerates");

  await expect(page.getByRole("heading", { level: 1, name: /SpaceX IPO Speculation Grows as Private Market Demand Accelerates/i })).toBeVisible();
  await expect(page.getByText("This page is an internal preview of a syndicated or RSS-fed story. VANTERENPRESS is showing the headline, metadata, and excerpt only.")).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Preview policy" })).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Why this story matters" })).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Source transparency" })).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Correction history" })).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Share cards" })).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Author" })).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Reader discussion" })).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Trending Now" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Related Stories" })).toBeVisible();
  const relatedSection = page.locator("section").filter({ has: page.getByRole("heading", { name: "Related Stories" }) });
  await expect(relatedSection.getByRole("link")).toHaveCount(3);
  await expect(relatedSection.getByRole("link", { name: /SpaceX IPO Speculation Grows as Private Market Demand Accelerates/i })).toHaveCount(0);
  await expect(page.getByText(/Published/i).first()).toBeVisible();
  await expect(page.getByText(/min read/i)).toBeVisible();
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", /\/articles\/spacex-ipo-speculation-grows-as-private-market-demand-accelerates$/);
  await expect(page.locator('meta[property="og:title"]')).toHaveAttribute("content", /SpaceX IPO Speculation/i);
  await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute("content", "summary_large_image");
  const schemaText = await page.locator('script[type="application/ld+json"]').evaluateAll((nodes) =>
    nodes.map((node) => node.textContent ?? "").join(" "),
  );
  expect(schemaText).toContain("NewsArticle");
  expect(schemaText).toContain("BreadcrumbList");
});
