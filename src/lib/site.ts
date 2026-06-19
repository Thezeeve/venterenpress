export const siteConfig = {
  name: process.env.SITE_NAME ?? "VANTERENPRESS",
  description:
    "An international newsroom delivering breaking news, markets, politics, technology, and live global coverage.",
  url: process.env.APP_URL ?? "https://vanterenpress.com",
  nav: [
    "World",
    "Politics",
    "Business",
    "Technology",
    "Artificial Intelligence",
    "Crypto",
    "Entertainment",
    "Health",
    "Sports",
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
