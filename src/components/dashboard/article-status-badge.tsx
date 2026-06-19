import { ArticleStatus } from "@prisma/client";
import { Badge } from "@/components/ui/badge";

const variants: Record<ArticleStatus, "default" | "neutral" | "destructive"> = {
  DRAFT: "neutral",
  SUBMITTED: "default",
  FACT_CHECKING: "default",
  EDITOR_REVIEW: "default",
  APPROVED: "default",
  SCHEDULED: "neutral",
  PUBLISHED: "default",
  ARCHIVED: "destructive",
};

export function ArticleStatusBadge({ status }: { status: ArticleStatus }) {
  return <Badge variant={variants[status]}>{status.replaceAll("_", " ")}</Badge>;
}
