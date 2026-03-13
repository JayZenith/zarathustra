from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
import re
import time


@dataclass(frozen=True)
class RunSummary:
    val_bpb: float
    training_seconds: float
    peak_vram_mb: float
    total_tokens_m: float
    num_steps: int
    num_params_m: float
    depth: int


def parse_run_log(text: str) -> RunSummary | None:
    patterns = {
        "val_bpb": r"^val_bpb:\s+([\d.]+)",
        "training_seconds": r"^training_seconds:\s+([\d.]+)",
        "peak_vram_mb": r"^peak_vram_mb:\s+([\d.]+)",
        "total_tokens_m": r"^total_tokens_M:\s+([\d.]+)",
        "num_steps": r"^num_steps:\s+(\d+)",
        "num_params_m": r"^num_params_M:\s+([\d.]+)",
        "depth": r"^depth:\s+(\d+)",
    }
    values: dict[str, float | int] = {}
    for key, pattern in patterns.items():
        match = re.search(pattern, text, re.MULTILINE)
        if not match:
            return None
        values[key] = float(match.group(1)) if "." in match.group(1) else int(match.group(1))

    return RunSummary(
        val_bpb=float(values["val_bpb"]),
        training_seconds=float(values["training_seconds"]),
        peak_vram_mb=float(values["peak_vram_mb"]),
        total_tokens_m=float(values["total_tokens_m"]),
        num_steps=int(values["num_steps"]),
        num_params_m=float(values["num_params_m"]),
        depth=int(values["depth"]),
    )


def wait_for_summary(log_path: Path, timeout_s: float = 720.0, poll_s: float = 5.0) -> RunSummary | None:
    start = time.time()
    while time.time() - start < timeout_s:
        if log_path.exists():
            summary = parse_run_log(log_path.read_text(encoding="utf-8", errors="replace"))
            if summary is not None:
                return summary
        time.sleep(poll_s)
    return None
