from __future__ import annotations

from dataclasses import asdict, dataclass
import json
from pathlib import Path


STATE_PATH = Path(__file__).resolve().parent / "runtime_state.json"


@dataclass(frozen=True)
class RuntimeState:
    cycle_count: int = 0
    last_commit: str = ""
    last_status: str = ""
    last_description: str = ""
    last_hypothesis: str = ""
    last_decision_action: str = ""
    last_decision_topic: str = ""
    last_decision_reason: str = ""


def load_state(path: Path = STATE_PATH) -> RuntimeState:
    if not path.exists():
        return RuntimeState()
    data = json.loads(path.read_text(encoding="utf-8"))
    return RuntimeState(**data)


def save_state(state: RuntimeState, path: Path = STATE_PATH) -> None:
    path.write_text(json.dumps(asdict(state), indent=2) + "\n", encoding="utf-8")
