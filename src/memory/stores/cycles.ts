import { createId } from "../../lib/ids.js";
import { nowIso } from "../../lib/time.js";
import type { MemoryRepo } from "../repo.js";

export interface CycleRecord {
  id: string;
  cycleIndex: number;
}

export function startCycle(repo: MemoryRepo, sessionId: string, cycleIndex: number): CycleRecord {
  const id = createId("cycle");
  repo.db
    .query(
      `
        insert into cycles (
          id, session_id, cycle_index, status, started_at
        ) values (?, ?, ?, ?, ?)
      `,
    )
    .run(id, sessionId, cycleIndex, "running", nowIso());
  return { id, cycleIndex };
}

export function finishCycle(repo: MemoryRepo, cycleId: string, summary: string, status = "completed"): void {
  repo.db
    .query(
      `
        update cycles
        set status = ?, summary = ?, ended_at = ?
        where id = ?
      `,
    )
    .run(status, summary, nowIso(), cycleId);
}
