import type { ToolResult } from "./executor.js";
import type { MemoryRepo } from "../memory/repo.js";
import { recordDecision } from "../memory/stores/decisions.js";
import { recordFinding } from "../memory/stores/findings.js";

export function reduceCycle(
  repo: MemoryRepo,
  sessionId: string,
  objective: string,
  results: ToolResult[],
): string {
  const summary = `${objective} | ${results.map((result) => result.summary).join("; ")}`;
  recordDecision(repo, sessionId, objective, summary, "cycle_objective");
  for (const result of results) {
    recordFinding(repo, sessionId, result.tool, result.summary, "tool_result");
  }
  return summary;
}
