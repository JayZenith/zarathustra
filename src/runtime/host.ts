import { createWriteStream } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import path from "node:path";
import type { MemoryRepo, SessionRecord } from "../memory/repo.js";
import { PATHS } from "../lib/paths.js";
import { recordArtifact } from "../memory/stores/artifacts.js";
import { startCycle, finishCycle } from "../memory/stores/cycles.js";
import { waitForNextCycle } from "./scheduler.js";
import { buildHandoff } from "./handoff.js";
import { heartbeat, finishSession } from "./session.js";

export interface HostOptions {
  maxCycles?: number;
  delayMs?: number;
  maxDelayMs?: number;
}

export async function runHost(repo: MemoryRepo, session: SessionRecord, options: HostOptions = {}): Promise<void> {
  const maxCycles = options.maxCycles ?? Number.POSITIVE_INFINITY;
  const delayMs = options.delayMs ?? 2_000;
  const maxDelayMs = options.maxDelayMs ?? 30_000;
  let liveSession = session;

  for (let count = 0; count < maxCycles; count += 1) {
    liveSession = heartbeat(repo, liveSession);
    const cycle = startCycle(repo, liveSession.id, repo.getNextCycleIndex(liveSession.id));
    const cycleDir = path.join(PATHS.runsDir, liveSession.id, `cycle-${cycle.cycleIndex}`);
    await mkdir(cycleDir, { recursive: true });

    const handoff = await buildHandoff(repo, liveSession);
    const handoffPath = path.join(cycleDir, "handoff.md");
    await writeFile(handoffPath, handoff, "utf8");
    await recordArtifact(repo, liveSession.id, "handoff", handoffPath);

    const stdoutPath = path.join(cycleDir, "stdout.log");
    const stderrPath = path.join(cycleDir, "stderr.log");
    const exitCode = await runAgentProcess(liveSession, handoffPath, stdoutPath, stderrPath);

    await recordArtifact(repo, liveSession.id, "agent_stdout", stdoutPath);
    await recordArtifact(repo, liveSession.id, "agent_stderr", stderrPath);
    finishCycle(repo, cycle.id, exitCode === 0 ? "agent exited cleanly" : `agent exited with code ${exitCode}`, exitCode === 0 ? "completed" : "failed");
    repo.recordSessionExit(liveSession.id, exitCode);
    liveSession = repo.getLatestSession() ?? liveSession;

    if (count + 1 < maxCycles) {
      const waitMs = exitCode === 0
        ? delayMs
        : Math.min(delayMs * Math.max(1, 2 ** ((liveSession.consecutive_failures ?? 1) - 1)), maxDelayMs);
      repo.setSessionWaiting(liveSession.id, new Date(Date.now() + waitMs).toISOString(), exitCode === 0 ? "cycle delay" : `restart after exit code ${exitCode}`);
      await waitForNextCycle(waitMs);
    }
  }

  finishSession(repo, liveSession.id, "idle");
}

async function runAgentProcess(
  session: SessionRecord,
  handoffPath: string,
  stdoutPath: string,
  stderrPath: string,
): Promise<number> {
  return await new Promise((resolve, reject) => {
    const stdout = createWriteStream(stdoutPath, { flags: "w" });
    const stderr = createWriteStream(stderrPath, { flags: "w" });
    const child = spawn("bash", ["-lc", session.driver_cmd], {
      cwd: session.workdir,
      env: {
        ...process.env,
        ZARATHUSTRA_SESSION_ID: session.id,
        ZARATHUSTRA_WORKDIR: session.workdir,
        ZARATHUSTRA_GOAL: session.goal,
        ZARATHUSTRA_PROGRAM: PATHS.program,
        ZARATHUSTRA_TOOLS: PATHS.tools,
        ZARATHUSTRA_DB_PATH: PATHS.dbFile,
        ZARATHUSTRA_HANDOFF: handoffPath,
      },
    });

    child.stdout.pipe(stdout);
    child.stderr.pipe(stderr);
    child.once("error", reject);
    child.once("close", (code) => resolve(code ?? 0));
  });
}
