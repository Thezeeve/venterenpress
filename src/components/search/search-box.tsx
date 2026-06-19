"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";

type Suggestion = {
  type: string;
  value: string;
  href: string;
};

export function SearchBox({
  defaultValue,
  name = "q",
}: {
  defaultValue?: string;
  name?: string;
}) {
  const [query, setQuery] = useState(defaultValue ?? "");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);

  useEffect(() => {
    if (!query.trim()) {
      setSuggestions([]);
      return;
    }

    const timeout = window.setTimeout(async () => {
      const response = await fetch(`/api/rest/search/suggestions?q=${encodeURIComponent(query)}`);
      if (!response.ok) {
        return;
      }

      const payload = (await response.json()) as { data: Suggestion[] };
      setSuggestions(payload.data.slice(0, 6));
    }, 200);

    return () => window.clearTimeout(timeout);
  }, [query]);

  return (
    <div className="relative">
      <Input name={name} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search stories, tags, authors" />
      {suggestions.length ? (
        <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-40 rounded-[24px] border border-[var(--border)] bg-[var(--panel)] p-3 shadow-[0_20px_50px_rgba(15,23,42,0.08)]">
          {suggestions.map((item) => (
            <Link key={`${item.type}-${item.href}`} href={item.href} className="block rounded-2xl px-3 py-2 text-sm hover:bg-[var(--muted)]">
              <span className="mr-2 text-xs uppercase tracking-[0.18em] text-[var(--accent)]">{item.type}</span>
              {item.value}
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
}
