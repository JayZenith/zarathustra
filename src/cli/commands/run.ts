import path from "node:path";
import type { MemoryRepo } from "../../memory/repo.js";
import { runHost } from "../../runtime/host.js";
import { recoverRunningCycle } from "../../runtime/restart.js";
import { loadRuntimeSettings } from "../../runtime/settings.js";
import { createOrResumeSession } from "../../runtime/session.js";

export async function runCommand(repo: MemoryRepo, args: string[]): Promise<void> {
  const settings = loadRuntimeSettings();
  const maxCycles = readNumberFlag(args, "--cycles");
  const delayMs = readNumberFlag(args, "--delay-ms") ?? settings.relaunch_delay_ms ?? settings.restart_delay_ms;
  const maxDelayMs = readNumberFlag(args, "--max-delay-ms") ?? settings.max_restart_delay_ms;
  const workdir = readStringFlag(args, "--cwd") ?? settings.workdir ?? process.cwd();
  const driverCmd = readStringFlag(args, "--driver") ?? process.env.ZARATHUSTRA_AGENT_CMD ?? settings.agent_command;
  const goal = readPositional(args) ?? settings.goal ?? "Continue autonomous work from the current repo state.";

  if (!driverCmd) {
    throw new Error("Missing agent command. Set ZARATHUSTRA_AGENT_CMD, pass --driver, or create zarathustra.json.");
  }

  const session = createOrResumeSession(repo, {
    goal,
    driverCmd,
    workdir: path.resolve(workdir),
  });
  recoverRunningCycle(repo, session.id);
  const options: { maxCycles?: number; delayMs?: number; maxDelayMs?: number } = {};
  if (maxCycles !== undefined) {
    options.maxCycles = maxCycles;
  }
  if (delayMs !== undefined) {
    options.delayMs = delayMs;
  }
  if (maxDelayMs !== undefined) {
    options.maxDelayMs = maxDelayMs;
  }
  await runHost(repo, session, options);
}

function readStringFlag(args: string[], flag: string): string | undefined {
  const index = args.indexOf(flag);
  return index >= 0 ? args[index + 1] : undefined;
}

function readNumberFlag(args: string[], flag: string): number | undefined {
  const value = readStringFlag(args, flag);
  return value ? Number(value) : undefined;
}

function readPositional(args: string[]): string | undefined {
  const filtered: string[] = [];
  for (let index = 0; index < args.length; index += 1) {
    const current = args[index]!;
    if (current === "--cycles" || current === "--delay-ms" || current === "--max-delay-ms" || current === "--cwd" || current === "--driver") {
      index += 1;
      continue;
    }
    if (!current.startsWith("--")) {
      filtered.push(current);
    }
  }
  return filtered.length > 0 ? filtered.join(" ") : undefined;
}
