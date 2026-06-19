import { expect, test } from "@playwright/test";

test.setTimeout(90_000);

test("seeded admin can log in and access editor routes", async ({ page }) => {
  await page.goto("/login");

  const signInCard = page.getByRole("heading", { name: "Sign in" }).locator("..").locator("..");
  await signInCard.getByPlaceholder("Email", { exact: true }).fill("admin@vanterenpress.com");
  await signInCard.getByPlaceholder("Password").fill("Chukwuemeka2019$");
  await signInCard.getByRole("button", { name: "Continue with email" }).click();

  await page.waitForURL("**/dashboard", { timeout: 30_000 });
  await expect(page).toHaveURL(/\/dashboard$/);

  await page.goto("/dashboard/editor");
  await expect(page.getByRole("heading", { name: /editorial dashboard/i })).toBeVisible();

  await page.goto("/admin/articles/new");
  await expect(page.getByRole("heading", { name: /new article/i })).toBeVisible();

  const uniqueSlug = `seeded-admin-${Date.now()}`;
  await page.getByPlaceholder("Article headline").fill("Seeded admin workflow verification article");
  await page.getByPlaceholder("Slug").fill(uniqueSlug);
  await page.getByPlaceholder("Excerpt").fill("This seeded admin validation draft confirms protected editorial publishing access works correctly.");
  await page.locator(".tiptap").fill("This is a seeded admin validation article body with enough content to satisfy the editor workflow.");
  await page.getByPlaceholder("Categories, comma separated").fill("technology");

  await page.getByRole("button", { name: "Save Draft" }).click();
  await expect(page.getByText("Draft saved successfully.")).toBeVisible({ timeout: 30_000 });

  await page.getByRole("button", { name: "Publish" }).click();
  await expect(page.getByText("Article published successfully.")).toBeVisible({ timeout: 30_000 });
  await expect(page.getByRole("link", { name: "View published article" })).toHaveAttribute("href", `/articles/${uniqueSlug}`);
});
