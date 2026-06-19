import { expect, test } from "@playwright/test";

test.setTimeout(60_000);

test("protected subscription and admin routes redirect to login", async ({ page }) => {
  await page.goto("/account/subscription");
  await expect(page).toHaveURL(/\/login/);

  await page.goto("/dashboard/admin/settings");
  await expect(page).toHaveURL(/\/login/);

  await page.goto("/admin/articles/new");
  await expect(page).toHaveURL(/\/login/);

  await page.goto("/account/notifications");
  await expect(page).toHaveURL(/\/login/);

  await page.goto("/account/settings");
  await expect(page).toHaveURL(/\/login/);
});
