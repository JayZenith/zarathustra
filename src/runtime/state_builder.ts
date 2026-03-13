import type { MemoryRepo, SessionRecord } from "../memory/repo.js";
import type { TargetConfig } from "../targets/config.js";

export interface RuntimeState {
  session: SessionRecord;
  target: TargetConfig;
  recentCycles: Array<Record<string, unknown>>;
  recentFindings: Array<Record<string, unknown>>;
  recentDecisions: Array<Record<string, unknown>>;
}

export function buildRuntimeState(
  repo: MemoryRepo,
  session: SessionRecord,
  target: TargetConfig,
): RuntimeState {
  return {
    session,
    target,
    recentCycles: repo.getCycles(session.id),
    recentFindings: repo.getFindings(session.id),
    recentDecisions: repo.getDecisions(session.id),
  };
}
