import type { MemoryRepo } from "../memory/repo.js";

export function getResumableSession(repo: MemoryRepo) {
  return repo.getLatestSession();
}
