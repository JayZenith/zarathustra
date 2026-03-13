import type { MemoryRepo, SessionRecord } from "../memory/repo.js";
import type { TargetConfig } from "../targets/config.js";
import { renderStatusPane } from "./panes/status.js";
import { renderCyclesPane } from "./panes/cycles.js";
import { renderFindingsPane } from "./panes/findings.js";

export function renderTui(
  repo: MemoryRepo,
  session: SessionRecord,
  target: TargetConfig,
): string {
  return [
    renderStatusPane(session, target),
    "",
    renderCyclesPane(repo.getCycles(session.id)),
    "",
    renderFindingsPane(repo.getFindings(session.id))
  ].join("\n");
}
