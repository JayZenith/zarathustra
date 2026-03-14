import { mkdirSync, readFileSync } from "node:fs";
import { Database } from "bun:sqlite";
import { createId } from "../lib/ids.js";
import { PATHS } from "../lib/paths.js";
import { nowIso } from "../lib/time.js";

export interface SessionRecord {
  id: string;
  status: string;
  goal: string;
  driver_cmd: string;
  workdir: string;
  lease_owner: string | null;
  lease_expires_at: string | null;
  last_heartbeat_at: string | null;
  last_exit_code: number | null;
  restart_count: number | null;
  consecutive_failures: number | null;
  next_wake_at: string | null;
  started_at: string;
  updated_at: string;
}

export interface ExperimentRecord {
  id: string;
  session_id: string;
  label: string | null;
  hypothesis: string;
  change_summary: string | null;
  status: string;
  started_at: string;
  ended_at: string | null;
}

export interface ExperimentMetricRecord {
  id: string;
  experiment_id: string;
  metric_name: string;
  metric_value: number;
  is_primary: number;
  result_json: string;
}

export interface PaperNoteRecord {
  id: string;
  session_id: string;
  source: string;
  paper_id: string | null;
  title: string;
  summary: string;
  notes: string;
  relevance: number | null;
  created_at: string;
}

export class MemoryRepo {
  readonly db: Database;

  constructor(dbFile = PATHS.dbFile) {
    mkdirSync(PATHS.varDir, { recursive: true });
    this.db = new Database(dbFile);
    this.db.exec(readFileSync(PATHS.schemaFile, "utf8"));
    this.db.exec("pragma journal_mode = wal;");
    this.migrate();
  }

