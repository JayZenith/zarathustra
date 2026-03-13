import type { TargetConfig } from "./config.js";

export function summarizeConstraints(target: TargetConfig): string {
  return target.constraints.map((constraint) => `- ${constraint}`).join("\n");
}
