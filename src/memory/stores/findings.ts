import { createId } from "../../lib/ids.js";
import { nowIso } from "../../lib/time.js";
import type { MemoryRepo } from "../repo.js";

export function recordFinding(
  repo: MemoryRepo,
  sessionId: string,
  title: string,
  body: string,
  kind = "observation",
  evidenceJson = "{}",
): void {
  repo.db
    .query(
      `
        insert into findings (
          id, session_id, kind, title, body, evidence_json, confidence, created_at
        ) values (?, ?, ?, ?, ?, ?, ?, ?)
      `,
    )
    .run(createId("finding"), sessionId, kind, title, body, evidenceJson, null, nowIso());
}
