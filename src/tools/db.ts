import { MemoryRepo } from "../memory/repo.js";

const repo = new MemoryRepo();

export function queryDb(sql: string): Array<Record<string, unknown>> {
  return repo.query(sql);
}
