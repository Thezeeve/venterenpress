const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL
  ?? "https://vanterenpress.org";

export const siteConfig = {
  name: process.env.SITE_NAME ?? "VANTERENPRESS",
  description:
    "An international newsroom delivering breaking news, markets, politics, technology, and live global coverage.",
  url: siteUrl.replace(/\/$/, ""),
  nav: [
    "World",
    "Politics",
    "Business",
    "Technology",
    "Crypto",
    "Opinion",
  ],
  editions: [
    "United States",
    "United Kingdom",
    "Canada",
    "Europe",
    "Africa",
    "Asia",
    "Middle East",
    "Latin America",
  ],
};
