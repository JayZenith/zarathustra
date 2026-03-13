import { loadTargetConfig } from "../../targets/config.js";
import type { MemoryRepo } from "../../memory/repo.js";

export async function attachCommand(repo: MemoryRepo, targetRef: string): Promise<void> {
  const target = await loadTargetConfig(targetRef);
  const record = repo.upsertTarget(target.name, target.repo_path, JSON.stringify(target));
  process.stdout.write(`attached ${record.name} -> ${record.repo_path}\n`);
}
