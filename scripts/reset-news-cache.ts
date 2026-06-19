import "dotenv/config";

import { prisma } from "@/lib/prisma";
import { HOMEPAGE_NEWS_STATE_KEY, resetHomepageNewsInMemoryCache } from "@/lib/news-providers";

async function main() {
  resetHomepageNewsInMemoryCache();

  try {
    const result = await prisma.siteSetting.deleteMany({
      where: { key: HOMEPAGE_NEWS_STATE_KEY },
    });

    console.log(`[news:reset] cleared persisted homepage snapshot rows: ${result.count}`);
  } catch (error) {
    console.error("[news:reset] failed to clear persisted homepage snapshot", error);
  } finally {
    await prisma.$disconnect().catch(() => undefined);
  }

  console.log("[news:reset] cleared in-memory homepage cache for this process");
}

void main();
