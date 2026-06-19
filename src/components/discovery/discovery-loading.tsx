import { Badge } from "@/components/ui/badge";

export function DiscoveryLoading({ label }: { label: string }) {
  return (
    <main className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
      <div className="animate-pulse space-y-6">
        <Badge>{label}</Badge>
        <div className="h-16 w-full max-w-4xl rounded-[28px] bg-[var(--muted)]" />
        <div className="grid gap-4 md:grid-cols-3">
          <div className="h-32 rounded-[28px] bg-[var(--muted)]" />
          <div className="h-32 rounded-[28px] bg-[var(--muted)]" />
          <div className="h-32 rounded-[28px] bg-[var(--muted)]" />
        </div>
        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <div className="space-y-4">
            <div className="h-36 rounded-[28px] bg-[var(--muted)]" />
            <div className="h-36 rounded-[28px] bg-[var(--muted)]" />
            <div className="h-36 rounded-[28px] bg-[var(--muted)]" />
          </div>
          <div className="h-[520px] rounded-[28px] bg-[var(--muted)]" />
        </div>
      </div>
    </main>
  );
}

