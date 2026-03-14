import type { MemoryRepo } from "../memory/repo.js";

export function recoverRunningCycle(repo: MemoryRepo, sessionId: string): void {
  const cycle = repo.getOpenCycle(sessionId);
  if (!cycle) {
    return;
  }

  repo.db
    .query(
      `
        update cycles
        set status = ?, summary = coalesce(summary, ?), ended_at = coalesce(ended_at, ?)
        where id = ?
      `,
    )
    .run("interrupted", "agent process exited before cycle finished", new Date().toISOString(), String(cycle.id));
}
