from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

from experiment_db import DEFAULT_DB_PATH, ExperimentDB


@dataclass(frozen=True)
class RuleDecision:
    action: str
    topic: str
    reason: str


def decide_next_action(db_path: Path = DEFAULT_DB_PATH) -> RuleDecision:
    db = ExperimentDB(db_path)
    try:
        rows = db.recent_experiments(limit=6)
        if not rows:
            return RuleDecision(
                action="explore",
                topic="optimizer",
                reason="No experiment history yet.",
            )

        recent = list(rows)
        keeps = [row for row in recent if row["status"] == "keep"]
        discards = [row for row in recent if row["status"] == "discard"]
        recent_topics = [_infer_topic(row["description"]) for row in recent]
        latest_topic = recent_topics[0]

        if len(recent) >= 3 and all(
            row["status"] == "discard" and _infer_topic(row["description"]) == latest_topic
            for row in recent[:3]
        ):
            topic = latest_topic
            note_count = len(db.paper_notes_by_tag(topic, limit=3))
            if note_count == 0:
                return RuleDecision(
                    action="search_papers",
                    topic=topic,
                    reason=f"Recent {topic} experiments failed repeatedly and there are no stored paper notes.",
                )
            return RuleDecision(
                action="read_notes",
                topic=topic,
                reason=f"Recent {topic} experiments failed repeatedly; consult stored paper notes before more edits.",
            )

        if len(keeps) >= 2:
            topic = _infer_topic(keeps[0]["description"])
            return RuleDecision(
                action="exploit",
                topic=topic,
                reason=f"Recent {topic} changes are improving; stay local and ablate around the winning direction.",
            )

        return RuleDecision(
            action="explore",
            topic=latest_topic,
            reason=f"No clear repeated failure or winning streak in {latest_topic}.",
        )
    finally:
        db.close()


def _infer_topic(description: str) -> str:
    text = description.lower()
    if any(term in text for term in ("lr", "beta", "momentum", "muon", "adam", "embedding")):
        return "optimizer"
    if any(term in text for term in ("warm", "schedule", "decay", "final_lr")):
        return "schedule"
    if any(term in text for term in ("wd", "weight decay", "regular")):
        return "regularization"
    if any(term in text for term in ("depth", "glu", "relu", "silu", "rope", "window")):
        return "architecture"
    return "general"
