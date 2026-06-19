import type { NewsroomArticleCard } from "@/lib/newsroom";
import { slugify } from "@/lib/utils";
import type { EditorialStory, HomepageNewsBundle } from "@/lib/news-providers/types";

const seedImage = {
  spacex: "/news/technology/business7.jpg",
  fifa: "/news/sports/fifa-world-cup-2026.png",
  spain: "/news/sports/spain-draw.png",
  brazilMorocco: "/news/sports/brazil-morocco.png",
  middleEastConflict: "/news/world/world5.jpg",
  middleEastRelief: "/news/world/world6.jpg",
  climate: "/news/world/world2.jpg",
  diplomacy: "/news/world/world3.jpg",
  markets: "/news/business/business4.jpg",
  energy: "/news/business/business5.jpg",
  centralBanks: "/news/business/business2.jpg",
} as const;

function buildStory(
  input: Omit<EditorialStory, "id" | "slug" | "href" | "seoTitle" | "seoDescription" | "provider"> & {
    slug?: string;
    href?: string;
    seoTitle?: string;
    seoDescription?: string;
    provider?: string;
  },
): EditorialStory {
  const slug = input.slug ?? slugify(input.title);

  return {
    ...input,
    id: slug,
    slug,
    href: input.href ?? `/articles/${slug}`,
    seoTitle: input.seoTitle ?? input.title,
    seoDescription: input.seoDescription ?? input.summary,
    provider: input.provider ?? "seed",
  };
}

