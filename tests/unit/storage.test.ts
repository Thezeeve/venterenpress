import { describe, expect, it, beforeEach } from "vitest";
import { MediaType } from "@prisma/client";
import { buildPublicUrl, buildObjectKey, getStorageConfig, getStorageHealth } from "@/lib/storage";

const originalEnv = { ...process.env };

describe("storage configuration", () => {
  beforeEach(() => {
    process.env = { ...originalEnv };
    process.env.S3_ENDPOINT = "https://account-id.r2.cloudflarestorage.com";
    process.env.S3_REGION = "auto";
    process.env.S3_BUCKET = "vanterenpress-media";
    process.env.S3_ACCESS_KEY_ID = "R2_ACCESS_KEY_ID";
    process.env.S3_SECRET_ACCESS_KEY = "R2_SECRET_ACCESS_KEY";
    process.env.S3_PUBLIC_BASE_URL = "https://media.vanterenpress.com";
    delete process.env.S3_PUBLIC_URL_BASE;
  });

  it("reads the Cloudflare R2 env contract", () => {
    expect(getStorageConfig()).toEqual({
      ok: true,
      config: {
        endpoint: "https://account-id.r2.cloudflarestorage.com",
        region: "auto",
        bucket: "vanterenpress-media",
        accessKeyId: "R2_ACCESS_KEY_ID",
        secretAccessKey: "R2_SECRET_ACCESS_KEY",
        publicBaseUrl: "https://media.vanterenpress.com",
        forcePathStyle: false,
      },
    });
  });

  it("normalizes an R2 endpoint that was configured with a bucket path", () => {
    process.env.S3_ENDPOINT = "https://account-id.r2.cloudflarestorage.com/vanterenpress-media";

    expect(getStorageConfig()).toEqual({
      ok: true,
      config: {
        endpoint: "https://account-id.r2.cloudflarestorage.com",
        region: "auto",
        bucket: "vanterenpress-media",
        accessKeyId: "R2_ACCESS_KEY_ID",
        secretAccessKey: "R2_SECRET_ACCESS_KEY",
        publicBaseUrl: "https://media.vanterenpress.com",
        forcePathStyle: false,
      },
    });
  });

  it("builds displayed asset urls from the public base url", () => {
    expect(buildPublicUrl("images/2026/example.png")).toBe(
      "https://media.vanterenpress.com/images/2026/example.png",
    );
  });

  it("reports missing storage env clearly", async () => {
    delete process.env.S3_PUBLIC_BASE_URL;

    expect(getStorageConfig()).toEqual({
      ok: false,
      missing: ["S3_PUBLIC_BASE_URL"],
      message: "Storage is not configured. Missing env vars: S3_PUBLIC_BASE_URL.",
    });
    await expect(getStorageHealth()).resolves.toEqual({
      status: "error",
      configured: false,
      missingEnv: ["S3_PUBLIC_BASE_URL"],
      message: "Storage is not configured. Missing env vars: S3_PUBLIC_BASE_URL.",
    });
  });

  it("keeps object keys under the image folder for article images", () => {
    expect(buildObjectKey(MediaType.IMAGE, "Lead Image.PNG")).toMatch(
      /^images\/\d{4}\/.+-lead-image\.png$/,
    );
  });
});
