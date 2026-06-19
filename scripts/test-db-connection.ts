import "dotenv/config";
import dns from "node:dns/promises";
import { URL } from "node:url";
import { PrismaClient } from "@prisma/client";

function maskDatabaseUrl(value: string) {
  try {
    const url = new URL(value);
    if (url.password) {
      url.password = "****";
    }
    return url.toString();
  } catch {
    return value.replace(/:\/\/([^:]+):([^@]+)@/, "://$1:****@");
  }
}

function classifyConnectionError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  const lower = message.toLowerCase();

  if (
    lower.includes("enotfound") ||
    lower.includes("getaddrinfo") ||
    lower.includes("dns") ||
    lower.includes("could not translate host name")
  ) {
    return "DNS failure";
  }

  if (
    lower.includes("timeout") ||
    lower.includes("timed out") ||
    lower.includes("etimedout")
  ) {
    return "timeout";
  }

  if (
    lower.includes("password authentication failed") ||
    lower.includes("authentication failed") ||
    lower.includes("p1000")
  ) {
    return "wrong password";
  }

  if (
    lower.includes("ssl") ||
    lower.includes("tls") ||
    lower.includes("certificate")
  ) {
    return "SSL issue";
  }

  if (
    lower.includes("ipv6") ||
    lower.includes("ehostunreach") ||
    lower.includes("enetunreach")
  ) {
    return "IPv6/direct connection issue";
  }

  if (
    lower.includes("can't reach database server") ||
    lower.includes("econnrefused") ||
    lower.includes("database server") ||
    lower.includes("connect econnreset") ||
    lower.includes("server closed the connection unexpectedly")
  ) {
    return "database unreachable";
  }

  return "unknown connection failure";
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  const directUrl = process.env.DIRECT_URL;

  console.log(`DATABASE_URL exists: ${databaseUrl ? "yes" : "no"}`);
  console.log(`DIRECT_URL exists: ${directUrl ? "yes" : "no"}`);

  if (databaseUrl) {
    console.log(`DATABASE_URL: ${maskDatabaseUrl(databaseUrl)}`);
  }

  if (directUrl) {
    console.log(`DIRECT_URL: ${maskDatabaseUrl(directUrl)}`);
  }

  if (!databaseUrl) {
    console.error("Failure reason: DATABASE_URL is missing");
    process.exitCode = 1;
    return;
  }

  try {
    const parsed = new URL(databaseUrl);
    console.log(`Host: ${parsed.hostname}`);
    console.log(`Port: ${parsed.port || "5432"}`);

    try {
      const dnsResult = await dns.lookup(parsed.hostname, { all: true });
      console.log(
        `DNS lookup: success (${dnsResult.map((entry) => `${entry.address}/${entry.family}`).join(", ")})`,
      );
    } catch (error) {
      console.error(`DNS lookup: failed (${classifyConnectionError(error)})`);
      throw error;
    }
  } catch (error) {
    console.error(`URL parse/reachability preparation failed: ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
    return;
  }

  const prisma = new PrismaClient({
    log: ["error"],
  });

  try {
    await prisma.$queryRaw`SELECT 1`;
    console.log("Prisma query: success");
  } catch (error) {
    const reason = classifyConnectionError(error);
    console.error(`Prisma query: failed (${reason})`);
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect().catch(() => null);
  }
}

void main();