export const seededEditorialStories: EditorialStory[] = [
  buildStory({
    title: "SpaceX IPO Speculation Grows as Private Market Demand Accelerates",
    category: "Business / Technology",
    desk: "Business",
    edition: "United States",
    region: "Americas",
    summary:
      "Investor interest in SpaceX continues to rise as analysts discuss future public-market possibilities, while the company expands Starship and satellite internet operations globally.",
    content: [
      "Private market demand for SpaceX stock has intensified again as investors search for scarce exposure to launch capacity, satellite connectivity, and a potentially transformative aerospace platform. Bankers and late-stage funds say the appetite for secondary shares remains strong even without a formal listing timeline.",
      "Analysts tracking the company say any future IPO would likely depend on progress across Starship testing, Starlink subscriber expansion, and the ability to show a clearer path from heavy infrastructure spending to sustained operating leverage. Those factors are increasingly central to how institutional investors frame the company against listed technology and industrial peers.",
      "For now, the absence of a filing has not cooled the debate. Market participants say the scale of demand itself has become a signal that public investors are preparing for a future window in which SpaceX could emerge as one of the most closely watched listings in global markets.",
    ],
    featuredImageUrl: seedImage.spacex,
    featuredImageAlt: "SpaceX branding behind Elon Musk at a podium",
    author: { name: "Amina Yusuf", role: "Business correspondent" },
    publishedAt: "2026-06-17T05:45:00.000Z",
    readingTimeMinutes: 6,
    tags: ["SpaceX", "IPO", "Private Markets", "Starlink", "Starship"],
    sourceName: "VANTERENPRESS",
    sourceUrl: null,
    isBreaking: true,
    isMostRead: true,
  }),
  buildStory({
    title: "FIFA World Cup 2026 Preparations Intensify Across Host Cities",
    category: "Sports",
    desk: "Sports",
    edition: "United States",
    region: "Americas",
    summary:
      "Organizers across North America are accelerating transport upgrades, venue operations, and fan-planning measures as countdown pressure builds ahead of the 2026 tournament.",
    content: [
      "Host-city planning teams say the focus has shifted from broad tournament strategy into detailed readiness checks around transport, security, crowd flow, and venue servicing. Officials are stress-testing how stadium districts, airports, and rail corridors will handle the expected visitor surge.",
      "Infrastructure readiness remains uneven, with some cities moving faster on mobility upgrades and public-space activation than others. Organizers say the next phase will center on operational drills, inter-agency coordination, and contingency planning for fan movement and severe weather scenarios.",
      "Supporter expectations are also shaping the playbook. Ticketing reliability, public viewing areas, hotel supply, and multilingual information systems are all being treated as core measures of tournament execution rather than secondary extras.",
    ],
    featuredImageUrl: seedImage.fifa,
    featuredImageAlt: "FIFA World Cup 2026 branding graphic",
    author: { name: "Mei Chen", role: "Sports correspondent" },
    publishedAt: "2026-06-17T04:55:00.000Z",
    readingTimeMinutes: 4,
    tags: ["World Cup 2026", "Host Cities", "Infrastructure", "Tournament Planning"],
    sourceName: "VANTERENPRESS",
    sourceUrl: null,
    isMostRead: true,
  }),
  buildStory({
    title: "Spain Held to Draw in Opening World Cup Campaign",
    category: "Sports",
    desk: "Sports",
    edition: "Europe",
    region: "Europe",
    summary:
      "Spain opened its World Cup campaign with a frustrating draw, leaving questions over finishing, midfield control, and the group's early balance of power.",
    content: [
      "Spain controlled long stretches of the match but failed to convert territorial dominance into the level of separation expected from a pre-tournament contender. Their build-up remained polished, yet the final pass and finishing edge were inconsistent when the game tightened.",
      "Coaches and analysts focused on whether Spain's midfield rhythm became too predictable against a compact defensive block. Supporters leaving the stadium pointed to missed openings and a late drop in urgency as the main reasons the team could not secure maximum points.",
      "The result leaves the group open and increases the pressure on Spain's next fixture. Goal difference and momentum may matter quickly in a campaign where even one unexpected draw can reshape the knockout path.",
    ],
    featuredImageUrl: seedImage.spain,
    featuredImageAlt: "Spain player walking off the pitch during World Cup action",
    author: { name: "Daniel Ross", role: "Tournament analyst" },
    publishedAt: "2026-06-17T03:40:00.000Z",
    readingTimeMinutes: 4,
    tags: ["Spain", "World Cup", "Group Stage", "Supporters"],
    sourceName: "VANTERENPRESS",
    sourceUrl: null,
    isMostRead: true,
  }),
  buildStory({
    title: "Brazil and Morocco Share Points in Competitive World Cup Clash",
    category: "Sports",
    desk: "Sports",
    edition: "Latin America",
    region: "Global",
    summary:
      "Brazil and Morocco matched each other in intensity and transitions, producing a draw that carries tactical lessons and wider tournament implications.",
    content: [
      "Brazil produced the brighter attacking sequences in open play, but Morocco repeatedly interrupted rhythm with disciplined spacing and aggressive counter-pressure. The match swung between technical control and transitional chaos, leaving both benches with plenty to study.",
      "Player performances in midfield and wide defensive areas shaped much of the tactical story. Brazil showed flashes of superior invention, while Morocco's structure and physical commitment kept the contest level deep into the decisive phases.",
      "The draw preserves knockout hopes for both sides while intensifying scrutiny on rotation, recovery, and in-game adaptability. Supporters from both camps came away with the sense that neither team has shown its full ceiling yet.",
    ],
    featuredImageUrl: seedImage.brazilMorocco,
    featuredImageAlt: "Brazil players celebrating during a World Cup match",
    author: { name: "Mei Chen", role: "Sports correspondent" },
    publishedAt: "2026-06-17T02:50:00.000Z",
    readingTimeMinutes: 5,
    tags: ["Brazil", "Morocco", "World Cup", "Match Analysis"],
    sourceName: "VANTERENPRESS",
    sourceUrl: null,
    isMostRead: true,
  }),
  buildStory({
    title: "Middle East Ceasefire Talks Face Fragile Test as Mediators Press for Compliance",
    category: "World",
    desk: "World",
    edition: "Middle East",
    region: "Middle East",
    summary:
      "Diplomats and regional mediators are working to preserve a tentative ceasefire as verification demands and humanitarian access remain under intense scrutiny.",
    content: [
      "Officials involved in the talks say the immediate focus is on enforcement language, monitoring access, and the sequencing of aid deliveries into heavily affected areas. Mediators are trying to prevent isolated violations from collapsing the wider framework before verification mechanisms are fully in place.",
      "Humanitarian agencies continue to press for guaranteed access corridors, arguing that public commitments alone will not ease pressure on hospitals, shelters, and food distribution chains. Relief groups say the next several days will determine whether the arrangement produces measurable gains for civilians.",
      "Negotiators caution that the framework remains fragile. Yet diplomats also say the current round represents a more serious attempt to align security guarantees, humanitarian access, and regional political pressure in the same track.",
    ],
    featuredImageUrl: seedImage.middleEastConflict,
    featuredImageAlt: "Damaged city street during Middle East ceasefire reporting",
    author: { name: "Leila Haddad", role: "World affairs editor" },
    publishedAt: "2026-06-17T05:10:00.000Z",
    readingTimeMinutes: 5,
    tags: ["Middle East", "Ceasefire", "Diplomacy", "Humanitarian Response"],
    sourceName: "VANTERENPRESS",
    sourceUrl: null,
    isBreaking: true,
    isLive: true,
  }),
  buildStory({
    title: "UN Humanitarian Agencies Expand Relief Push as Civilian Needs Climb",
    category: "World",
    desk: "World",
    edition: "Middle East",
    region: "Middle East",
    summary:
      "The UN and partner agencies are widening relief operations, warning that shelter, medical care, and clean water remain critically short in several corridors.",
    content: [
      "UN coordinators say relief operations are widening, but the scale of civilian need still exceeds available capacity in several distribution corridors. Logistics teams are contending with damaged transport routes, inspection delays, and the difficulty of sustaining regular access to the hardest-hit areas.",
      "Medical kits, water systems, and temporary shelter remain the top priorities as displacement pressures rise. Humanitarian officials say the combination of urban damage and limited warehousing has made supply-chain continuity almost as important as the volume of aid itself.",
      "Partner agencies are urging governments and negotiators to treat access arrangements as operational necessities, not rhetorical signals. Without sustained corridor stability, relief planners say gains could reverse quickly.",
    ],
    featuredImageUrl: seedImage.middleEastRelief,
    featuredImageAlt: "Damaged city and humanitarian response coverage",
    author: { name: "Leila Haddad", role: "World affairs editor" },
    publishedAt: "2026-06-17T04:15:00.000Z",
    readingTimeMinutes: 4,
    tags: ["UN", "Humanitarian", "Relief", "Middle East"],
    sourceName: "VANTERENPRESS",
    sourceUrl: null,
    isLive: true,
  }),
  buildStory({
    title: "Climate Emergencies Stretch Governments as Heat, Flooding and Fire Risks Collide",
    category: "World",
    desk: "Climate",
    edition: "Africa",
    region: "Global",
    summary:
      "Governments across multiple regions are confronting a compound climate emergency as infrastructure resilience and emergency planning face simultaneous tests.",
    content: [
      "Emergency authorities across several regions are responding to a compound set of climate pressures that include extreme heat, flood exposure, and wildfire risk. Officials say the overlap is placing unusual stress on transport networks, health systems, and grid reliability at the same time.",
      "The strain is accelerating discussions around urban cooling, insurance exposure, evacuation readiness, and the cost of deferred resilience investment. Policymakers increasingly argue that seasonal crisis planning is no longer enough for the scale of recurring disruption.",
      "Climate specialists say the current pattern is forcing governments to redefine preparedness not just as an environmental issue, but as a national infrastructure and economic stability challenge.",
    ],
    featuredImageUrl: seedImage.climate,
    featuredImageAlt: "Global markets chart on trading screens",
    author: { name: "Mei Chen", role: "Climate reporter" },
    publishedAt: "2026-06-17T03:55:00.000Z",
    readingTimeMinutes: 5,
    tags: ["Climate", "Emergency", "Heat", "Flooding", "Wildfire"],
    sourceName: "VANTERENPRESS",
    sourceUrl: null,
  }),
  buildStory({
    title: "Diplomats Seek Broader Security Accord as Maritime Tensions Return to the Agenda",
    category: "World",
    desk: "Diplomacy",
    edition: "Europe",
    region: "Europe",
    summary:
      "International negotiators are pressing for a wider diplomatic framework as shipping security and regional deterrence once again dominate summit discussions.",
    content: [
      "European and Gulf officials say current talks are focused on de-escalation channels, shipping assurances, and mechanisms to reduce the risk of miscalculation along key maritime routes. The talks reflect wider concern that commercial stability cannot rest on ad hoc crisis management alone.",
      "Diplomats argue that insurance costs, energy flows, and trade reliability are now directly tied to whether regional security dialogue can produce more durable safeguards. That commercial pressure is helping sustain engagement even where political trust remains limited.",
      "Officials caution against expecting a sudden breakthrough, but say the current discussions are meaningful because they reconnect diplomacy, trade, and deterrence inside one negotiating frame.",
    ],
    featuredImageUrl: seedImage.diplomacy,
    featuredImageAlt: "AI processor chip on a circuit board",
    author: { name: "Daniel Ross", role: "Diplomacy correspondent" },
    publishedAt: "2026-06-17T02:25:00.000Z",
    readingTimeMinutes: 4,
    tags: ["Diplomacy", "Security", "Maritime", "Europe"],
    sourceName: "VANTERENPRESS",
    sourceUrl: null,
  }),
  buildStory({
    title: "Global Markets React to Economic Data as Traders Reprice Growth Expectations",
    category: "Business",
    desk: "Markets",
    edition: "United States",
    region: "Americas",
    summary:
      "Equity, bond, and currency markets swung through a cautious session as investors reassessed growth signals, inflation progress, and the timing of policy easing.",
    content: [
      "Market participants described a cautious session as investors weighed fresh economic data against still-fragile confidence in the global growth backdrop. Price action across rates, equities, and major currencies reflected a market trying to reconcile resilient headline activity with softer underlying demand signals.",
      "Portfolio managers say the key question remains whether central banks can move toward easing without reviving inflation concerns or misreading labor-market resilience. That uncertainty kept directional conviction low even as sector leadership shifted repeatedly through the session.",
      "The broader takeaway for investors is that macro sensitivity remains high. Guidance from policymakers, commodity moves, and the next round of company outlooks are all likely to influence whether recent market optimism can hold.",
    ],
    featuredImageUrl: seedImage.markets,
    featuredImageAlt: "Editorial image of AI infrastructure and data center systems",
    author: { name: "Amina Yusuf", role: "Business correspondent" },
    publishedAt: "2026-06-17T04:35:00.000Z",
    readingTimeMinutes: 5,
    tags: ["Markets", "Economic Data", "Equities", "Rates"],
    sourceName: "VANTERENPRESS",
    sourceUrl: null,
    isMostRead: true,
  }),
  buildStory({
    title: "Oil Prices Fluctuate Amid Uncertainty Over Supply Routes and Demand Outlook",
    category: "Business",
    desk: "Energy",
    edition: "Middle East",
    region: "Global",
    summary:
      "Crude benchmarks traded unevenly as investors balanced geopolitical shipping risks against questions about demand durability across major importing economies.",
    content: [
      "Oil markets traded unevenly as investors tried to balance transport-security concerns with a less certain demand outlook from major importing economies. Traders said intraday moves were being driven as much by shipping risk headlines as by any durable change in underlying fundamentals.",
      "Refinery demand signals, potential exporter adjustments, and freight-route reliability remain the main variables shaping short-term sentiment. Analysts say that combination has left the market prone to sharp swings without a strong medium-term consensus.",
      "Energy pricing is once again feeding directly into inflation expectations and monetary-policy debate, giving crude volatility broader significance well beyond the commodity complex itself.",
    ],
    featuredImageUrl: seedImage.energy,
    featuredImageAlt: "Modern newsroom used for editorial opinion coverage",
    author: { name: "Leila Haddad", role: "Energy correspondent" },
    publishedAt: "2026-06-17T03:15:00.000Z",
    readingTimeMinutes: 4,
    tags: ["Oil", "Energy", "Volatility", "Supply Routes"],
    sourceName: "VANTERENPRESS",
    sourceUrl: null,
    isMostRead: true,
  }),
  buildStory({
    title: "Central Banks Signal Patience as Inflation Progress Remains Uneven",
    category: "Business",
    desk: "Economy",
    edition: "United Kingdom",
    region: "Europe",
    summary:
      "Policymakers are keeping a cautious tone on rates, signaling that confidence in disinflation is improving but not yet secure across major economies.",
    content: [
      "Central-bank officials are increasingly signaling patience rather than urgency, arguing that inflation progress is encouraging but not broad enough to justify aggressive policy shifts. Services pricing, wage pressure, and shipping-related cost risks remain central to their caution.",
      "Markets have responded by trimming expectations for rapid easing while still looking for a gradual path toward lower rates later in the cycle. The message from policymakers has been consistent: the direction of travel may be improving, but confidence is not yet complete.",
      "That stance is keeping attention fixed on labor data, energy prices, and core services inflation, all of which could influence the pace of future moves.",
    ],
    featuredImageUrl: seedImage.centralBanks,
    featuredImageAlt: "Editorial desk and newsroom screens",
    author: { name: "Daniel Ross", role: "Economics editor" },
    publishedAt: "2026-06-17T01:55:00.000Z",
    readingTimeMinutes: 4,
    tags: ["Central Banks", "Inflation", "Rates", "Policy"],
    sourceName: "VANTERENPRESS",
    sourceUrl: null,
  }),
  buildStory({
    title: "AI Investment Accelerates as Infrastructure Spending Spreads Beyond Model Labs",
    category: "Technology",
    desk: "Technology",
    edition: "United States",
    region: "Global",
    summary:
      "Capital is moving deeper into data centers, networking, power agreements, and enterprise deployment tools as the AI buildout broadens across the sector.",
    content: [
      "Investors say the AI cycle is moving beyond fascination with frontier models toward the broader infrastructure stack required to deploy and monetize them at scale. Capital is flowing into data centers, high-speed networking, enterprise software layers, and power agreements that can support sustained inference workloads.",
      "That shift is expanding the set of winners. Chipmakers remain central, but investors are increasingly tracking grid-linked developers, cooling specialists, server manufacturers, and software firms that help large organizations operationalize AI in production environments.",
      "Executives across the sector argue that the next phase of competition will be shaped as much by systems integration and energy access as by raw model performance.",
    ],
    featuredImageUrl: null,
    featuredImageAlt: null,
    author: { name: "Amina Yusuf", role: "Technology correspondent" },
    publishedAt: "2026-06-17T04:05:00.000Z",
    readingTimeMinutes: 5,
    tags: ["AI", "Investment", "Data Centers", "Enterprise Software"],
    sourceName: "VANTERENPRESS",
    sourceUrl: null,
    isMostRead: true,
  }),
  buildStory({
    title: "Nvidia Expansion Reshapes Supplier Timelines and Data Center Planning",
    category: "Technology",
    desk: "Technology",
    edition: "United States",
    region: "Americas",
    summary:
      "Nvidia's continued expansion is rippling across server makers, power suppliers, networking vendors, and global capital spending plans.",
    content: [
      "Nvidia's expansion continues to ripple through the supply chain as server makers, networking vendors, utilities, and hyperscale customers adjust plans around sustained accelerator demand. Hardware partners say order visibility has improved, even if power availability and lead times remain constraints.",
      "Enterprise buyers are also recalibrating procurement cycles to account for faster refresh expectations and the broader software ecosystems forming around each generation of AI infrastructure. That is reshaping how data-center projects are financed and phased.",
      "For the wider market, Nvidia's trajectory has become shorthand for a larger question: how quickly can AI infrastructure scale in operational terms, not just in theory.",
    ],
    featuredImageUrl: null,
    featuredImageAlt: null,
    author: { name: "Amina Yusuf", role: "Technology correspondent" },
    publishedAt: "2026-06-17T02:20:00.000Z",
    readingTimeMinutes: 4,
    tags: ["Nvidia", "AI Chips", "Supply Chain", "Data Centers"],
    sourceName: "VANTERENPRESS",
    sourceUrl: null,
  }),
  buildStory({
    title: "Cybersecurity Teams Track Fresh Infrastructure Threats Across Enterprise Networks",
    category: "Technology",
    desk: "Cybersecurity",
    edition: "Europe",
    region: "Global",
    summary:
      "Security teams are escalating monitoring after a new wave of intrusion activity targeted enterprise credentials, cloud services, and critical support vendors.",
    content: [
      "Incident responders say a fresh wave of intrusion activity is targeting enterprise credentials, cloud management layers, and service-chain relationships rather than relying on a single technical exploit. The pattern is forcing security teams to widen monitoring beyond traditional perimeter assumptions.",
      "Operators in logistics, finance, and public-sector contracting say the concern is not only the sophistication of the techniques, but the breadth of sectors being probed at the same time. That is pushing identity controls and third-party risk back to the top of security budgets.",
      "Analysts expect the latest incidents to sustain board-level attention on cyber resilience, vendor concentration, and the operational consequences of cloud dependency.",
    ],
    featuredImageUrl: null,
    featuredImageAlt: null,
    author: { name: "Daniel Ross", role: "Cybersecurity reporter" },
    publishedAt: "2026-06-17T01:35:00.000Z",
    readingTimeMinutes: 4,
    tags: ["Cybersecurity", "Infrastructure", "Cloud", "Enterprise Networks"],
    sourceName: "VANTERENPRESS",
    sourceUrl: null,
  }),
  buildStory({
    title: "Technology Infrastructure Investment Picks Up as Utilities Court Data Center Demand",
    category: "Technology",
    desk: "Infrastructure",
    edition: "Canada",
    region: "Americas",
    summary:
      "Utilities, developers, and cloud operators are accelerating power and land discussions as data-center demand redraws infrastructure priorities.",
    content: [
      "Utilities, developers, and cloud operators are accelerating negotiations over power capacity, land access, and transmission upgrades as data-center demand rises. What was once treated as a niche site-selection issue is now central to the technology growth story.",
      "Executives say the competition for reliable energy and favorable permitting is becoming as strategic as chip procurement. Investors increasingly view grid constraints, local policy, and long-term capacity contracts as core variables in platform expansion.",
      "The result is a tighter alignment between industrial policy, infrastructure finance, and the digital economy than the sector had seen in earlier growth cycles.",
    ],
    featuredImageUrl: null,
    featuredImageAlt: null,
    author: { name: "Mei Chen", role: "Infrastructure reporter" },
    publishedAt: "2026-06-17T00:55:00.000Z",
    readingTimeMinutes: 4,
    tags: ["Infrastructure", "Data Centers", "Utilities", "Investment"],
    sourceName: "VANTERENPRESS",
    sourceUrl: null,
  }),
  buildStory({
    title: "Middle East Live Updates: Aid Access, Ceasefire Monitoring and Regional Diplomacy",
    category: "Live Coverage",
    desk: "Live",
    edition: "Middle East",
    region: "Middle East",
    summary:
      "Follow the latest reporting on ceasefire negotiations, humanitarian access, and diplomatic reaction as events continue to move through the day.",
    content: [
      "Editors are tracking mediator statements, access negotiations, military compliance signals, and regional diplomatic reaction as developments move through the day.",
      "This live page brings together updates on humanitarian corridors, ceasefire monitoring, and the broader political calculations shaping whether the current framework holds.",
      "Readers should expect rapid updates as sourcing firms up and official positions evolve.",
    ],
    featuredImageUrl: null,
    featuredImageAlt: null,
    author: { name: "Leila Haddad", role: "Live editor" },
    publishedAt: "2026-06-17T05:25:00.000Z",
    readingTimeMinutes: 3,
    tags: ["Live Coverage", "Middle East", "Aid", "Diplomacy"],
    sourceName: "VANTERENPRESS",
    sourceUrl: null,
    isBreaking: true,
    isLive: true,
  }),
  buildStory({
    title: "Opinion: Global Investors Are Starting to Price AI Infrastructure as a Utility Story",
    category: "Opinion",
    desk: "Opinion",
    edition: "United Kingdom",
    region: "Europe",
    summary:
      "The next phase of the AI cycle may be less about model theater and more about which companies can secure power, cooling, and reliable deployment economics.",
    content: [
      "Much of the public conversation around AI still centers on headline model releases, but investors are increasingly paying attention to the less glamorous infrastructure beneath them. Power contracts, cooling, network capacity, and enterprise deployment are becoming the real chokepoints.",
      "That matters because infrastructure stories tend to be slower, more capital intensive, and more durable than consumer enthusiasm cycles. Companies that can lock in supply and execution are likely to shape the economics of the next phase of the industry.",
      "In that sense, AI is beginning to look less like a pure software race and more like a competition over industrial readiness.",
    ],
    featuredImageUrl: null,
    featuredImageAlt: null,
    author: { name: "Editor in Chief", role: "Opinion" },
    publishedAt: "2026-06-17T00:35:00.000Z",
    readingTimeMinutes: 4,
    tags: ["Opinion", "AI", "Infrastructure", "Markets"],
    sourceName: "VANTERENPRESS",
    sourceUrl: null,
    isOpinion: true,
  }),
  buildStory({
    title: "Opinion: Why Global News Homepages Still Need Editorial Judgment in a Live-Update Era",
    category: "Opinion",
    desk: "Opinion",
    edition: "United States",
    region: "Global",
    summary:
      "A strong front page is still defined by hierarchy, verification, and story framing, not just by the speed of incoming updates.",
    content: [
      "A modern news homepage does more than aggregate links. It establishes editorial hierarchy, signals urgency, and helps readers understand which developments deserve attention first.",
      "That matters even more in a live-update environment where information volume can easily outpace context. Readers do not only need the latest signal; they need a coherent presentation of why it matters.",
      "The global outlets that preserve trust are usually the ones that treat homepage editing as a discipline rather than a purely automated feed.",
    ],
    featuredImageUrl: null,
    featuredImageAlt: null,
    author: { name: "Editorial Board", role: "Opinion" },
    publishedAt: "2026-06-16T23:50:00.000Z",
    readingTimeMinutes: 4,
    tags: ["Opinion", "Editorial Standards", "Homepage Strategy"],
    sourceName: "VANTERENPRESS",
    sourceUrl: null,
    isOpinion: true,
  }),
];

