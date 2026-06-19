import net from "node:net";
import { cache } from "react";

function getDatabaseEndpoint() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    return null;
  }

  try {
    const parsed = new URL(databaseUrl);
    return {
      host: parsed.hostname,
      port: parsed.port ? Number(parsed.port) : 5432,
    };
  } catch {
    return null;
  }
}

async function canConnectToEndpoint(host: string, port: number) {
  return await new Promise<boolean>((resolve) => {
    const socket = new net.Socket();
    let settled = false;

    const finish = (value: boolean) => {
      if (settled) {
        return;
      }

      settled = true;
      socket.destroy();
      resolve(value);
    };

    socket.setTimeout(1000);
    socket.once("connect", () => finish(true));
    socket.once("timeout", () => finish(false));
    socket.once("error", () => finish(false));
    socket.connect(port, host);
  });
}

export const isDatabaseAvailable = cache(async () => {
  const endpoint = getDatabaseEndpoint();
  if (!endpoint) {
    return false;
  }

  return await canConnectToEndpoint(endpoint.host, endpoint.port);
});
