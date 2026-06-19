"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export function AiWorkbench({
  researchSessions,
  insights,
}: {
  researchSessions: {
    id: string;
    topic: string;
    status: string;
    verificationScore: number;
    contradictionCount: number;
    notes: string | null;
  }[];
  insights: {
    id: string;
    insightType: string;
    title: string;
    description: string;
    score: number;
  }[];
}) {
  const [topic, setTopic] = useState("AI infrastructure");
  const [prompt, setPrompt] = useState("Investigate recent regulatory shifts and supply chain impacts.");
  const [result, setResult] = useState<string>("");

  async function runResearch() {
    const response = await fetch("/api/rest/ai/research", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ topic, prompt }),
    });
    const payload = (await response.json()) as { data: { result?: { suggestedSources?: { title: string }[] } } };
    setResult(JSON.stringify(payload.data, null, 2));
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>AI Research Assistant</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input value={topic} onChange={(event) => setTopic(event.target.value)} placeholder="Topic" />
          <Textarea value={prompt} onChange={(event) => setPrompt(event.target.value)} className="min-h-[120px]" />
          <div className="flex flex-wrap gap-3">
            <Button onClick={runResearch}>Run research</Button>
            <Button
              variant="outline"
              onClick={async () => {
                const response = await fetch("/api/rest/ai/writing", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ title: topic, excerpt: prompt, body: prompt, targetLanguage: "FRENCH" }),
                });
                const payload = await response.json();
                setResult(JSON.stringify(payload.data, null, 2));
              }}
            >
              Writing assist
            </Button>
            <Button
              variant="outline"
              onClick={async () => {
                const response = await fetch("/api/rest/ai/intelligence");
                const payload = await response.json();
                setResult(JSON.stringify(payload.data, null, 2));
              }}
            >
              Content intelligence
            </Button>
          </div>
          {result ? <pre className="overflow-auto rounded-[24px] bg-[var(--muted)] p-4 text-xs">{result}</pre> : null}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Research sessions</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {researchSessions.map((session) => (
              <div key={session.id} className="rounded-2xl border border-[var(--border)] p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="font-medium">{session.topic}</div>
                  <Badge variant="neutral">{session.status}</Badge>
                </div>
                <div className="mt-2 text-sm text-[var(--muted-foreground)]">
                  Score {session.verificationScore} | {session.contradictionCount} contradictions
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Trending intelligence</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {insights.map((insight) => (
              <div key={insight.id} className="rounded-2xl bg-[var(--muted)] p-4">
                <div className="font-medium">{insight.title}</div>
                <div className="text-sm text-[var(--muted-foreground)]">{insight.description}</div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
