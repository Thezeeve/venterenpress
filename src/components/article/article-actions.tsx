"use client";

import { Bookmark, Share2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export function ArticleActions({
  articleId,
  slug,
}: {
  articleId: string;
  slug: string;
}) {
  const [bookmarked, setBookmarked] = useState(false);

  async function toggleBookmark() {
    const response = await fetch(`/api/rest/articles/${articleId}/bookmark`, {
      method: "POST",
    });

    if (response.ok) {
      setBookmarked((value) => !value);
    }
  }

  async function shareArticle() {
    const url = `${window.location.origin}/articles/${slug}`;
    if (navigator.share) {
      await navigator.share({ url });
      return;
    }
    await navigator.clipboard.writeText(url);
  }

  return (
    <div className="flex flex-wrap gap-3">
      <Button variant="outline" size="sm" onClick={shareArticle}>
        <Share2 className="h-4 w-4" />
        Share
      </Button>
      <Button variant="outline" size="sm" onClick={toggleBookmark}>
        <Bookmark className="h-4 w-4" />
        {bookmarked ? "Bookmarked" : "Bookmark"}
      </Button>
    </div>
  );
}
