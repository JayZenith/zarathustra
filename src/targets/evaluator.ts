import type { TargetConfig } from "./config.js";

export interface ParsedMetrics {
  metrics: Record<string, number>;
  primaryMetricName: string;
  primaryMetricValue: number | null;
}

export function parseMetrics(output: string, target: TargetConfig): ParsedMetrics {
  const metrics: Record<string, number> = {};
  for (const [name, patternText] of Object.entries(target.eval.parser.patterns)) {
    const match = output.match(new RegExp(patternText, "m"));
    if (match?.[1]) {
      metrics[name] = Number(match[1]);
    }
  }
  return {
    metrics,
    primaryMetricName: target.eval.primary_metric.name,
    primaryMetricValue: metrics[target.eval.primary_metric.name] ?? null,
  };
}
