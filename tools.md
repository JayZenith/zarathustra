# zarathustra tools

Use this file for the runtime tool surface, not for research strategy.

## Main commands

```bash
bun run src/cli/index.ts attach <target.yaml>
bun run src/cli/index.ts run <target-name> [max-cycles]
bun run src/cli/index.ts status
bun run src/cli/index.ts tui
bun run src/cli/index.ts db "<sql>"
bun run src/cli/index.ts paper-search "<query>"
bun run src/cli/index.ts paper-fetch <url-or-id>
```

## Rules

- `program.md` governs behavior.
- `tools.md` only describes available runtime commands.
- Logs stay in `var/runs/` unless a small slice is needed.
- Memory and paper tools support reasoning; they do not replace it.
