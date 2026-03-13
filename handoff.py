from __future__ import annotations

from pathlib import Path

from experiment_db import ExperimentDB
from research_memory import summarize_recent
from state_store import RuntimeState


HANDOFF_PATH = Path(__file__).resolve().parent / "AGENT_HANDOFF.md"


def write_handoff(*, state: RuntimeState, path: Path = HANDOFF_PATH) -> None:
    recent = summarize_recent(limit=6)
    db = ExperimentDB()
    try:
        best = db.best_experiment()
    finally:
        db.close()

    lines = [
        "# Agent Handoff",
        "",
        "## Runtime State",
        f"- cycle_count: {state.cycle_count}",
        f"- last_commit: {state.last_commit}",
        f"- last_status: {state.last_status}",
        f"- last_description: {state.last_description}",
        f"- last_hypothesis: {state.last_hypothesis}",
        "",
        "## Recent Experiments",
        recent,
        "",
        "## Best Experiment",
    ]

    if best is None:
        lines.append("- none")
    else:
        lines.append(f'- val_bpb: {float(best["val_bpb"]):.6f}')
        lines.append(f'- description: {best["description"]}')
        if best["lesson"]:
            lines.append(f'- lesson: {best["lesson"]}')

    lines.extend(
        [
        "",
        "## Research Policy",
        "- Use recent experiments, lessons, and paper notes as evidence.",
        "- Choose the next edit yourself; the repo does not prescribe it.",
        "- Record a concrete lesson every run.",
        "",
            "## Commands",
            "- `python3 agent_cycle.py`",
            "- `python3 agent_brief.py`",
            '- `python3 one_cycle.py --description "<change>" --hypothesis "<why>" --lesson "<learned>"`',
        ]
    )
    path.write_text("\n".join(lines) + "\n", encoding="utf-8")
