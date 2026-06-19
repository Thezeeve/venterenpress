"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function FollowJournalistButton({ journalistId }: { journalistId: string }) {
  const [following, setFollowing] = useState(false);

  async function toggleFollow() {
    const response = await fetch(`/api/rest/authors/${journalistId}/follow`, {
      method: "POST",
    });

    if (response.ok) {
      setFollowing((value) => !value);
    }
  }

  return (
    <Button variant={following ? "secondary" : "outline"} size="sm" onClick={toggleFollow}>
      {following ? "Following" : "Follow Journalist"}
    </Button>
  );
}
