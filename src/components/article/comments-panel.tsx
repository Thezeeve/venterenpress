"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

type CommentItem = {
  id: string;
  body: string;
  user: { name: string | null; email: string | null };
  createdAt: string | Date;
};

export function CommentsPanel({
  articleId,
  initialComments,
}: {
  articleId: string;
  initialComments: CommentItem[];
}) {
  const [comments, setComments] = useState(initialComments);
  const [body, setBody] = useState("");

  async function submitComment() {
    if (!body.trim()) {
      return;
    }

    const response = await fetch(`/api/rest/articles/${articleId}/public-comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body }),
    });

    if (!response.ok) {
      return;
    }

    const payload = (await response.json()) as { data: CommentItem };
    setComments((current) => [payload.data, ...current]);
    setBody("");
  }

  return (
    <div className="space-y-4">
      <div className="rounded-[28px] border border-[var(--border)] bg-[var(--panel)] p-5">
        <Textarea
          placeholder="Add your perspective to the discussion"
          value={body}
          onChange={(event) => setBody(event.target.value)}
        />
        <Button className="mt-4" onClick={submitComment}>Post Comment</Button>
      </div>
      <div className="space-y-4">
        {comments.map((comment) => (
          <div key={comment.id} className="rounded-[24px] bg-[var(--muted)] p-5">
            <div className="font-medium">{comment.user.name ?? comment.user.email ?? "Reader"}</div>
            <p className="mt-2 text-sm leading-7 text-[var(--muted-foreground)]">{comment.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
