import fs from "node:fs";
import path from "node:path";
import { expect, test } from "@playwright/test";

function getReferencedNewsAssets() {
  const sourceRoot = path.join(process.cwd(), "src");
  const refs = new Set<string>();

  const walk = (dir: string) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
        continue;
      }

      if (!/\.(ts|tsx|js|jsx)$/i.test(entry.name)) {
        continue;
      }

      const text = fs.readFileSync(fullPath, "utf8");
      for (const match of text.matchAll(/["'`](\/news\/[A-Za-z0-9_./-]+)["'`]/g)) {
        const ref = match[1];
        if (ref && !ref.endsWith("/")) {
          refs.add(ref);
        }
      }
    }
  };

  walk(sourceRoot);
  return [...refs].sort();
}

test("curated newsroom images load directly and through the Next optimizer", async ({ page, request }) => {
  for (const asset of getReferencedNewsAssets()) {
    const direct = await request.get(asset);
    expect(direct.ok(), `${asset} should load directly`).toBe(true);
    expect(direct.headers()["content-type"] ?? "").toMatch(/^image\//);

    const optimized = await request.get(`/_next/image?url=${encodeURIComponent(asset)}&w=1200&q=75`);
    expect(optimized.ok(), `${asset} should load through next/image`).toBe(true);
    expect(optimized.headers()["content-type"] ?? "").toMatch(/^image\//);
  }

  await page.goto("/articles/spacex-ipo-speculation-grows-as-private-market-demand-accelerates");
  await expect(page.locator('meta[property="og:image"]')).toHaveCount(1);

  const opengraphImage = await request.get("/opengraph-image");
  expect(opengraphImage.ok(), "opengraph-image route should return an image").toBe(true);
  expect(opengraphImage.headers()["content-type"] ?? "").toMatch(/^image\//);
});
