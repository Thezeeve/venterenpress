import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium uppercase tracking-[0.18em]",
  {
    variants: {
      variant: {
        default: "bg-[var(--accent-soft)] text-[var(--accent)]",
        neutral: "bg-[var(--muted)] text-[var(--muted-foreground)]",
        destructive: "bg-[#fde8e8] text-[#b42318]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export function Badge({
  className,
  variant,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof badgeVariants>) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}
