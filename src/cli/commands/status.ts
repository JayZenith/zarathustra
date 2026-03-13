import type { MemoryRepo } from "../../memory/repo.js";

export function statusCommand(repo: MemoryRepo): void {
  const session = repo.getLatestSession();
  if (!session) {
    process.stdout.write("no sessions\n");
    return;
  }
  const target = repo.listTargets().find((record) => record.id === session.target_id);
  process.stdout.write(
    JSON.stringify(
      {
        session,
        target,
        cycles: repo.getCycles(session.id),
        findings: repo.getFindings(session.id)
      },
      null,
      2,
    ) + "\n",
  );
}
