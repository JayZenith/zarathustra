import type { MemoryRepo } from "../../memory/repo.js";
import { recordPaperNote } from "../../memory/stores/papers.js";
import { fetchPaper } from "../../tools/papers.js";

export async function paperFetchCommand(repo: MemoryRepo, urlOrId: string): Promise<void> {
  const output = await fetchPaper(urlOrId);
  const session = repo.getLatestSession();
  if (session) {
    const parsed = JSON.parse(output) as { paper?: { id?: string; title?: string; summary?: string } };
    if (parsed.paper?.title && parsed.paper.summary) {
      recordPaperNote(repo, session.id, parsed.paper.id ?? null, parsed.paper.title, parsed.paper.summary, "manual fetch", "arxiv");
    }
  }
  process.stdout.write(`${output}\n`);
}
