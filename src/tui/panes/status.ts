import type { SessionRecord } from "../../memory/repo.js";
import type { TargetConfig } from "../../targets/config.js";

export function renderStatusPane(session: SessionRecord, target: TargetConfig): string {
  return [
    "ZARATHUSTRA",
    `session: ${session.id}`,
    `target:  ${target.name}`,
    `repo:    ${target.repo_path}`,
    `goal:    ${target.goal}`,
    `status:  ${session.status}`,
    `lease:   ${session.lease_expires_at ?? "none"}`
  ].join("\n");
}
