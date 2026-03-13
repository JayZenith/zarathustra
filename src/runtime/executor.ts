import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import type { AgentAction, AgentPlan } from "./model.js";
import type { MemoryRepo } from "../memory/repo.js";
import { createId } from "../lib/ids.js";
import { nowIso } from "../lib/time.js";
import { PATHS } from "../lib/paths.js";
import { execShell } from "../tools/shell.js";
import { queryDb } from "../tools/db.js";
import { runPython } from "../tools/python.js";
import { readTextFile, writeTextFile } from "../tools/files.js";
import { searchPapers, fetchPaper } from "../tools/papers.js";
import { gitStatus } from "../tools/git.js";
import { recordArtifact } from "../memory/stores/artifacts.js";

export interface ToolResult {
  tool: string;
  summary: string;
  artifactPath?: string;
  output?: string;
}

export async function executePlan(
  repo: MemoryRepo,
  sessionId: string,
  cycleId: string,
  plan: AgentPlan,
): Promise<ToolResult[]> {
  const results: ToolResult[] = [];
  for (const action of plan.actions) {
    const result = await executeAction(repo, sessionId, cycleId, action);
    results.push(result);
  }
  return results;
}

async function executeAction(
  repo: MemoryRepo,
  sessionId: string,
  cycleId: string,
  action: AgentAction,
): Promise<ToolResult> {
  const startedAt = nowIso();
  const toolCallId = createId("tool");
  repo.db
    .query(
      `
        insert into tool_calls (
          id, cycle_id, tool, args_json, status, started_at
        ) values (?, ?, ?, ?, ?, ?)
      `,
    )
    .run(toolCallId, cycleId, action.tool, JSON.stringify(action.input), "running", startedAt);

  const result = await dispatchTool(action);
  let artifactId: string | null = null;

  if (result.artifactPath) {
    artifactId = await recordArtifact(repo, sessionId, action.tool, result.artifactPath);
  } else if (result.output) {
    const artifactPath = path.join(PATHS.runsDir, sessionId, `${toolCallId}.txt`);
    await mkdir(path.dirname(artifactPath), { recursive: true });
    await writeFile(artifactPath, result.output, "utf8");
    artifactId = await recordArtifact(repo, sessionId, action.tool, artifactPath);
  }

  repo.db
    .query(
      `
        update tool_calls
        set status = ?, summary = ?, artifact_id = ?, ended_at = ?
        where id = ?
      `,
    )
    .run("completed", result.summary, artifactId, nowIso(), toolCallId);

  return result;
}

async function dispatchTool(action: AgentAction): Promise<ToolResult> {
  switch (action.tool) {
    case "shell": {
      const cmd = String(action.input.cmd);
      const output = await execShell(
        action.input.cwd
          ? { cmd, cwd: String(action.input.cwd) }
          : { cmd },
      );
      return { tool: "shell", summary: `shell: ${cmd}`, output };
    }
    case "db": {
      const sql = String(action.input.sql);
      const rows = queryDb(sql);
      return { tool: "db", summary: `db query returned ${rows.length} rows`, output: JSON.stringify(rows, null, 2) };
    }
    case "python": {
      const script = String(action.input.script);
      const output = await runPython(script);
      return { tool: "python", summary: "python subordinate tool executed", output };
    }
    case "files.read": {
      const filePath = String(action.input.path);
      const output = await readTextFile(filePath);
      return { tool: "files.read", summary: `read ${filePath}`, output };
    }
    case "files.write": {
      const filePath = String(action.input.path);
      const content = String(action.input.content);
      await writeTextFile(filePath, content);
      return { tool: "files.write", summary: `wrote ${filePath}` };
    }
    case "papers.search": {
      const query = String(action.input.query);
      const output = await searchPapers(query);
      return { tool: "papers.search", summary: `paper search stub for ${query}`, output };
    }
    case "papers.fetch": {
      const url = String(action.input.url);
      const output = await fetchPaper(url);
      return { tool: "papers.fetch", summary: `paper fetch stub for ${url}`, output };
    }
    case "git.status": {
      const cwd = action.input.cwd ? String(action.input.cwd) : process.cwd();
      const output = await gitStatus(cwd);
      return { tool: "git.status", summary: "captured git status", output };
    }
    default:
      throw new Error(`Unsupported tool: ${action.tool}`);
  }
}
