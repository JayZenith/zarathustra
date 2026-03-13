import type { TargetConfig } from "../../targets/config.js";
import type { MemoryRepo } from "../../memory/repo.js";
import { createSession } from "../../runtime/session.js";
import { RuntimeEngine } from "../../runtime/engine.js";

export async function runCommand(repo: MemoryRepo, targetRef: string, maxCycles?: number): Promise<void> {
  const targetRecord = repo.getTargetByName(targetRef);
  const target = JSON.parse(targetRecord.config_json) as TargetConfig;
  const session = createSession(repo, targetRecord);
  const engine = new RuntimeEngine(repo, target, session);
  await engine.run(maxCycles === undefined ? {} : { maxCycles });
}
