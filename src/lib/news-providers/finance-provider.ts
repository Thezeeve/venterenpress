import { slugify } from "@/lib/utils";
import type { EditorialStory, NewsProvider, ProviderFetchResult } from "@/lib/news-providers/types";

type AlphaVantageQuote = {
  "Global Quote"?: {
    "05. price"?: string;
    "10. change percent"?: string;
  };
};

type FinnhubQuote = {
  c?: number;
  dp?: number;
};

type CoinGeckoPrice = Record<string, { usd?: number; usd_24h_change?: number }>;

function numberOrNull(value: unknown) {
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

export class FinanceNewsProvider implements NewsProvider {
  name = "finance";

  isConfigured() {
    return Boolean(
      process.env.ALPHA_VANTAGE_API_KEY ||
        process.env.FINNHUB_API_KEY ||
        process.env.COINGECKO_API_KEY,
    );
  }

  async fetchLatest(): Promise<ProviderFetchResult> {
    const alphaKey = process.env.ALPHA_VANTAGE_API_KEY;
    const finnhubKey = process.env.FINNHUB_API_KEY;
    const coingeckoKey = process.env.COINGECKO_API_KEY;

    const [alpha, finnhub, coingecko] = await Promise.allSettled([
      alphaKey
        ? fetch(`https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=NVDA&apikey=${encodeURIComponent(alphaKey)}`, { next: { revalidate: 900 } }).then((res) => res.json() as Promise<AlphaVantageQuote>)
        : Promise.resolve(null),
      finnhubKey
        ? fetch(`https://finnhub.io/api/v1/quote?symbol=SPY&token=${encodeURIComponent(finnhubKey)}`, { next: { revalidate: 900 } }).then((res) => res.json() as Promise<FinnhubQuote>)
        : Promise.resolve(null),
      fetch("https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd&include_24hr_change=true", {
        headers: coingeckoKey ? { "x-cg-demo-api-key": coingeckoKey } : {},
        next: { revalidate: 900 },
      }).then((res) => (res.ok ? (res.json() as Promise<CoinGeckoPrice>) : Promise.resolve({} as CoinGeckoPrice))),
    ]);

    const stories: EditorialStory[] = [];
    const alphaData = alpha.status === "fulfilled" ? alpha.value : null;
    const finnhubData = finnhub.status === "fulfilled" ? finnhub.value : null;
    const bitcoin = coingecko.status === "fulfilled" ? coingecko.value?.bitcoin : null;

    const nvdaPrice = numberOrNull(alphaData?.["Global Quote"]?.["05. price"]);
    const nvdaChange = alphaData?.["Global Quote"]?.["10. change percent"] ?? null;
    if (nvdaPrice !== null) {
      const title = "Nvidia Market Expansion Draws Fresh Attention as AI Capital Spending Deepens";
      stories.push({
        id: `finance-${slugify(title)}`,
        title,
        slug: slugify(title),
        category: "Technology",
        edition: "United States",
        region: "Global",
        summary: `Nvidia shares were recently quoted near $${nvdaPrice.toFixed(2)}, reinforcing investor focus on how AI capital spending is spreading across the supply chain${nvdaChange ? ` with the stock showing ${nvdaChange}` : ""}.`,
        content: [`Live finance inputs indicate continued investor attention on Nvidia as a proxy for broader AI infrastructure demand.`],
        featuredImageUrl: null,
        featuredImageAlt: null,
        author: { name: "Alpha Vantage", role: "Market data source" },
        publishedAt: new Date().toISOString(),
        readingTimeMinutes: 3,
        tags: ["Nvidia", "AI", "Markets"],
        seoTitle: title,
        seoDescription: `Nvidia market data update from Alpha Vantage with pricing context for AI investment coverage.`,
        sourceName: "Alpha Vantage",
        sourceUrl: "https://www.alphavantage.co/documentation/",
        provider: "finance",
        href: "https://www.alphavantage.co/documentation/",
        isExternal: true,
      });
    }

    if (finnhubData?.c) {
      const title = "Global Markets React to Economic Data as Benchmark Equity Flows Stay Cautious";
      stories.push({
        id: `finance-${slugify(title)}`,
        title,
        slug: slugify(title),
        category: "Business",
        edition: "United States",
        region: "Americas",
        summary: `Market snapshot data showed benchmark equity pricing near ${finnhubData.c}${typeof finnhubData.dp === "number" ? `, with a daily move of ${finnhubData.dp.toFixed(2)}%` : ""}, underscoring a cautious response to new macro signals.`,
        content: [`Finnhub quote data is being used as a lightweight market pulse for homepage business coverage.`],
        featuredImageUrl: null,
        featuredImageAlt: null,
        author: { name: "Finnhub", role: "Market data source" },
        publishedAt: new Date().toISOString(),
        readingTimeMinutes: 3,
        tags: ["Markets", "Equities", "Macro"],
        seoTitle: title,
        seoDescription: "Benchmark market quote update generated from Finnhub free-tier data.",
        sourceName: "Finnhub",
        sourceUrl: "https://finnhub.io/docs/api",
        provider: "finance",
        href: "https://finnhub.io/docs/api",
        isExternal: true,
      });
    }

    if (bitcoin?.usd) {
      const title = "Crypto Traders Watch Bitcoin Pricing as Risk Appetite Stays Selective";
      stories.push({
        id: `finance-${slugify(title)}`,
        title,
        slug: slugify(title),
        category: "Business",
        edition: "United States",
        region: "Global",
        summary: `CoinGecko data showed Bitcoin near $${bitcoin.usd.toLocaleString()}${typeof bitcoin.usd_24h_change === "number" ? ` with a 24-hour move of ${bitcoin.usd_24h_change.toFixed(2)}%` : ""}, keeping digital assets tied to broader risk sentiment.`,
        content: [`CoinGecko pricing is being used to keep crypto and broader risk sentiment visible inside business coverage.`],
        featuredImageUrl: null,
        featuredImageAlt: null,
        author: { name: "CoinGecko", role: "Market data source" },
        publishedAt: new Date().toISOString(),
        readingTimeMinutes: 3,
        tags: ["Bitcoin", "Crypto", "Risk Appetite"],
        seoTitle: title,
        seoDescription: "Bitcoin pricing update generated from CoinGecko data for business coverage.",
        sourceName: "CoinGecko",
        sourceUrl: "https://docs.coingecko.com/reference/simple-price",
        provider: "finance",
        href: "https://docs.coingecko.com/reference/simple-price",
        isExternal: true,
      });
    }

    return { articles: stories };
  }
}
