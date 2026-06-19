import { ArrowUpRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function MetricCard({
  label,
  value,
  delta,
}: {
  label: string;
  value: string;
  delta: string;
}) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="text-xs uppercase tracking-[0.22em] text-[var(--muted-foreground)]">
          {label}
        </div>
        <CardTitle className="text-3xl">{value}</CardTitle>
      </CardHeader>
      <CardContent className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400">
        <ArrowUpRight className="h-4 w-4" />
        {delta}
      </CardContent>
    </Card>
  );
}
