import { expect, test } from "@playwright/test";

test.setTimeout(60_000);

test("newsroom navigation exposes discovery routes", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("banner").getByRole("link", { name: "Subscribe" })).toBeVisible();
  await expect(page.getByRole("banner").getByRole("link", { name: "Search" })).toBeVisible();
  await expect(page.getByRole("banner").getByRole("link", { name: "Home" })).toBeVisible();
  await expect(page.getByRole("banner").getByRole("link", { name: "World" })).toHaveCount(0);
  await expect(page.getByRole("banner").getByRole("link", { name: "Business" })).toHaveCount(0);
  await expect(page.getByRole("banner").getByRole("link", { name: "Technology" })).toBeVisible();
  await expect(page.getByRole("banner").getByRole("link", { name: "Finance" })).toBeVisible();
  await expect(page.getByRole("banner").getByRole("link", { name: "Sports" })).toBeVisible();
  await expect(page.getByRole("banner").getByRole("link", { name: "Entertainment" })).toBeVisible();
  await expect(page.getByRole("banner").getByRole("link", { name: "Opinion" })).toBeVisible();
  await expect(page.getByRole("banner").getByRole("link", { name: "Politics" })).toHaveCount(0);
  await expect(page.getByRole("banner").getByText("Explore")).toHaveCount(0);
  await expect(page.getByRole("banner").getByText("Editions")).toHaveCount(0);
  await expect(page.getByRole("banner").getByText("Live TV")).toHaveCount(0);
  await expect(page.getByRole("banner").getByText("Sign In")).toHaveCount(0);

  await page.goto("/finance");
  await expect(page.getByRole("heading", { name: "Finance" })).toBeVisible();
  await expect(page.getByText("No stories available in this section yet.")).toHaveCount(0);
  await expect(page.getByRole("main").getByRole("link").first()).toBeVisible();

  await page.goto("/topics/politics");
  await expect(page.getByRole("heading", { name: "Politics" })).toBeVisible();
  await expect(page.getByText("No stories available in this section yet.")).toBeVisible();

  await page.goto("/latest");
  await expect(page.getByRole("heading", { name: "The latest global reporting" })).toBeVisible();

  await page.goto("/most-read");
  await expect(page.getByRole("heading", { name: "Stories readers are returning to" })).toBeVisible();

  await page.goto("/topics");
  await expect(page.getByRole("heading", { name: "Editorial topic pages" })).toBeVisible();

  await page.goto("/regions");
  await expect(page.getByRole("heading", { name: "Regional editions" })).toBeVisible();

  await page.goto("/rss");
  await expect(page.getByRole("heading", { name: "Newsroom feeds" })).toBeVisible();
});
