"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="mx-auto flex min-h-[60vh] max-w-3xl flex-col items-center justify-center px-4 text-center">
      <div className="rounded-full border border-[var(--border)] px-4 py-2 text-xs uppercase tracking-[0.22em] text-[var(--muted-foreground)]">
        Newsroom recovery
      </div>
      <h1 className="mt-5 font-serif text-4xl">Something went wrong</h1>
      <p className="mt-4 text-sm leading-7 text-[var(--muted-foreground)]">
        The request could not be completed. Try again, then check API logs, Redis, and database connectivity if the problem persists.
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <Button onClick={reset}>Retry</Button>
        <Button asChild variant="outline">
          <Link href="/latest">Open latest coverage</Link>
        </Button>
      </div>
    </main>
  );
}
