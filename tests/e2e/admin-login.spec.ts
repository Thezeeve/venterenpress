import { expect, test } from "@playwright/test";

test.setTimeout(90_000);

test("seeded admin can log in and save an isolated draft safely", async ({ page, context, baseURL }) => {
  test.skip(
    process.env.E2E_ALLOW_EDITOR_MUTATIONS !== "true",
    "Mutating editor QA is disabled by default. Only enable this against isolated local or staging data.",
  );

  const origin = new URL(baseURL ?? "http://127.0.0.1:3000").origin;
  let articleId: string | null = null;

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

  const uniqueSlug = `qa-temp-${Date.now()}`;
  await page.getByPlaceholder("Article headline").fill("Seeded admin workflow verification article");
  await page.getByPlaceholder("Slug").fill(uniqueSlug);
  await page.getByPlaceholder("Excerpt").fill("This seeded admin validation draft confirms protected editorial publishing access works correctly.");
  await page.locator(".tiptap").fill("This is a seeded admin validation article body with enough content to satisfy the editor workflow.");
  await page.getByPlaceholder("Categories, comma separated").fill("technology");

  try {
    const createResponsePromise = page.waitForResponse((response) =>
      response.url().includes("/api/rest/articles") && response.request().method() === "POST",
    );

    await page.getByRole("button", { name: "Save Draft" }).click();
    await expect(page.getByText("Draft saved successfully.")).toBeVisible({ timeout: 30_000 });

    const createResponse = await createResponsePromise;
    const payload = await createResponse.json();
    articleId = payload?.data?.id ?? null;

    expect(articleId).toBeTruthy();
    await expect(page).toHaveURL(/\/admin\/articles\/[^/]+$/);
  } finally {
    if (articleId) {
      const cleanupResponse = await context.request.delete(`${origin}/api/rest/articles/${articleId}`, {
        headers: {
          origin,
          referer: `${origin}/admin/articles/${articleId}`,
        },
      });

      expect(cleanupResponse.ok()).toBeTruthy();
    }
  }
});
