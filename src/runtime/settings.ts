import { existsSync, readFileSync } from "node:fs";
import { PATHS } from "../lib/paths.js";

export interface RuntimeSettings {
  agent_command?: string;
  goal?: string;
  workdir?: string;
  restart_delay_ms?: number;
  max_restart_delay_ms?: number;
}

export function loadRuntimeSettings(): RuntimeSettings {
  if (!existsSync(PATHS.settings)) {
    return {};
  }
  return JSON.parse(readFileSync(PATHS.settings, "utf8")) as RuntimeSettings;
}
