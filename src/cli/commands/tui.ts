import type { MemoryRepo } from "../../memory/repo.js";
import type { TargetConfig } from "../../targets/config.js";
import { renderTui } from "../../tui/app.js";

export function tuiCommand(repo: MemoryRepo): void {
  const session = repo.getLatestSession();
  if (!session) {
    process.stdout.write("no sessions\n");
    return;
  }
  const targetRecord = repo.listTargets().find((record) => record.id === session.target_id);
  if (!targetRecord) {
    throw new Error(`Missing target for session ${session.id}`);
  }
  const target = JSON.parse(targetRecord.config_json) as TargetConfig;
  process.stdout.write(renderTui(repo, session, target) + "\n");
}