export function getSeedStoryBySlug(slug: string) {
  return seededEditorialStories.find((story) => story.slug === slug) ?? null;
}

export function getSeedStoriesByCategory(category: string) {
  return seededEditorialStories.filter((story) => story.category.toLowerCase() === category.toLowerCase());
}

export function mapSeedStoryToNewsroomArticle(story: EditorialStory): NewsroomArticleCard {
  const categorySlug = slugify(story.category);
  return {
    id: `seed-${story.id}`,
    slug: story.slug,
    title: story.title,
    excerpt: story.summary,
    articleType: story.isOpinion ? "OPINION" : story.isLive ? "LIVE_BLOG" : "NEWS",
    accessTier: "FREE",
    readingTimeMinutes: story.readingTimeMinutes,
    publishedAt: new Date(story.publishedAt),
    edition: {
      id: `seed-edition-${slugify(story.edition)}`,
      name: story.edition,
      code: slugify(story.edition).replace(/-/g, "_").toUpperCase(),
      region: story.region,
    },
    author: {
      id: `seed-author-${slugify(story.author.name)}`,
      name: story.author.name,
      email: null,
      bio: `${story.author.role} covering ${story.category.toLowerCase()} developments.`,
      isVerifiedJournalist: true,
    },
    categories: [{
      category: {
        id: `seed-category-${categorySlug}`,
        slug: categorySlug,
        name: story.category,
      },
    }],
    tags: story.tags.map((tag) => ({
      tag: {
        id: `seed-tag-${slugify(tag)}`,
        slug: slugify(tag),
        name: tag,
      },
    })),
  };
}

