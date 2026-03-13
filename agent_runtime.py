from __future__ import annotations

import argparse
from pathlib import Path
import shlex
import subprocess
import time

from handoff import write_handoff
from prompt_builder import write_prompt
from state_store import load_state


REPO_ROOT = Path(__file__).resolve().parent
RUNTIME_LOG = REPO_ROOT / "agent_runtime.log"


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Run repeated zarathustra agent cycles through an external agent CLI.")
    parser.add_argument(
        "--agent-cmd",
        required=True,
        help="Shell command template. May use {prompt_file} and {repo_root}. Example: claude -p \"$(cat {prompt_file})\"",
    )
    parser.add_argument("--cycles", type=int, default=1)
    parser.add_argument("--sleep-seconds", type=int, default=5)
    return parser


def main() -> int:
    args = build_parser().parse_args()

    for cycle_idx in range(args.cycles):
        state = load_state()
        write_handoff(state=state)
        prompt_file = write_prompt()
        cmd = args.agent_cmd.format(prompt_file=str(prompt_file), repo_root=str(REPO_ROOT))

        _log(f"cycle={cycle_idx + 1} cmd={cmd}")
        completed = subprocess.run(
            cmd,
            cwd=REPO_ROOT,
            shell=True,
        )
        _log(f"cycle={cycle_idx + 1} exit={completed.returncode}")
        if completed.returncode != 0:
            return completed.returncode
        if cycle_idx + 1 < args.cycles:
            time.sleep(args.sleep_seconds)
    return 0


def _log(text: str) -> None:
    with RUNTIME_LOG.open("a", encoding="utf-8") as handle:
        handle.write(text + "\n")


if __name__ == "__main__":
    raise SystemExit(main())
