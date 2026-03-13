# zarathustra

`zarathustra` is a TypeScript autonomous research-agent runtime.

It is built to excel at `autoresearch`-style loops first, without hardcoding a
single benchmark, repo layout, metric, or evaluation harness into the runtime.

## v1 principles

- one long-lived main agent
- canonical brain spec in [`program.md`](./program.md)
- explicit target attachment via config
- DB-backed durable memory
- restart-safe cycle execution
- strict context discipline: logs and artifacts stay on disk; prompts get only
  compact slices
- TypeScript orchestrates all tools; Python stays subordinate

## Layout

```text
src/
  cli/        command entrypoints
  runtime/    loop, state assembly, execution, restart handling
  memory/     SQLite schema and typed storage
  targets/    target config parsing and eval rules
  tools/      shell, file, git, paper, db, python adapters
  tui/        minimal terminal surface
  lib/        shared utilities
targets/      example target configs
var/          runtime artifacts and caches (gitignored)
```

## Commands

```bash
bun install
bun run build
bun run src/cli/index.ts attach targets/autoresearch.example.yaml
bun run src/cli/index.ts run autoresearch
bun run src/cli/index.ts status
bun run src/cli/index.ts tui
```

## Runtime model

Each cycle:

1. Load target config and compact state from SQLite.
2. Render `program.md` plus state into the agent prompt.
3. Ask the model for a structured action plan.
4. Execute tool calls through TypeScript adapters.
5. Store raw output as artifacts, then persist only structured summaries.
6. Schedule the next cycle and continue until stopped.

## Not in v1

- subagents
- browser automation
- distributed workers
- a web UI
- benchmark-specific runtime logic