  insertSession(session: SessionRecord): void {
    this.db
      .query(
        `
          insert into sessions (
            id, status, goal, driver_cmd, workdir, lease_owner, lease_expires_at,
            last_heartbeat_at, last_exit_code, restart_count, consecutive_failures, next_wake_at, started_at, updated_at
          ) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
      )
      .run(
        session.id,
        session.status,
        session.goal,
        session.driver_cmd,
        session.workdir,
        session.lease_owner,
        session.lease_expires_at,
        session.last_heartbeat_at,
        session.last_exit_code,
        session.restart_count,
        session.consecutive_failures,
        session.next_wake_at,
        session.started_at,
        session.updated_at,
      );
  }

  updateSessionHeartbeat(sessionId: string, status: string, leaseOwner: string | null, leaseExpiresAt: string | null): void {
    const now = nowIso();
    this.db
      .query(
        `
          update sessions
          set status = ?, lease_owner = ?, lease_expires_at = ?, last_heartbeat_at = ?, updated_at = ?
          where id = ?
        `,
      )
      .run(status, leaseOwner, leaseExpiresAt, now, now, sessionId);
  }

  finishSession(sessionId: string, status: string, exitCode: number | null = null): void {
    this.db
      .query(
        `
          update sessions
          set status = ?, lease_owner = null, lease_expires_at = null, last_exit_code = coalesce(?, last_exit_code), updated_at = ?
          where id = ?
        `,
      )
      .run(status, exitCode, nowIso(), sessionId);
  }

  recordSessionExit(sessionId: string, exitCode: number | null): void {
    this.db
      .query(
        `
          update sessions
          set last_exit_code = ?, updated_at = ?,
              restart_count = coalesce(restart_count, 0) + 1,
              consecutive_failures = case when coalesce(?, 0) = 0 then 0 else coalesce(consecutive_failures, 0) + 1 end
          where id = ?
        `,
      )
      .run(exitCode, nowIso(), exitCode, sessionId);
  }

  setSessionWaiting(sessionId: string, nextWakeAt: string, reason: string): void {
    const now = nowIso();
    this.db
      .query(
        `
          update sessions
          set status = ?, next_wake_at = ?, updated_at = ?
          where id = ?
        `,
      )
      .run("waiting", nextWakeAt, now, sessionId);

    this.db
      .query(
        `
          insert into wake_events (id, session_id, reason, created_at)
          values (?, ?, ?, ?)
        `,
      )
      .run(createId("wake"), sessionId, reason, now);
  }

  getLatestSession(): SessionRecord | undefined {
    return this.db
      .query("select * from sessions where coalesce(driver_cmd, '') != '' order by started_at desc limit 1")
      .get() as SessionRecord | undefined;
  }

  getRunningSession(): SessionRecord | undefined {
    return this.db
      .query(
        "select * from sessions where status = 'running' and coalesce(driver_cmd, '') != '' order by started_at desc limit 1",
      )
      .get() as
      | SessionRecord
      | undefined;
  }

  getCycles(sessionId: string): Array<Record<string, unknown>> {
    return this.db
      .query("select * from cycles where session_id = ? order by cycle_index desc limit 20")
      .all(sessionId) as Array<Record<string, unknown>>;
  }

  getOpenCycle(sessionId: string): Record<string, unknown> | undefined {
    return this.db
      .query("select * from cycles where session_id = ? and status = 'running' order by started_at desc limit 1")
      .get(sessionId) as Record<string, unknown> | undefined;
  }

  getNextCycleIndex(sessionId: string): number {
    const row = this.db
      .query("select coalesce(max(cycle_index), 0) as max_cycle_index from cycles where session_id = ?")
      .get(sessionId) as { max_cycle_index: number } | null;
    return (row?.max_cycle_index ?? 0) + 1;
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

  getExperiments(sessionId: string): ExperimentRecord[] {
    return this.db
      .query("select * from experiments where session_id = ? order by started_at desc limit 20")
      .all(sessionId) as ExperimentRecord[];
  }

  getExperimentMetrics(experimentId: string): ExperimentMetricRecord[] {
    return this.db
      .query("select * from experiment_results where experiment_id = ? order by metric_name asc")
      .all(experimentId) as ExperimentMetricRecord[];
  }

  getRecentExperimentSummaries(sessionId: string): Array<Record<string, unknown>> {
    return this.db
      .query(
        `
          select
            e.id,
            e.label,
            e.hypothesis,
            e.change_summary,
            e.status,
            e.started_at,
            e.ended_at,
            group_concat(er.metric_name || '=' || er.metric_value, ', ') as metrics
          from experiments e
          left join experiment_results er on er.experiment_id = e.id
          where e.session_id = ?
          group by e.id
          order by e.started_at desc
          limit 10
        `,
      )
      .all(sessionId) as Array<Record<string, unknown>>;
  }

  getPaperNotes(sessionId: string): PaperNoteRecord[] {
    return this.db
      .query("select * from paper_notes where session_id = ? order by created_at desc limit 10")
      .all(sessionId) as PaperNoteRecord[];
  }

  getRecentArtifacts(sessionId: string): Array<Record<string, unknown>> {
    return this.db
      .query("select * from artifacts where session_id = ? order by created_at desc limit 10")
      .all(sessionId) as Array<Record<string, unknown>>;
  }

  getWakeEvents(sessionId: string): Array<Record<string, unknown>> {
    return this.db
      .query("select * from wake_events where session_id = ? order by created_at desc limit 10")
      .all(sessionId) as Array<Record<string, unknown>>;
  }

  getSessionStats(sessionId: string): Record<string, number> {
    const row = this.db
      .query(
        `
          select
            (select count(*) from cycles where session_id = ?) as cycle_count,
            (select count(*) from findings where session_id = ?) as finding_count,
            (select count(*) from decisions where session_id = ?) as decision_count,
            (select count(*) from artifacts where session_id = ?) as artifact_count,
            (select count(*) from experiments where session_id = ?) as experiment_count,
            (select count(*) from paper_notes where session_id = ?) as paper_note_count
        `,
      )
      .get(sessionId, sessionId, sessionId, sessionId, sessionId, sessionId) as Record<string, number> | null;

    return row ?? {
      cycle_count: 0,
      finding_count: 0,
      decision_count: 0,
      artifact_count: 0,
      experiment_count: 0,
      paper_note_count: 0,
    };
  }

  query(sql: string): Array<Record<string, unknown>> {
    return this.db.query(sql).all() as Array<Record<string, unknown>>;
  }

  private migrate(): void {
    const sessionColumns = this.db.query("pragma table_info(sessions)").all() as Array<{ name: string }>;
    if (sessionColumns.some((item) => item.name === "target_id")) {
      this.db.exec(`
        pragma foreign_keys = off;
        drop table if exists sessions_v2;
        create table sessions_v2 (
          id text primary key,
          status text not null,
          goal text not null,
          driver_cmd text not null,
          workdir text not null,
          lease_owner text,
          lease_expires_at text,
          last_heartbeat_at text,
          last_exit_code integer,
          started_at text not null,
          updated_at text not null
        );
        insert into sessions_v2 (
          id, status, goal, driver_cmd, workdir, lease_owner, lease_expires_at,
          last_heartbeat_at, last_exit_code, started_at, updated_at
        )
        select
          id,
          status,
          '',
          '',
          '',
          lease_owner,
          lease_expires_at,
          null,
          null,
          started_at,
          updated_at
        from sessions;
        drop table sessions;
        alter table sessions_v2 rename to sessions;
        pragma foreign_keys = on;
      `);
    }

    ensureColumn(this.db, "sessions", "goal", "text not null default ''");
    ensureColumn(this.db, "sessions", "driver_cmd", "text not null default ''");
    ensureColumn(this.db, "sessions", "workdir", "text not null default ''");
    ensureColumn(this.db, "sessions", "last_heartbeat_at", "text");
    ensureColumn(this.db, "sessions", "last_exit_code", "integer");
    ensureColumn(this.db, "sessions", "restart_count", "integer");
    ensureColumn(this.db, "sessions", "consecutive_failures", "integer");
    ensureColumn(this.db, "sessions", "next_wake_at", "text");
  }
}

function ensureColumn(db: Database, table: string, column: string, sqlType: string): void {
  const columns = db.query(`pragma table_info(${table})`).all() as Array<{ name: string }>;
  if (!columns.some((item) => item.name === column)) {
    db.exec(`alter table ${table} add column ${column} ${sqlType};`);
  }
}
