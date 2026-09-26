import 'server-only';

type Level = 'info' | 'warn' | 'error';

function write(level: Level, event: string, data?: Record<string, unknown>): void {
  const entry = { level, event, ts: new Date().toISOString(), ...data };
  // In production: Cloud Logging via @google-cloud/logging
  // eslint-disable-next-line no-console
  console[level](JSON.stringify(entry));
}

export const log = {
  info: (event: string, data?: Record<string, unknown>) => write('info', event, data),
  warn: (event: string, data?: Record<string, unknown>) => write('warn', event, data),
  error: (event: string, data?: Record<string, unknown>) => write('error', event, data),
} as const;
