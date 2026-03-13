from __future__ import annotations

from pathlib import Path

from next_experiment import choose_next_experiment
from research_memory import summarize_recent
from rule_engine import decide_next_action
from state_store import RuntimeState


HANDOFF_PATH = Path(__file__).resolve().parent / "AGENT_HANDOFF.md"


def write_handoff(*, state: RuntimeState, path: Path = HANDOFF_PATH) -> None:
    recent = summarize_recent(limit=6)
    decision = decide_next_action()
    idea = choose_next_experiment()

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
        "## Rule Decision",
        f"- action: {decision.action}",
        f"- topic: {decision.topic}",
        f"- reason: {decision.reason}",
        "",
        "## Next Suggested Idea",
    ]

    if idea is None:
        lines.append("- none")
    else:
        lines.append(f"- description: {idea.description}")
        lines.append(f"- hypothesis: {idea.hypothesis}")
        lines.append(f"- topic: {idea.topic}")

    lines.extend(
        [
            "",
            "## Commands",
            "- `python3 agent_cycle.py`",
            "- `python3 agent_brief.py`",
            '- `python3 one_cycle.py --description "<change>" --hypothesis "<why>"`',
        ]
    )
    path.write_text("\n".join(lines) + "\n", encoding="utf-8")
