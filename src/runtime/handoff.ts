import { readFile } from "node:fs/promises";
import type { MemoryRepo, SessionRecord } from "../memory/repo.js";
import { PATHS } from "../lib/paths.js";

export async function buildHandoff(repo: MemoryRepo, session: SessionRecord): Promise<string> {
  const [program, tools] = await Promise.all([
    readFile(PATHS.program, "utf8"),
    readFile(PATHS.tools, "utf8"),
  ]);

  const cycles = repo.getCycles(session.id).slice(0, 5).map((cycle) => String(cycle.summary ?? "")).filter(Boolean);
  const experiments = repo
    .getRecentExperimentSummaries(session.id)
    .slice(0, 5)
    .map((item) => `${item.status} ${item.change_summary ?? item.hypothesis ?? ""} ${item.metrics ?? ""}`.trim());
  const papers = repo
    .getPaperNotes(session.id)
    .slice(0, 5)
    .map((note) => `${note.title}: ${note.notes}`);
  const wakeEvents = repo
    .getWakeEvents(session.id)
    .slice(0, 5)
    .map((event) => `${event.created_at}: ${event.reason}`);
  const stats = repo.getSessionStats(session.id);

  return [
    "# zarathustra handoff",
    "",
    "Read `program.md` first. Read `tools.md` when you need commands.",
    "",
    "## Goal",
    session.goal,
    "",
    "## Workdir",
    session.workdir,
    "",
    "## Runtime State",
    `restart_count=${session.restart_count ?? 0}`,
    `consecutive_failures=${session.consecutive_failures ?? 0}`,
    `last_exit_code=${session.last_exit_code ?? "none"}`,
    `cycle_count=${stats.cycle_count ?? 0}`,
    "",
    "## Recent Cycles",
    cycles.length > 0 ? cycles.map((item) => `- ${item}`).join("\n") : "- none",
    "",
    "## Recent Experiments",
    experiments.length > 0 ? experiments.map((item) => `- ${item}`).join("\n") : "- none",
    "",
    "## Recent Papers",
    papers.length > 0 ? papers.map((item) => `- ${item}`).join("\n") : "- none",
    "",
    "## Wake Events",
    wakeEvents.length > 0 ? wakeEvents.map((item) => `- ${item}`).join("\n") : "- none",
    "",
    "## program.md",
    program.trim(),
    "",
    "## tools.md",
    tools.trim(),
  ].join("\n");
}
