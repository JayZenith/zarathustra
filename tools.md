# zarathustra tools

Use these commands yourself when needed.

## Runtime

```bash
bun run src/cli/index.ts status
bun run src/cli/index.ts db "<sql>"
```

## Papers

```bash
bun run src/cli/index.ts paper-search "<query>"
bun run src/cli/index.ts paper-fetch <url-or-id>
```

`paper-fetch` also stores a paper note in the DB for the latest session.

## Experiments

```bash
bun run src/cli/index.ts experiment-log '<json>'
```

Example:

```json
{"hypothesis":"lower wd helps","status":"completed","change_summary":"wd 0.15 -> 0.145","primary_metric":"val_bpb","metrics":{"val_bpb":0.9661}}
```
