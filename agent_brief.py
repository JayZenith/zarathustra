from __future__ import annotations

import argparse

from experiment_db import ExperimentDB
from research_memory import summarize_recent


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Generate a compact zarathustra agent brief.")
    parser.add_argument("--limit", type=int, default=6)
    return parser


def main() -> int:
    args = build_parser().parse_args()
    recent = summarize_recent(limit=args.limit)
    db = ExperimentDB()
    try:
        best = db.best_experiment()
    finally:
        db.close()

    print("Recent:")
    print(recent)
    print()
    if best is not None:
        print(f'Best: {float(best["val_bpb"]):.6f} | {best["description"]}')
        if best["lesson"]:
            print(f'Lesson: {best["lesson"]}')
    print()
    print("Required commands:")
    print("1. python3 agent_cycle.py")
    print('2. edit train.py')
    print('3. python3 one_cycle.py --description "<change>" --hypothesis "<why>" --lesson "<learned>"')
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
