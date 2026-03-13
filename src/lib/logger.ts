export function info(message: string, details?: Record<string, unknown>): void {
  write("INFO", message, details);
}

export function warn(message: string, details?: Record<string, unknown>): void {
  write("WARN", message, details);
}

export function error(message: string, details?: Record<string, unknown>): void {
  write("ERROR", message, details);
}

function write(level: string, message: string, details?: Record<string, unknown>): void {
  const payload = details ? ` ${JSON.stringify(details)}` : "";
  process.stdout.write(`[${level}] ${message}${payload}\n`);
}
