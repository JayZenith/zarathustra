import { createId } from "../../lib/ids.js";
import { nowIso } from "../../lib/time.js";
import type { MemoryRepo } from "../repo.js";

export function recordDecision(
  repo: MemoryRepo,
  sessionId: string,
  summary: string,
  reasoning: string,
  decisionType = "next_step",
): void {
  repo.db
    .query(
      `
        insert into decisions (
          id, session_id, decision_type, summary, reasoning, created_at
        ) values (?, ?, ?, ?, ?, ?)
      `,
    )
    .run(createId("decision"), sessionId, decisionType, summary, reasoning, nowIso());
}
