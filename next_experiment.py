from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

from experiment_db import DEFAULT_DB_PATH, ExperimentDB


@dataclass(frozen=True)
class ExperimentIdea:
    description: str
    hypothesis: str
    topic: str


IDEAS = [
    ExperimentIdea(
        description="slightly lower matrix learning rate",
        hypothesis="A100 may prefer a less aggressive matrix LR because step count is lower than H100.",
        topic="optimizer",
    ),
    ExperimentIdea(
        description="slightly higher warmdown ratio",
        hypothesis="Longer high-LR training on A100 may improve final bpb under the 5-minute budget.",
        topic="schedule",
    ),
    ExperimentIdea(
        description="small weight decay reduction",
        hypothesis="The current config may be over-regularized on A100 throughput budgets.",
        topic="regularization",
    ),
    ExperimentIdea(
        description="ablate embedding learning rate",
        hypothesis="Embedding LR may be contributing more than depth/width tweaks at current model scale.",
        topic="optimizer",
    ),
]


def choose_next_experiment(db_path: Path = DEFAULT_DB_PATH) -> ExperimentIdea | None:
    db = ExperimentDB(db_path)
    try:
        for idea in IDEAS:
            if not db.has_description(idea.description):
                return idea
        return None
    finally:
        db.close()
