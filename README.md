# zarathustra

`zarathustra` is a minimal autonomous research loop helper for
`/home/jay-zenith/Desktop/autoresearch`.

It is not a full agent platform. It adds only the missing research-rigor
pieces:

- `experiments.db` for durable experiment memory
- structured observations and hypotheses
- run log parsing
- next-experiment suggestion
- targeted paper notes

## Files

- `experiment_db.py` — SQLite schema and access layer
- `research_memory.py` — structured notes on what was learned
- `run_watcher.py` — parse training logs and summaries
- `next_experiment.py` — choose the next experiment idea from evidence
- `paper_notes.py` — store and retrieve paper notes by topic
- `program.md` — instructions for the agent using this repo

## Scope

This project is intentionally narrow:

- no UI
- no provider abstraction
- no SSH layer
- no generic agent runtime

It is meant to sit next to `autoresearch`, not replace it.
