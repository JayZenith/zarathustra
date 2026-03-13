import { mkdirSync, readFileSync } from "node:fs";
import { Database } from "bun:sqlite";
import { PATHS } from "../lib/paths.js";
import { nowIso } from "../lib/time.js";

export interface TargetRecord {
  id: number;
  name: string;
  repo_path: string;
  config_json: string;
  created_at: string;
  updated_at: string;
}

export interface SessionRecord {
  id: string;
  target_id: number;
  status: string;
  lease_owner: string | null;
  lease_expires_at: string | null;
  started_at: string;
  updated_at: string;
}

export class MemoryRepo {
  readonly db: Database;

  constructor(dbFile = PATHS.dbFile) {
    mkdirSync(PATHS.varDir, { recursive: true });
    this.db = new Database(dbFile);
    this.db.exec(readFileSync(PATHS.schemaFile, "utf8"));
    this.db.exec("pragma journal_mode = wal;");
  }

  upsertTarget(name: string, repoPath: string, configJson: string): TargetRecord {
    const now = nowIso();
    this.db
      .query(
        `
          insert into targets (name, repo_path, config_json, created_at, updated_at)
          values (?, ?, ?, ?, ?)
          on conflict(name) do update set
            repo_path = excluded.repo_path,
            config_json = excluded.config_json,
            updated_at = excluded.updated_at
        `,
      )
      .run(name, repoPath, configJson, now, now);

    return this.getTargetByName(name);
  }

  getTargetByName(name: string): TargetRecord {
    const row = this.db.query("select * from targets where name = ?").get(name) as TargetRecord | null;
    if (!row) {
      throw new Error(`Unknown target: ${name}`);
    }
    return row;
  }

  listTargets(): TargetRecord[] {
    return this.db.query("select * from targets order by id asc").all() as TargetRecord[];
  }

  insertSession(session: SessionRecord): void {
    this.db
      .query(
        `
          insert into sessions (
            id, target_id, status, lease_owner, lease_expires_at, started_at, updated_at
          ) values (
            ?, ?, ?, ?, ?, ?, ?
          )
        `,
      )
      .run(
        session.id,
        session.target_id,
        session.status,
        session.lease_owner,
        session.lease_expires_at,
        session.started_at,
        session.updated_at,
      );
  }

  updateSession(sessionId: string, status: string, leaseOwner: string | null, leaseExpiresAt: string | null): void {
    this.db
      .query(
        `
          update sessions
          set status = ?, lease_owner = ?, lease_expires_at = ?, updated_at = ?
          where id = ?
        `,
      )
      .run(status, leaseOwner, leaseExpiresAt, nowIso(), sessionId);
  }

  getLatestSession(): SessionRecord | undefined {
    return this.db.query("select * from sessions order by started_at desc limit 1").get() as
      | SessionRecord
      | undefined;
  }

  getCycles(sessionId: string): Array<Record<string, unknown>> {
    return this.db
      .query("select * from cycles where session_id = ? order by cycle_index desc limit 20")
      .all(sessionId) as Array<Record<string, unknown>>;
  }

  getFindings(sessionId: string): Array<Record<string, unknown>> {
    return this.db
      .query("select * from findings where session_id = ? order by created_at desc limit 20")
      .all(sessionId) as Array<Record<string, unknown>>;
  }

  getDecisions(sessionId: string): Array<Record<string, unknown>> {
    return this.db
      .query("select * from decisions where session_id = ? order by created_at desc limit 20")
      .all(sessionId) as Array<Record<string, unknown>>;
  }

  query(sql: string): Array<Record<string, unknown>> {
    return this.db.query(sql).all() as Array<Record<string, unknown>>;
  }
}
