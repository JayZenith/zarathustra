import { afterEach, describe, expect, mock, test } from "bun:test";
import { chmodSync, existsSync, mkdirSync, readFileSync, rmSync } from "node:fs";
import path from "node:path";
import { paperFetchCommand } from "../src/cli/commands/paper_fetch.ts";
import { MemoryRepo } from "../src/memory/repo.ts";
import { startCycle } from "../src/memory/stores/cycles.ts";
import { recordPaperNote } from "../src/memory/stores/papers.ts";
import { recoverRunningCycle } from "../src/runtime/restart.ts";
import { runHost } from "../src/runtime/host.ts";
import { createOrResumeSession } from "../src/runtime/session.ts";
import { experimentLogCommand } from "../src/cli/commands/experiment_log.ts";

const tempFiles: string[] = [];

afterEach(() => {
  for (const file of tempFiles.splice(0)) {
    rmSync(file, { force: true, recursive: true });
  }
});

describe("zarathustra host", () => {
  test("resumes the latest running session", () => {
    const repo = makeRepo();
    const first = createOrResumeSession(repo, {
      goal: "keep going",
      driverCmd: "printf ok",
      workdir: process.cwd(),
    });
    const second = createOrResumeSession(repo, {
      goal: "ignored",
      driverCmd: "printf ignored",
      workdir: process.cwd(),
    });

    expect(second.id).toBe(first.id);
  });

  test("supervises one agent cycle and writes artifacts", async () => {
    const repo = makeRepo();
    const session = createOrResumeSession(repo, {
      goal: "test host",
      driverCmd: "printf agent-output",
      workdir: process.cwd(),
    });

    await runHost(repo, session, { maxCycles: 1, delayMs: 1 });

    const cycles = repo.getCycles(session.id);
    const artifacts = repo.getRecentArtifacts(session.id);
    expect(cycles[0]?.status).toBe("completed");
    expect(artifacts.length).toBeGreaterThanOrEqual(3);
    expect(existsSync(String(artifacts[0]?.path ?? ""))).toBe(true);
    const handoff = artifacts.find((item) => item.kind === "handoff");
    expect(handoff).toBeDefined();
    const handoffText = readFileSync(String(handoff!.path), "utf8");
    expect(handoffText).toContain("# zarathustra handoff");
    expect(handoffText).toContain("## program.md");
  });

  test("marks failed cycles when the agent process exits non-zero", async () => {
    const repo = makeRepo();
    const session = createOrResumeSession(repo, {
      goal: "test failure",
      driverCmd: "echo boom >&2; exit 7",
      workdir: process.cwd(),
    });

    await runHost(repo, session, { maxCycles: 1, delayMs: 1 });

    const latest = repo.getLatestSession()!;
    const cycles = repo.getCycles(session.id);
    expect(cycles[0]?.status).toBe("failed");
    expect(cycles[0]?.summary).toBe("agent exited with code 7");
    expect(latest.last_exit_code).toBe(7);
  });

  test("records wake events and backoff after failures", async () => {
    const repo = makeRepo();
    const session = createOrResumeSession(repo, {
      goal: "backoff",
      driverCmd: "exit 3",
      workdir: process.cwd(),
    });

    await runHost(repo, session, { maxCycles: 2, delayMs: 1, maxDelayMs: 10 });

    const latest = repo.getLatestSession()!;
    const wakeEvents = repo.getWakeEvents(session.id);
    expect(latest.restart_count).toBe(2);
    expect(latest.consecutive_failures).toBe(2);
    expect(wakeEvents.length).toBeGreaterThanOrEqual(1);
    expect(String(wakeEvents[0]?.reason ?? "")).toContain("restart after exit code 3");
  });

  test("recovers a running cycle as interrupted", () => {
    const repo = makeRepo();
    const session = createOrResumeSession(repo, {
      goal: "recover cycle",
      driverCmd: "printf ok",
      workdir: process.cwd(),
    });

    const cycle = startCycle(repo, session.id, 1);
    recoverRunningCycle(repo, session.id);

    const cycles = repo.getCycles(session.id);
    expect(cycles.find((item) => item.id === cycle.id)?.status).toBe("interrupted");
  });

  test("logs experiments from a JSON payload", () => {
    const repo = makeRepo();
    createOrResumeSession(repo, {
      goal: "log experiment",
      driverCmd: "printf ok",
      workdir: process.cwd(),
    });

    experimentLogCommand(
      repo,
      JSON.stringify({
        hypothesis: "lower wd helps",
        status: "completed",
        change_summary: "wd 0.15 -> 0.145",
        primary_metric: "val_bpb",
        metrics: {
          val_bpb: 0.9661,
        },
      }),
    );

    const session = repo.getLatestSession()!;
    const experiments = repo.getExperiments(session.id);
    const metrics = repo.getExperimentMetrics(experiments[0]!.id);
    expect(experiments[0]?.status).toBe("completed");
    expect(metrics[0]?.metric_name).toBe("val_bpb");
    expect(metrics[0]?.metric_value).toBe(0.9661);
  });

  test("stores a paper note from paper-fetch", async () => {
    const repo = makeRepo();
    createOrResumeSession(repo, {
      goal: "paper fetch",
      driverCmd: "printf ok",
      workdir: process.cwd(),
    });

    const originalFetch = globalThis.fetch;
    globalThis.fetch = mock(async () =>
      new Response(
        [
          "<feed>",
          "<entry>",
          "<id>http://arxiv.org/abs/1706.03762v7</id>",
          "<title>Attention Is All You Need</title>",
          "<summary>Transformer paper summary.</summary>",
          "<published>2017-06-12T17:57:34Z</published>",
          "<updated>2023-08-02T00:41:18Z</updated>",
          "<author><name>Ashish Vaswani</name></author>",
          "</entry>",
          "</feed>",
        ].join(""),
        { status: 200 },
      ),
    ) as typeof fetch;

    try {
      await paperFetchCommand(repo, "1706.03762");
    } finally {
      globalThis.fetch = originalFetch;
    }

    const session = repo.getLatestSession()!;
    const papers = repo.getPaperNotes(session.id);
    expect(papers).toHaveLength(1);
    expect(papers[0]?.title).toBe("Attention Is All You Need");
  });

  test("supervisor relaunches the agent and rebuilds handoff state", async () => {
    const repo = makeRepo();
    const workdir = path.join("/tmp", `zarathustra-work-${Date.now()}-${Math.random().toString(16).slice(2)}`);
    tempFiles.push(workdir);
    mkdirSync(workdir, { recursive: true });

    const shim = path.join(process.cwd(), "tests", "fixtures", "fake-codex.sh");
    chmodSync(shim, 0o755);

    const session = createOrResumeSession(repo, {
      goal: "continue autonomous work",
      driverCmd: `bash ${shim}`,
      workdir,
    });

    experimentLogCommand(
      repo,
      JSON.stringify({
        hypothesis: "test handoff memory",
        status: "completed",
        change_summary: "baseline",
        primary_metric: "score",
        metrics: { score: 1.0 },
      }),
    );
    recordPaperNote(repo, session.id, "paper-1", "Test Paper", "Paper summary", "useful note", "manual");

    await runHost(repo, session, { maxCycles: 2, delayMs: 1 });

    const invocations = readFileSync(path.join(workdir, "agent_invocations.log"), "utf8")
      .trim()
      .split("\n")
      .filter(Boolean);

    expect(invocations).toHaveLength(2);

    const firstHandoff = readFileSync(invocations[0]!, "utf8");
    const secondHandoff = readFileSync(invocations[1]!, "utf8");

    expect(firstHandoff).toContain("## program.md");
    expect(firstHandoff).toContain("## tools.md");
    expect(firstHandoff).toContain("Test Paper: useful note");
    expect(firstHandoff).toContain("completed baseline score=1");
    expect(firstHandoff).toContain("restart_count=0");

    expect(secondHandoff).toContain("## Recent Cycles");
    expect(secondHandoff).toContain("agent exited cleanly");
  });
});

function makeRepo(): MemoryRepo {
  const file = path.join("/tmp", `zarathustra-test-${Date.now()}-${Math.random().toString(16).slice(2)}.sqlite`);
  tempFiles.push(file);
  return new MemoryRepo(file);
}
