export type LogLevel = "debug" | "info" | "warn" | "error";

export interface Logger {
  debug(message: string): void;
  info(message: string): void;
  warn(message: string): void;
  error(message: string): void;
}

export function createLogger(
  level: LogLevel = "info",
  sink: (line: string) => void = console.log,
): Logger {
  const order: Record<LogLevel, number> = { debug: 10, info: 20, warn: 30, error: 40 };
  const emit = (current: LogLevel, message: string) => {
    if (order[current] >= order[level]) sink(message);
  };
  return {
    debug: (message) => emit("debug", message),
    info: (message) => emit("info", message),
    warn: (message) => emit("warn", message),
    error: (message) => emit("error", message),
  };
}

export const silentLogger: Logger = {
  debug: () => undefined,
  info: () => undefined,
  warn: () => undefined,
  error: () => undefined,
};
