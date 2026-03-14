import type { MemoryRepo } from "../../memory/repo.js";

export function statusCommand(repo: MemoryRepo): void {
  const session = repo.getLatestSession();
  if (!session) {
    process.stdout.write("no sessions\n");
    return;
  }
  process.stdout.write(
    JSON.stringify(
      {
        session,
        cycles: repo.getCycles(session.id),
        findings: repo.getFindings(session.id),
        experiments: repo.getExperiments(session.id),
        papers: repo.getPaperNotes(session.id),
        wake_events: repo.getWakeEvents(session.id),
        stats: repo.getSessionStats(session.id),
      },
      null,
      2,
    ) + "\n",
  );
}
