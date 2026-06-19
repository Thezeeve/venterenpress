export const kpis = [
  { label: "Monthly Readers", value: "34.8M", delta: "+12.4%" },
  { label: "Stories Published", value: "4,280", delta: "+8.1%" },
  { label: "Subscriber Growth", value: "18.3%", delta: "+3.9%" },
  { label: "Avg. Read Depth", value: "72%", delta: "+6.5%" },
];

export const trafficSeries = [
  { day: "Mon", readers: 410000, subscribers: 12000 },
  { day: "Tue", readers: 460000, subscribers: 15400 },
  { day: "Wed", readers: 520000, subscribers: 17500 },
  { day: "Thu", readers: 610000, subscribers: 19800 },
  { day: "Fri", readers: 720000, subscribers: 22500 },
  { day: "Sat", readers: 650000, subscribers: 20400 },
  { day: "Sun", readers: 800000, subscribers: 24100 },
];

export const topStories = [
  {
    title: "Global chip alliances reshape AI infrastructure competition",
    section: "Artificial Intelligence",
    region: "United States",
    minutes: "5 min read",
  },
  {
    title: "Central banks coordinate on cross-border payments resilience",
    section: "Finance",
    region: "Europe",
    minutes: "7 min read",
  },
  {
    title: "Extreme heat adaptation plans redraw city budgets worldwide",
    section: "Environment",
    region: "Africa",
    minutes: "4 min read",
  },
];

export const newsroomAssignments = [
  {
    title: "Election integrity explainer package",
    owner: "Amina Yusuf",
    deadline: "Today, 18:00",
    status: "Fact Check",
  },
  {
    title: "Q3 sovereign debt visual story",
    owner: "Daniel Ross",
    deadline: "Tomorrow, 10:00",
    status: "Editing",
  },
  {
    title: "Semiconductor supply chain podcast",
    owner: "Mei Chen",
    deadline: "Jun 18",
    status: "Assigned",
  },
];

export const homepageBlocks = {
  breaking: {
    kicker: "Breaking News",
    headline: `${process.env.SITE_NAME ?? "VANTERENPRESS"} launches a distributed newsroom stack for high-volume international coverage`,
    summary:
      "A modern publishing pipeline pairs editorial rigor, multilingual delivery, and real-time analytics across eight editions.",
  },
  trending: [
    "Markets brace for coordinated rate signals",
    "Inside the AI model energy race",
    "How journalists verify conflict footage",
    "The new geography of critical minerals",
  ],
  latest: [
    "Live updates: G20 summit negotiations enter final round",
    "Investigation: illicit shipping routes evade sanctions controls",
    "Podcast briefing: what premium news subscribers actually pay for",
    "Analysis: the next battleground in cloud regulation",
  ],
};

