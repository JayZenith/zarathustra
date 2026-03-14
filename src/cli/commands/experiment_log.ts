import type { MemoryRepo } from "../../memory/repo.js";
import { completeExperiment, recordExperiment, recordExperimentMetric } from "../../memory/stores/experiments.js";

interface ExperimentPayload {
  hypothesis: string;
  label?: string;
  change_summary?: string;
  status?: string;
  metrics?: Record<string, number>;
  primary_metric?: string;
}

export function experimentLogCommand(repo: MemoryRepo, payloadText: string): void {
  const session = repo.getLatestSession();
  if (!session) {
    throw new Error("No session available for experiment logging");
  }

  const payload = JSON.parse(payloadText) as ExperimentPayload;
  const status = payload.status ?? "completed";
  const experimentId = recordExperiment(
    repo,
    session.id,
    payload.hypothesis,
    payload.label ?? null,
    payload.change_summary ?? null,
    status === "completed" ? "running" : status,
  );

  for (const [name, value] of Object.entries(payload.metrics ?? {})) {
    recordExperimentMetric(
      repo,
      experimentId,
      name,
      Number(value),
      name === payload.primary_metric,
      JSON.stringify(payload.metrics ?? {}),
    );
  }

  if (status !== "running" && status !== "planned") {
    completeExperiment(repo, experimentId, status, payload.change_summary);
  }

  process.stdout.write(`${JSON.stringify({ experiment_id: experimentId }, null, 2)}\n`);
}
