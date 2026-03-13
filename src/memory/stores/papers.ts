import { createId } from "../../lib/ids.js";
import { nowIso } from "../../lib/time.js";
import type { MemoryRepo } from "../repo.js";

export function recordPaperNote(
  repo: MemoryRepo,
  sessionId: string,
  title: string,
  summary: string,
  notes: string,
  source = "manual",
): void {
  repo.db
    .query(
      `
        insert into paper_notes (
          id, session_id, source, title, summary, notes, created_at
        ) values (?, ?, ?, ?, ?, ?, ?)
      `,
    )
    .run(createId("paper"), sessionId, source, title, summary, notes, nowIso());
}
