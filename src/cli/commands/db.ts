import type { MemoryRepo } from "../../memory/repo.js";

export function dbCommand(repo: MemoryRepo, sql: string): void {
  const rows = repo.query(sql);
  process.stdout.write(`${JSON.stringify(rows, null, 2)}\n`);
}
