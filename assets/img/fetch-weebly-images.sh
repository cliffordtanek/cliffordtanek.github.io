#!/usr/bin/env bash
# Almost everything now comes from your own archive. The only asset still
# living solely on Weebly is the multi-agent pathfinding report PDF.
# Run from the repo root:  bash assets/img/fetch-weebly-images.sh
#
# Weebly is shutting down, so grab this before it goes.

set -uo pipefail
cd "$(dirname "$0")"
mkdir -p ../docs
BASE="https://cliffordtanek.weebly.com/uploads/1/2/4/8/124841696"

printf '  %-38s ' "multi-agent-pathfinding-report.pdf"
if curl -fsSL --max-time 30 -o ../docs/multi-agent-pathfinding-report.pdf \
     "$BASE/ai_proposal_team_wo_ai_ni.pdf"; then
  echo "ok"
  echo
  echo "Now run: python3 tools/build_projects.py   (adds the report link)"
else
  echo "MISSING — download it manually from the Weebly page"
fi

echo
echo "Still has no image anywhere:"
echo "  parcellation.png   URA road network output (the P-01 card runs the live"
echo "                     demo instead, so this is optional)"
