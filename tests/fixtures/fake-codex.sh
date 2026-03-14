#!/usr/bin/env bash
set -euo pipefail

if [[ -z "${ZARATHUSTRA_HANDOFF:-}" ]]; then
  echo "missing handoff" >&2
  exit 9
fi

echo "$ZARATHUSTRA_HANDOFF" >> "${ZARATHUSTRA_WORKDIR}/agent_invocations.log"
cat "$ZARATHUSTRA_HANDOFF" > /dev/null
echo "read handoff: $ZARATHUSTRA_HANDOFF"
