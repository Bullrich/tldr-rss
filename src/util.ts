import { debug, error, info, warning } from "@actions/core";

export interface ActionLogger {
  debug(message: string): void;
  info(message: string): void;
  warn(message: string | Error): void;
  error(message: string | Error): void;
}

export function generateCoreLogger(): ActionLogger {
  return { info, debug, warn: warning, error };
}

export const logger = generateCoreLogger();
