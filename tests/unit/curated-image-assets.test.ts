import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const projectRoot = process.cwd();
const sourceRoot = path.join(projectRoot, "src");

function walkFiles(dir: string, files: string[] = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkFiles(fullPath, files);
      continue;
    }

    if (/\.(ts|tsx|js|jsx)$/i.test(entry.name)) {
      files.push(fullPath);
    }
  }

  return files;
}

function getReferencedNewsAssets() {
  const refs = new Set<string>();

  for (const file of walkFiles(sourceRoot)) {
    const text = fs.readFileSync(file, "utf8");
    for (const match of text.matchAll(/["'`](\/news\/[A-Za-z0-9_./-]+)["'`]/g)) {
      const ref = match[1];
      if (ref && !ref.endsWith("/")) {
        refs.add(ref);
      }
    }
  }

  return [...refs].sort();
}

function readImageDimensions(filePath: string) {
  const bytes = fs.readFileSync(filePath);

  if (
    bytes[0] === 0x89
    && bytes[1] === 0x50
    && bytes[2] === 0x4e
    && bytes[3] === 0x47
  ) {
    return {
      format: "png",
      width: bytes.readUInt32BE(16),
      height: bytes.readUInt32BE(20),
    };
  }

  if (bytes[0] === 0xff && bytes[1] === 0xd8) {
    let offset = 2;

    while (offset < bytes.length) {
      if (bytes[offset] !== 0xff) {
        offset += 1;
        continue;
      }

      const marker = bytes[offset + 1];
      const segmentLength = bytes.readUInt16BE(offset + 2);
      if ([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf].includes(marker)) {
        return {
          format: "jpeg",
          width: bytes.readUInt16BE(offset + 7),
          height: bytes.readUInt16BE(offset + 5),
        };
      }

      offset += segmentLength + 2;
    }
  }

  throw new Error(`Unsupported or unreadable image format: ${filePath}`);
}

describe("curated newsroom image assets", () => {
  it("keeps every referenced /news asset present and readable", () => {
    const refs = getReferencedNewsAssets();

    expect(refs.length).toBeGreaterThan(0);

    for (const ref of refs) {
      const absolutePath = path.join(projectRoot, "public", ref.replace(/^\//, ""));
      expect(fs.existsSync(absolutePath), `${ref} should exist`).toBe(true);

      const { width, height } = readImageDimensions(absolutePath);
      expect(width, `${ref} should have a positive width`).toBeGreaterThan(0);
      expect(height, `${ref} should have a positive height`).toBeGreaterThan(0);
    }
  }, 15000);
});
