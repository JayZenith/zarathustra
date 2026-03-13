import { readFile } from "node:fs/promises";
import type { RuntimeState } from "./state_builder.js";
import { PATHS } from "../lib/paths.js";

export async function buildPrompt(state: RuntimeState): Promise<string> {
  const program = await readFile(PATHS.program, "utf8");
  return [
    program.trim(),
    "",
    "## Target",
    `Name: ${state.target.name}`,
    `Repo: ${state.target.repo_path}`,
    `Goal: ${state.target.goal}`,
    "",
    "## Constraints",
    ...state.target.constraints.map((constraint) => `- ${constraint}`),
    "",
    "## Notes",
    ...state.target.notes.map((note) => `- ${note}`),
    "",
    "## Recent Cycles",
    state.recentCycles.length > 0 ? JSON.stringify(state.recentCycles, null, 2) : "[]",
    "",
    "## Recent Findings",
    state.recentFindings.length > 0 ? JSON.stringify(state.recentFindings, null, 2) : "[]",
    "",
    "## Recent Decisions",
    state.recentDecisions.length > 0 ? JSON.stringify(state.recentDecisions, null, 2) : "[]",
  ].join("\n");
}
