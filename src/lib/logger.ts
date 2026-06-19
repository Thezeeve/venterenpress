type LogContext = Record<string, unknown>;

function write(level: "info" | "warn" | "error", message: string, context?: LogContext) {
  const payload = context ? { message, ...context } : { message };
  const line = JSON.stringify({ level, timestamp: new Date().toISOString(), ...payload });
  if (level === "error") {
    console.error(line);
    return;
  }
  if (level === "warn") {
    console.warn(line);
    return;
  }
  console.log(line);
}

export const logger = {
  info(message: string, context?: LogContext) {
    write("info", message, context);
  },
  warn(message: string, context?: LogContext) {
    write("warn", message, context);
  },
  error(message: string, context?: LogContext) {
    write("error", message, context);
  },
};

export async function measureAsync<T>(label: string, fn: () => Promise<T>) {
  const startedAt = performance.now();
  try {
    return await fn();
  } finally {
    logger.info(label, { durationMs: Math.round(performance.now() - startedAt) });
  }
}
