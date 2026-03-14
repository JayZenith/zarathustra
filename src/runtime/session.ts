import os from "node:os";
import { createId } from "../lib/ids.js";
import { nowIso } from "../lib/time.js";
import type { MemoryRepo, SessionRecord } from "../memory/repo.js";

const LEASE_MS = 60_000;

export interface SessionOptions {
  goal: string;
  driverCmd: string;
  workdir: string;
}

export function createOrResumeSession(repo: MemoryRepo, options: SessionOptions): SessionRecord {
  const existing = repo.getRunningSession();
  if (existing) {
    return heartbeat(repo, existing);
  }

  const now = nowIso();
  const session: SessionRecord = {
    id: createId("session"),
    status: "running",
    goal: options.goal,
    driver_cmd: options.driverCmd,
    workdir: options.workdir,
    lease_owner: os.hostname(),
    lease_expires_at: new Date(Date.now() + LEASE_MS).toISOString(),
    last_heartbeat_at: now,
    last_exit_code: null,
    restart_count: 0,
    consecutive_failures: 0,
    next_wake_at: null,
    started_at: now,
    updated_at: now,
  };
  repo.insertSession(session);
  return session;
}

export function heartbeat(repo: MemoryRepo, session: SessionRecord): SessionRecord {
  const leaseExpiresAt = new Date(Date.now() + LEASE_MS).toISOString();
  repo.updateSessionHeartbeat(session.id, "running", session.lease_owner, leaseExpiresAt);
  return {
    ...session,
    lease_expires_at: leaseExpiresAt,
    last_heartbeat_at: nowIso(),
    updated_at: nowIso(),
  };
}

export function finishSession(repo: MemoryRepo, sessionId: string, status = "idle", exitCode: number | null = null): void {
  repo.finishSession(sessionId, status, exitCode);
}