export function getSeedLatestArticles() {
  return [
    getSeedStoryBySlug("spacex-ipo-speculation-grows-as-private-market-demand-accelerates"),
    getSeedStoryBySlug("middle-east-live-updates-aid-access-ceasefire-monitoring-and-regional-diplomacy"),
    getSeedStoryBySlug("middle-east-ceasefire-talks-face-fragile-test-as-mediators-press-for-compliance"),
    getSeedStoryBySlug("global-markets-react-to-economic-data-as-traders-reprice-growth-expectations"),
    getSeedStoryBySlug("ai-investment-accelerates-as-infrastructure-spending-spreads-beyond-model-labs"),
    getSeedStoryBySlug("fifa-world-cup-2026-preparations-intensify-across-host-cities"),
    getSeedStoryBySlug("spain-held-to-draw-in-opening-world-cup-campaign"),
    getSeedStoryBySlug("brazil-and-morocco-share-points-in-competitive-world-cup-clash"),
    getSeedStoryBySlug("oil-prices-fluctuate-amid-uncertainty-over-supply-routes-and-demand-outlook"),
    getSeedStoryBySlug("climate-emergencies-stretch-governments-as-heat-flooding-and-fire-risks-collide"),
    getSeedStoryBySlug("nvidia-expansion-reshapes-supplier-timelines-and-data-center-planning"),
    getSeedStoryBySlug("cybersecurity-teams-track-fresh-infrastructure-threats-across-enterprise-networks"),
  ].filter((story): story is EditorialStory => Boolean(story)).map(mapSeedStoryToNewsroomArticle);
}

