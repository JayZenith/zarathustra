from __future__ import annotations

from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parent
PROMPT_PATH = REPO_ROOT / "AGENT_PROMPT.md"


def build_prompt() -> str:
    sections = []
    for name in ("README.md", "program.md", "runtime.md", "tools.md", "AGENT_HANDOFF.md"):
        path = REPO_ROOT / name
        if not path.exists():
            continue
        sections.append(f"# {name}\n\n{path.read_text(encoding='utf-8')}")
    sections.append(
        "# Required Behavior\n\n"
        "You are running one zarathustra research cycle.\n"
        "Read the documents above.\n"
        "Then do exactly one cycle:\n"
        "1. inspect the current state\n"
        "2. make one small edit to train.py\n"
        "3. commit the change\n"
        "4. run python3 one_cycle.py with a precise description and hypothesis\n"
        "5. stop after the run is fully ingested and the repo state is updated\n"
        "Do not start a second experiment in the same invocation.\n"
    )
    return "\n\n".join(sections) + "\n"


def write_prompt(path: Path = PROMPT_PATH) -> Path:
    path.write_text(build_prompt(), encoding="utf-8")
    return path


if __name__ == "__main__":
    print(write_prompt())
