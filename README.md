# zarathustra

`zarathustra` is a Bun + TypeScript autonomous research-agent runtime.

It is built for strong autonomous research loops first, without hardcoding a
single benchmark into the runtime.

## Principles

- one main agent
- canonical brain in [`program.md`](./program.md)
- target-specific behavior from attached config
- SQLite durable memory
- compact context, external artifacts
- tools serve judgment

## Core commands

```bash
bun install
bun run check
bun run src/cli/index.ts attach targets/autoresearch.example.yaml
bun run src/cli/index.ts run autoresearch
bun run src/cli/index.ts status
```
