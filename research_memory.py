from __future__ import annotations

from pathlib import Path

from experiment_db import DEFAULT_DB_PATH, ExperimentDB


def record_lesson(
    *,
    topic: str,
    hypothesis: str,
    outcome: str,
    lesson: str,
    experiment_id: int | None = None,
    db_path: Path = DEFAULT_DB_PATH,
) -> None:
    db = ExperimentDB(db_path)
    try:
        db.add_observation(
            topic=topic,
            note=f"Hypothesis: {hypothesis}\nOutcome: {outcome}\nLesson: {lesson}",
            experiment_id=experiment_id,
        )
    finally:
        db.close()


def summarize_recent(db_path: Path = DEFAULT_DB_PATH, limit: int = 8) -> str:
    db = ExperimentDB(db_path)
    try:
        rows = db.recent_experiments(limit=limit)
        if not rows:
            return "No experiments recorded yet."
        lines = []
        for row in rows:
            lines.append(
                f"{row['commit_hash']} | {row['status']} | val_bpb={row['val_bpb']:.6f} | "
                f"{row['description']}"
            )
            if row["lesson"]:
                lines.append(f"  lesson: {row['lesson']}")
        return "\n".join(lines)
    finally:
        db.close()
