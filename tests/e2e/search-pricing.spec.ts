import { expect, test } from "@playwright/test";

test.setTimeout(60_000);

test("search and pricing pages stay available", async ({ page }) => {
  await page.goto("/search?q=AI");
  await expect(page.getByRole("heading", { name: /Search VANTERENPRESS/i })).toBeVisible();

  await page.goto("/pricing");
  await expect(page.getByRole("heading", { name: /Support premium global journalism/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /Subscribe/i }).first()).toBeVisible();

  await page.goto("/advertise");
  await expect(page.getByRole("heading", { name: /Media kit and advertiser dashboard/i })).toBeVisible();

  await page.goto("/advertise/press-release");
  await expect(page.getByRole("heading", { name: /Submit a press release/i })).toBeVisible();
});
