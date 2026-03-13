# zarathustra tools

Run commands from `/home/jay-zenith/Desktop/zarathustra`.

## Build

```bash
bun install
bun run build
```

## Runtime

```bash
bun run src/cli/index.ts attach targets/autoresearch.example.yaml
bun run src/cli/index.ts run autoresearch
bun run src/cli/index.ts status
bun run src/cli/index.ts tui
```

## DB

```bash
bun run src/cli/index.ts db "select id, name, repo_path from targets order by id desc;"
```

## Rules

- `program.md` is the canonical brain spec.
- Target repos are attached by config, not by inheriting their prompts.
- Logs belong in `var/runs/` and should stay out of prompt context by default.
- Use stored memory before repeating work.
