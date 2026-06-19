const namedEntities: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
  mdash: "—",
  ndash: "–",
  hellip: "...",
  rsquo: "’",
  lsquo: "‘",
  rdquo: "”",
  ldquo: "“",
};

function decodeEntity(entity: string) {
  if (entity.startsWith("#x") || entity.startsWith("#X")) {
    const codePoint = Number.parseInt(entity.slice(2), 16);
    return Number.isFinite(codePoint) ? String.fromCodePoint(codePoint) : `&${entity};`;
  }

  if (entity.startsWith("#")) {
    const codePoint = Number.parseInt(entity.slice(1), 10);
    return Number.isFinite(codePoint) ? String.fromCodePoint(codePoint) : `&${entity};`;
  }

  return namedEntities[entity] ?? `&${entity};`;
}

export function cleanNewsText(input: string | null | undefined) {
  if (!input) {
    return "";
  }

  return input
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/<[^>]*>/g, " ")
    .replace(/&([a-zA-Z]+|#\d+|#x[0-9a-fA-F]+);/g, (_, entity: string) => decodeEntity(entity))
    .replace(/&#0?39;|&#x27;|&apos;/gi, "'")
    .replace(/&#0?8217;|&#x2019;|&rsquo;/gi, "’")
    .replace(/&#0?8216;|&#x2018;|&lsquo;/gi, "‘")
    .replace(/&#0?8220;|&#x201c;|&ldquo;/gi, "“")
    .replace(/&#0?8221;|&#x201d;|&rdquo;/gi, "”")
    .replace(/&#0?38;|&amp;/gi, "&")
    .replace(/\\u2019/gi, "’")
    .replace(/\\u2018/gi, "‘")
    .replace(/\\u201c/gi, "“")
    .replace(/\\u201d/gi, "”")
    .replace(/\\u0026/gi, "&")
    .replace(/\\'/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

export function cleanNewsContent(input: Array<string | null | undefined>) {
  return input
    .map((entry) => cleanNewsText(entry))
    .filter(Boolean);
}
