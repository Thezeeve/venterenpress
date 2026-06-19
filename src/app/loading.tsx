export default function Loading() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="animate-pulse space-y-8">
        <div className="flex items-center gap-3">
          <div className="h-6 w-24 rounded-full bg-[var(--muted)]" />
          <div className="h-4 w-48 rounded-full bg-[var(--muted)]" />
        </div>
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-4">
            <div className="h-16 w-full max-w-4xl rounded-[28px] bg-[var(--muted)]" />
            <div className="h-6 w-full max-w-2xl rounded-full bg-[var(--muted)]" />
            <div className="grid gap-4 md:grid-cols-3">
              <div className="h-32 rounded-[28px] bg-[var(--muted)]" />
              <div className="h-32 rounded-[28px] bg-[var(--muted)]" />
              <div className="h-32 rounded-[28px] bg-[var(--muted)]" />
            </div>
          </div>
          <div className="h-[320px] rounded-[28px] bg-[var(--muted)]" />
        </div>
        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <div className="space-y-4">
            <div className="h-40 rounded-[28px] bg-[var(--muted)]" />
            <div className="h-40 rounded-[28px] bg-[var(--muted)]" />
            <div className="h-40 rounded-[28px] bg-[var(--muted)]" />
          </div>
          <div className="h-80 rounded-[28px] bg-[var(--muted)]" />
        </div>
      </div>
    </main>
  );
}
