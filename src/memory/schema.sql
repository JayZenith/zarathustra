create table if not exists sessions (
  id text primary key,
  status text not null,
  goal text not null,
  driver_cmd text not null,
  workdir text not null,
  lease_owner text,
  lease_expires_at text,
  last_heartbeat_at text,
  last_exit_code integer,
  restart_count integer,
  consecutive_failures integer,
  next_wake_at text,
  started_at text not null,
  updated_at text not null
);

create table if not exists wake_events (
  id text primary key,
  session_id text not null references sessions(id),
  reason text not null,
  created_at text not null
);

create table if not exists cycles (
  id text primary key,
  session_id text not null references sessions(id),
  cycle_index integer not null,
  status text not null,
  prompt_snapshot_id text,
  summary text,
  started_at text not null,
  ended_at text
);

create table if not exists artifacts (
  id text primary key,
  session_id text not null references sessions(id),
  kind text not null,
  path text not null,
  sha256 text,
  size_bytes integer,
  created_at text not null
);

create table if not exists experiments (
  id text primary key,
  session_id text not null references sessions(id),
  label text,
  hypothesis text not null,
  change_summary text,
  status text not null,
  started_at text not null,
  ended_at text
);

create table if not exists experiment_results (
  id text primary key,
  experiment_id text not null references experiments(id),
  metric_name text not null,
  metric_value real not null,
  is_primary integer not null,
  result_json text not null
);

create table if not exists findings (
  id text primary key,
  session_id text not null references sessions(id),
  kind text not null,
  title text not null,
  body text not null,
  evidence_json text not null,
  confidence real,
  created_at text not null
);

create table if not exists decisions (
  id text primary key,
  session_id text not null references sessions(id),
  decision_type text not null,
  summary text not null,
  reasoning text not null,
  related_experiment_id text,
  created_at text not null
);

create table if not exists paper_notes (
  id text primary key,
  session_id text not null references sessions(id),
  source text not null,
  paper_id text,
  title text not null,
  summary text not null,
  notes text not null,
  relevance real,
  created_at text not null
);

create table if not exists memories (
  id text primary key,
  session_id text not null references sessions(id),
  memory_type text not null,
  text text not null,
  tags_json text not null,
  importance real not null,
  last_accessed_at text not null,
  created_at text not null
);
