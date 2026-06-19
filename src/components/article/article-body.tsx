import { Quote } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

type ArticleBodyNode =
  | { type: "paragraph"; text?: string }
  | { type: "heading"; level?: number; text?: string }
  | { type: "blockquote"; text?: string }
  | { type: "bulletList"; items?: string[] }
  | { type: "table"; headers?: string[]; rows?: string[][] }
  | { type: "embed"; url?: string; caption?: string }
  | { type: "callout"; title?: string; text?: string }
  | { type: "related"; title?: string; links?: { href: string; label: string }[] }
  | { type: "citation"; sourceName?: string; sourceUrl?: string; quote?: string };

function normalizeBody(body: unknown): ArticleBodyNode[] {
  if (!body || typeof body !== "object") {
    return [{ type: "paragraph", text: String(body ?? "") }];
  }

  const maybeDoc = body as { content?: Array<Record<string, unknown>> };
  if (!Array.isArray(maybeDoc.content)) {
    return [{ type: "paragraph", text: JSON.stringify(body) }];
  }

  return maybeDoc.content.map((item) => {
    void (typeof item.type === "string" ? item.type : "paragraph");
    return item as unknown as ArticleBodyNode & { type: string };
  });
}

export function ArticleBody({ body }: { body: unknown }) {
  const nodes = normalizeBody(body);

  return (
    <div className="prose max-w-none">
      {nodes.map((node, index) => {
        if (node.type === "heading") {
          const Heading = node.level && node.level > 2 ? "h3" : "h2";
          return <Heading key={index}>{node.text}</Heading>;
        }

        if (node.type === "blockquote") {
          return (
            <blockquote key={index} className="rounded-[24px] border-l-4 border-[var(--accent)] bg-[var(--muted)] px-6 py-5 not-italic">
              <div className="mb-3 flex items-center gap-2 text-[var(--accent)]">
                <Quote className="h-4 w-4" />
                Key quote
              </div>
              <p>{node.text}</p>
            </blockquote>
          );
        }

        if (node.type === "bulletList") {
          return (
            <ul key={index} className="space-y-2">
              {node.items?.map((item) => <li key={item}>{item}</li>)}
            </ul>
          );
        }

        if (node.type === "table") {
          return (
            <div key={index} className="overflow-x-auto">
              <table className="w-full border-collapse rounded-[24px] border border-[var(--border)] text-sm">
                <thead className="bg-[var(--muted)]">
                  <tr>
                    {node.headers?.map((header) => (
                      <th key={header} className="border-b border-[var(--border)] px-4 py-3 text-left">{header}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {node.rows?.map((row, rowIndex) => (
                    <tr key={`${rowIndex}-${row.join("-")}`}>
                      {row.map((cell) => (
                        <td key={cell} className="border-t border-[var(--border)] px-4 py-3">{cell}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        }

        if (node.type === "embed") {
          return (
            <Card key={index} className="overflow-hidden">
              <CardContent className="p-6">
                <div className="mb-2 text-xs uppercase tracking-[0.2em] text-[var(--accent)]">Embed</div>
                <a href={node.url} target="_blank" rel="noreferrer" className="font-medium underline underline-offset-4">
                  {node.url}
                </a>
                {node.caption ? <p className="mt-3 text-sm text-[var(--muted-foreground)]">{node.caption}</p> : null}
              </CardContent>
            </Card>
          );
        }

        if (node.type === "callout") {
          return (
            <Card key={index} className="border-[var(--accent)]">
              <CardContent className="p-6">
                <Badge>Callout</Badge>
                <h3 className="mt-4 font-serif text-2xl">{node.title}</h3>
                <p className="mt-2">{node.text}</p>
              </CardContent>
            </Card>
          );
        }

        if (node.type === "related") {
          return (
            <Card key={index}>
              <CardContent className="p-6">
                <div className="mb-4 text-xs uppercase tracking-[0.2em] text-[var(--accent)]">{node.title ?? "Related Coverage"}</div>
                <div className="space-y-3">
                  {node.links?.map((link) => (
                    <a key={link.href} href={link.href} className="block font-medium underline-offset-4 hover:underline">
                      {link.label}
                    </a>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        }

        if (node.type === "citation") {
          return (
            <Card key={index}>
              <CardContent className="p-6">
                <div className="mb-2 text-xs uppercase tracking-[0.2em] text-[var(--accent)]">Citation</div>
                <div className="font-medium">{node.sourceName}</div>
                {node.quote ? <p className="mt-2 text-sm text-[var(--muted-foreground)]">{node.quote}</p> : null}
                {node.sourceUrl ? (
                  <a href={node.sourceUrl} target="_blank" rel="noreferrer" className="mt-2 block text-sm underline underline-offset-4">
                    {node.sourceUrl}
                  </a>
                ) : null}
              </CardContent>
            </Card>
          );
        }

        return <p key={index}>{node.text}</p>;
      })}
    </div>
  );
}