export function getSeedMostReadArticles() {
  return seededEditorialStories
    .filter((story) => story.isMostRead)
    .slice(0, 8)
    .map(mapSeedStoryToNewsroomArticle);
}

export function getSeedLiveArticles() {
  return seededEditorialStories
    .filter((story) => story.isLive)
    .slice(0, 6)
    .map(mapSeedStoryToNewsroomArticle);
}

export function getSeedHomepageBundle(): HomepageNewsBundle {
  const heroStory = getSeedStoryBySlug("spacex-ipo-speculation-grows-as-private-market-demand-accelerates")!;
  const latestStories = [
    heroStory,
    getSeedStoryBySlug("fifa-world-cup-2026-preparations-intensify-across-host-cities")!,
    getSeedStoryBySlug("spain-held-to-draw-in-opening-world-cup-campaign")!,
    getSeedStoryBySlug("brazil-and-morocco-share-points-in-competitive-world-cup-clash")!,
    getSeedStoryBySlug("oil-prices-fluctuate-amid-uncertainty-over-supply-routes-and-demand-outlook")!,
    getSeedStoryBySlug("global-markets-react-to-economic-data-as-traders-reprice-growth-expectations")!,
    getSeedStoryBySlug("ai-investment-accelerates-as-infrastructure-spending-spreads-beyond-model-labs")!,
    getSeedStoryBySlug("middle-east-live-updates-aid-access-ceasefire-monitoring-and-regional-diplomacy")!,
  ];

  return {
    mode: "seed",
    breakingBanners: [
      {
        id: "breaking-1",
        title: "Middle East ceasefire talks enter a critical monitoring phase as aid access negotiations continue",
        summary: "Diplomats and humanitarian agencies are pressing for compliance, access corridors, and rapid civilian relief.",
        linkUrl: "/articles/middle-east-live-updates-aid-access-ceasefire-monitoring-and-regional-diplomacy",
      },
      {
        id: "breaking-2",
        title: "SpaceX IPO speculation grows as private market demand accelerates",
        summary: "Investor attention is returning to SpaceX as Starship and Starlink expansion sharpen public-market debate.",
        linkUrl: "/articles/spacex-ipo-speculation-grows-as-private-market-demand-accelerates",
      },
      {
        id: "breaking-3",
        title: "FIFA World Cup 2026 preparations intensify across host cities",
        summary: "Transport, venue readiness, and fan operations are moving into a more demanding phase.",
        linkUrl: "/articles/fifa-world-cup-2026-preparations-intensify-across-host-cities",
      },
    ],
    heroStory,
    latestSidebar: latestStories.map((story) => ({
      id: story.id,
      headline: story.title,
      category: story.category,
      publishedAt: story.publishedAt,
      href: story.href ?? `/articles/${story.slug}`,
      isExternal: story.isExternal,
    })),
    topStories: [
      heroStory,
      getSeedStoryBySlug("middle-east-ceasefire-talks-face-fragile-test-as-mediators-press-for-compliance")!,
      getSeedStoryBySlug("global-markets-react-to-economic-data-as-traders-reprice-growth-expectations")!,
      getSeedStoryBySlug("ai-investment-accelerates-as-infrastructure-spending-spreads-beyond-model-labs")!,
      getSeedStoryBySlug("fifa-world-cup-2026-preparations-intensify-across-host-cities")!,
      getSeedStoryBySlug("oil-prices-fluctuate-amid-uncertainty-over-supply-routes-and-demand-outlook")!,
    ],
    worldNews: [
      getSeedStoryBySlug("middle-east-ceasefire-talks-face-fragile-test-as-mediators-press-for-compliance")!,
      getSeedStoryBySlug("un-humanitarian-agencies-expand-relief-push-as-civilian-needs-climb")!,
      getSeedStoryBySlug("climate-emergencies-stretch-governments-as-heat-flooding-and-fire-risks-collide")!,
      getSeedStoryBySlug("diplomats-seek-broader-security-accord-as-maritime-tensions-return-to-the-agenda")!,
    ],
    businessNews: [
      getSeedStoryBySlug("global-markets-react-to-economic-data-as-traders-reprice-growth-expectations")!,
      getSeedStoryBySlug("oil-prices-fluctuate-amid-uncertainty-over-supply-routes-and-demand-outlook")!,
      getSeedStoryBySlug("central-banks-signal-patience-as-inflation-progress-remains-uneven")!,
      heroStory,
    ],
    technologyNews: [
      getSeedStoryBySlug("ai-investment-accelerates-as-infrastructure-spending-spreads-beyond-model-labs")!,
      getSeedStoryBySlug("nvidia-expansion-reshapes-supplier-timelines-and-data-center-planning")!,
      getSeedStoryBySlug("cybersecurity-teams-track-fresh-infrastructure-threats-across-enterprise-networks")!,
      getSeedStoryBySlug("technology-infrastructure-investment-picks-up-as-utilities-court-data-center-demand")!,
    ],
    sportsNews: [
      getSeedStoryBySlug("fifa-world-cup-2026-preparations-intensify-across-host-cities")!,
      getSeedStoryBySlug("spain-held-to-draw-in-opening-world-cup-campaign")!,
      getSeedStoryBySlug("brazil-and-morocco-share-points-in-competitive-world-cup-clash")!,
    ],
    liveCoverage: [
      getSeedStoryBySlug("middle-east-live-updates-aid-access-ceasefire-monitoring-and-regional-diplomacy")!,
      getSeedStoryBySlug("middle-east-ceasefire-talks-face-fragile-test-as-mediators-press-for-compliance")!,
      getSeedStoryBySlug("un-humanitarian-agencies-expand-relief-push-as-civilian-needs-climb")!,
    ],
    opinion: [
      getSeedStoryBySlug("opinion-global-investors-are-starting-to-price-ai-infrastructure-as-a-utility-story")!,
      getSeedStoryBySlug("opinion-why-global-news-homepages-still-need-editorial-judgment-in-a-live-update-era")!,
    ],
    mostRead: seededEditorialStories.filter((story) => story.isMostRead).slice(0, 6),
  };
}

