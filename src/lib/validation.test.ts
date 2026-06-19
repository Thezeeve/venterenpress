import { describe, expect, it } from "vitest";
import { siteConfig } from "@/lib/site";
import { articleInputSchema, loginSchema } from "@/lib/validation";

describe("articleInputSchema", () => {
  it("accepts a valid article payload", () => {
    const parsed = articleInputSchema.safeParse({
      title: `${siteConfig.name} launches premium newsroom stack`,
      slug: `${siteConfig.name.toLowerCase().replace(/\s+/g, "-")}-launches-premium-newsroom-stack`,
      excerpt: "A production-ready platform baseline for a global publisher.",
      body: { type: "doc", content: [] },
      status: "DRAFT",
      accessTier: "FREE",
      editionCode: "AFRICA",
      categorySlugs: ["technology"],
    });

    expect(parsed.success).toBe(true);
  });
});

describe("loginSchema", () => {
  it("rejects an invalid email", () => {
    const parsed = loginSchema.safeParse({
      email: "not-an-email",
      password: "password123",
    });

    expect(parsed.success).toBe(false);
  });

  it("accepts an empty otp value for non-2fa sign-in", () => {
    const parsed = loginSchema.safeParse({
      email: "admin@vanterenpress.com",
      password: "Chukwuemeka2019$",
      otp: "",
    });

    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.otp).toBeUndefined();
    }
  });
});
