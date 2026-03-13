from __future__ import annotations

import argparse

from handoff import write_handoff
from state_store import RuntimeState, load_state, save_state


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="zarathustra loop controller")
    sub = parser.add_subparsers(dest="command", required=True)

    refresh = sub.add_parser("refresh")
    del refresh

    update = sub.add_parser("update")
    update.add_argument("--commit", required=True)
    update.add_argument("--status", required=True)
    update.add_argument("--description", required=True)
    update.add_argument("--hypothesis", default="")
    update.add_argument("--decision-action", default="")
    update.add_argument("--decision-topic", default="")
    update.add_argument("--decision-reason", default="")

    show = sub.add_parser("show")
    del show

    return parser


def main() -> int:
    args = build_parser().parse_args()

    if args.command == "refresh":
        state = load_state()
        write_handoff(state=state)
        print("refreshed")
        return 0

    if args.command == "update":
        old = load_state()
        state = RuntimeState(
            cycle_count=old.cycle_count + 1,
            last_commit=args.commit,
            last_status=args.status,
            last_description=args.description,
            last_hypothesis=args.hypothesis,
            last_decision_action=args.decision_action,
            last_decision_topic=args.decision_topic,
            last_decision_reason=args.decision_reason,
        )
        save_state(state)
        write_handoff(state=state)
        print("updated")
        return 0

    if args.command == "show":
        print(load_state())
        return 0

    return 1


if __name__ == "__main__":
    raise SystemExit(main())
