import { appendJsonLine } from "../lib/jsonl.js";
import { info } from "../lib/logger.js";
import { PATHS } from "../lib/paths.js";
import { createId } from "../lib/ids.js";
import { nowIso } from "../lib/time.js";
import type { TargetConfig } from "../targets/config.js";
import type { MemoryRepo, SessionRecord } from "../memory/repo.js";
import { buildRuntimeState } from "./state_builder.js";
import { buildPrompt } from "./prompt.js";
import { StubModelClient, type ModelClient } from "./model.js";
import { validatePlan } from "./agent_output.js";
import { executePlan } from "./executor.js";
import { reduceCycle } from "./reducer.js";
import { startCycle, finishCycle } from "../memory/stores/cycles.js";
import { waitForNextCycle } from "./scheduler.js";
import { renewLease } from "./session.js";

export interface RunOptions {
  maxCycles?: number;
  delayMs?: number;
}

export class RuntimeEngine {
  constructor(
    private readonly repo: MemoryRepo,
    private readonly target: TargetConfig,
    private readonly session: SessionRecord,
    private readonly model: ModelClient = new StubModelClient(),
  ) {}

  async run(options: RunOptions = {}): Promise<void> {
    const maxCycles = options.maxCycles ?? 1;
    const delayMs = options.delayMs ?? 1_000;
    let liveSession = this.session;

    for (let cycleIndex = 1; cycleIndex <= maxCycles; cycleIndex += 1) {
      liveSession = renewLease(this.repo, liveSession);
      const cycle = startCycle(this.repo, liveSession.id, cycleIndex);
      const state = buildRuntimeState(this.repo, liveSession, this.target);
      const prompt = await buildPrompt(state);
      const promptId = createId("prompt");

      this.repo.db
        .query(
          `
            insert into prompt_snapshots (
              id, session_id, cycle_id, input_text, token_estimate, created_at
            ) values (?, ?, ?, ?, ?, ?)
          `,
        )
        .run(promptId, liveSession.id, cycle.id, prompt, estimateTokens(prompt), nowIso());

      const plan = validatePlan(await this.model.plan(prompt));
      const toolResults = await executePlan(this.repo, liveSession.id, cycle.id, plan);
      const summary = reduceCycle(this.repo, liveSession.id, plan.objective, toolResults);

      finishCycle(this.repo, cycle.id, summary);
      await appendJsonLine(`${PATHS.runsDir}/${liveSession.id}/cycles.jsonl`, {
        cycleId: cycle.id,
        objective: plan.objective,
        summary,
      });
      info("cycle completed", { cycleId: cycle.id, objective: plan.objective });

      if (cycleIndex < maxCycles) {
        await waitForNextCycle(delayMs);
      }
    }
  }
}

function estimateTokens(input: string): number {
  return Math.ceil(input.length / 4);
}
