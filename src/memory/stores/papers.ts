import { createId } from "../../lib/ids.js";
import { nowIso } from "../../lib/time.js";
import type { MemoryRepo } from "../repo.js";

export function recordPaperNote(
  repo: MemoryRepo,
  sessionId: string,
  paperId: string | null,
  title: string,
  summary: string,
  notes: string,
  source = "manual",
  relevance: number | null = null,
): void {
  repo.db
    .query(
      `
        insert into paper_notes (
          id, session_id, source, paper_id, title, summary, notes, relevance, created_at
        ) values (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
    )
    .run(createId("paper"), sessionId, source, paperId, title, summary, notes, relevance, nowIso());
}
