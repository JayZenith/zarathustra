import { createId } from "../../lib/ids.js";
import { nowIso } from "../../lib/time.js";
import type { MemoryRepo } from "../repo.js";

export function recordExperiment(
  repo: MemoryRepo,
  sessionId: string,
  hypothesis: string,
  label: string | null = null,
  changeSummary: string | null = null,
  status = "planned",
): string {
  const id = createId("exp");
  repo.db
    .query(
      `
        insert into experiments (
          id, session_id, label, hypothesis, change_summary, status, started_at
        ) values (?, ?, ?, ?, ?, ?, ?)
      `,
    )
    .run(id, sessionId, label, hypothesis, changeSummary, status, nowIso());
  return id;
}

export function completeExperiment(
  repo: MemoryRepo,
  experimentId: string,
  status: string,
  changeSummary?: string,
): void {
  repo.db
    .query(
      `
        update experiments
        set status = ?, change_summary = coalesce(?, change_summary), ended_at = ?
        where id = ?
      `,
    )
    .run(status, changeSummary ?? null, nowIso(), experimentId);
}

export function recordExperimentMetric(
  repo: MemoryRepo,
  experimentId: string,
  metricName: string,
  metricValue: number,
  isPrimary: boolean,
  resultJson: string,
): void {
  repo.db
    .query(
      `
        insert into experiment_results (
          id, experiment_id, metric_name, metric_value, is_primary, result_json
        ) values (?, ?, ?, ?, ?, ?)
      `,
    )
    .run(createId("metric"), experimentId, metricName, metricValue, isPrimary ? 1 : 0, resultJson);
}
