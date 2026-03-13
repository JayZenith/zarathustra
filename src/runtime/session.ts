import os from "node:os";
import { createId } from "../lib/ids.js";
import { nowIso } from "../lib/time.js";
import type { MemoryRepo, SessionRecord, TargetRecord } from "../memory/repo.js";

const LEASE_MS = 60_000;

export function createSession(repo: MemoryRepo, target: TargetRecord): SessionRecord {
  const now = nowIso();
  const session: SessionRecord = {
    id: createId("session"),
    target_id: target.id,
    status: "running",
    lease_owner: os.hostname(),
    lease_expires_at: new Date(Date.now() + LEASE_MS).toISOString(),
    started_at: now,
    updated_at: now,
  };
  repo.insertSession(session);
  return session;
}

export function renewLease(repo: MemoryRepo, session: SessionRecord): SessionRecord {
  const leaseExpiresAt = new Date(Date.now() + LEASE_MS).toISOString();
  repo.updateSession(session.id, "running", session.lease_owner, leaseExpiresAt);
  return {
    ...session,
    lease_expires_at: leaseExpiresAt,
    updated_at: nowIso(),
  };
}
