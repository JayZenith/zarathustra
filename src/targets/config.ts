import { readFile } from "node:fs/promises";
import path from "node:path";
import YAML from "yaml";
import { PATHS } from "../lib/paths.js";

export type MetricGoal = "minimize" | "maximize";
export type GitMode = "branch_experiments" | "detached";

export interface CommandSpec {
  cmd: string;
  cwd?: string;
  timeout_sec?: number;
}

export interface TargetConfig {
  name: string;
  repo_path: string;
  goal: string;
  commands: {
    setup?: string[];
    run_experiment?: CommandSpec;
    collect_result?: CommandSpec;
  };
  eval: {
    primary_metric: {
      name: string;
      goal: MetricGoal;
    };
    parser: {
      type: "regex_map";
      source: string;
      patterns: Record<string, string>;
    };
  };
  constraints: string[];
  notes: string[];
  git?: {
    mode: GitMode;
    branch_prefix?: string;
    revert_on_regression?: boolean;
  };
}

export async function loadTargetConfig(targetRef: string): Promise<TargetConfig> {
  const filePath = resolveTargetPath(targetRef);
  const raw = await readFile(filePath, "utf8");
  const parsed = YAML.parse(raw) as TargetConfig;
  validateTargetConfig(parsed, filePath);
  return parsed;
}

export function resolveTargetPath(targetRef: string): string {
  if (targetRef.endsWith(".yaml") || targetRef.endsWith(".yml") || targetRef.endsWith(".json")) {
    return path.isAbsolute(targetRef) ? targetRef : path.join(PATHS.repoRoot, targetRef);
  }
  return path.join(PATHS.targetsDir, `${targetRef}.yaml`);
}

function validateTargetConfig(config: TargetConfig, filePath: string): void {
  if (!config.name) {
    throw new Error(`Target config at ${filePath} is missing name`);
  }
  if (!config.repo_path) {
    throw new Error(`Target config ${config.name} is missing repo_path`);
  }
  if (!config.goal) {
    throw new Error(`Target config ${config.name} is missing goal`);
  }
  if (!config.eval?.primary_metric?.name || !config.eval?.primary_metric?.goal) {
    throw new Error(`Target config ${config.name} is missing eval.primary_metric`);
  }
  if (config.eval.parser.type !== "regex_map") {
    throw new Error(`Target config ${config.name} parser type must be regex_map`);
  }
}
