# zarathustra

`zarathustra` is a persistent host for an autonomous CLI agent.

It does three things:
- keeps one agent process running and relaunches it only after exit/crash
- stores runs, experiments, and paper notes in SQLite
- rehydrates the agent with `program.md`, `tools.md`, and compact prior state

## Setup

Create `zarathustra.json` or export `ZARATHUSTRA_AGENT_CMD`.

Example `zarathustra.json`:

```json
{
  "agent_command": "codex exec \"$(cat \\\"$ZARATHUSTRA_HANDOFF\\\")\"",
  "goal": "Continue autonomous research in this repo.",
  "workdir": ".",
  "relaunch_delay_ms": 2000
}
```

Or:

```bash
cp zarathustra.example.json zarathustra.json
```

## Run

```bash
bun install
bun run check
bun run src/cli/index.ts start
```

`relaunch_delay_ms` is only used after the agent process exits.

Useful commands:

```bash
bun run src/cli/index.ts status
bun run src/cli/index.ts db "select * from experiments order by started_at desc limit 5"
bun run src/cli/index.ts paper-search "optimizer scaling law"
bun run src/cli/index.ts paper-fetch 1706.03762
```
