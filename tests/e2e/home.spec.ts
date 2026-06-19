import { test, expect } from "@playwright/test";
import { siteConfig } from "@/lib/site";

test("homepage renders premium newsroom shell", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("banner").getByRole("link", { name: new RegExp(siteConfig.name, "i") })).toBeVisible();
  await expect(page.getByRole("img", { name: /VANTERENPRESS logo/i })).toBeVisible();
  await expect(page.getByText("Executive dashboard")).toHaveCount(0);
  await expect(page.getByRole("banner").getByRole("link", { name: "Subscribe" })).toBeVisible();
  await expect(page.getByRole("banner").getByRole("link", { name: "Subscribe" })).toHaveCSS("min-width", "144px");
  await expect(page.getByText("Follow Us")).toHaveCount(0);
  const trendingSection = page.locator("section").filter({ has: page.getByRole("heading", { name: "Trending Now" }) });
  const newsletterSection = page.locator("section").filter({ has: page.getByRole("heading", { name: "Stay Ahead of the Headlines" }) });
  await expect(page.getByRole("heading", { name: "Trending Now" })).toBeVisible();
  await expect(trendingSection.getByRole("link")).toHaveCount(5);
  await expect(page.getByRole("heading", { name: "Stay Ahead of the Headlines" })).toBeVisible();
  await newsletterSection.getByLabel("Email address").fill("reader+home@vanterenpress.test");
  await newsletterSection.getByRole("button", { name: "Subscribe" }).click();
  await expect(newsletterSection.getByText(/signed up|request received|briefing access/i)).toBeVisible();
  await expect(page.locator('link[rel="icon"]').first()).toHaveAttribute("href", /favicon/i);
});

test("homepage does not repeat story images across cards", async ({ page }) => {
  await page.goto("/");

  const imageSources = await page.locator("main img").evaluateAll((images) =>
    images
      .map((image) => image.getAttribute("src"))
      .filter((src): src is string => Boolean(src) && !src.includes("vanterenpress") && !src.includes("vp-logo")),
  );

  const duplicates = imageSources.filter((src, index) => imageSources.indexOf(src) !== index);
  expect(duplicates).toEqual([]);
});
