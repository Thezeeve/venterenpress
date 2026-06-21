"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle, Star } from "lucide-react";
import { Button } from "@/components/ui/button";

export function HomepageHeroButton({
  articleId,
  isHomepageHero,
  disabled = false,
  compact = false,
}: {
  articleId: string;
  isHomepageHero: boolean;
  disabled?: boolean;
  compact?: boolean;
}) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);

  async function setHomepageHero() {
    if (disabled || isHomepageHero || isPending) {
      return;
    }

    setIsPending(true);
    try {
      const response = await fetch(`/api/rest/articles/${articleId}/homepage-hero`, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Unable to set homepage hero.");
      }

      router.refresh();
    } finally {
      setIsPending(false);
    }
  }

  if (isHomepageHero) {
    return (
      <Button type="button" variant="outline" size={compact ? "sm" : "default"} className="border-amber-300 text-amber-800" disabled>
        <Star className="h-4 w-4 fill-current" />
        Homepage Hero
      </Button>
    );
  }

  return (
    <Button
      type="button"
      variant="outline"
      size={compact ? "sm" : "default"}
      onClick={() => void setHomepageHero()}
      disabled={disabled || isPending}
    >
      {isPending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Star className="h-4 w-4" />}
      {disabled ? "Publish To Feature" : "Feature as Homepage Hero"}
    </Button>
  );
}
