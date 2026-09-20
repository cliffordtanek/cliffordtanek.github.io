#!/usr/bin/env bash
# Pull every original image and report PDF off the old Weebly site before it
# shuts down. Run from the repo root:   bash assets/img/fetch-weebly-images.sh
#
# Filenames match exactly what index.html and projects/*.html already point at,
# so placeholders turn into real screenshots with no HTML edits.

set -uo pipefail
cd "$(dirname "$0")"
DOCS="../docs"
mkdir -p "$DOCS"

BASE="https://cliffordtanek.weebly.com/uploads/1/2/4/8/124841696"

get() {
  local url="$1" out="$2"
  printf '  %-30s ' "$out"
  if curl -fsSL --max-time 30 -o "$out" "$url"; then
    echo "ok ($(du -h "$out" | cut -f1))"
  else
    echo "MISSING — grab manually"
    rm -f "$out"
  fi
}

echo "Images:"
get "$BASE/magique-cover_1.png"                          magique.png
get "$BASE/mainmenu.png"                                 magique-menu.png
get "$BASE/magique-logo_orig.png"                        magique-logo.png
get "$BASE/multi-agents-pathfinding-name_orig.png"       pathfinding.png
get "$BASE/title_orig.png"                               seam-carving.png
get "$BASE/holeinthewall-mainmenu.png"                   hole-in-the-wall.png
get "$BASE/holeinthewall-title2_orig.png"                hitw-title.png
get "$BASE/editor/holeinthewall-technicaloverview.png"   hitw-technical.png
get "$BASE/astro-cow-main-menu.png"                      astro-cow.png
get "$BASE/astrocow-logo_orig.png"                       astro-cow-logo.png
get "$BASE/makan-mania-main-menu.png"                    makan-mania.png
get "$BASE/makan-mania-title-gif_orig.gif"               makan-mania-title.gif
get "$BASE/editor/cover.jpg"                             destination-dash.png
get "$BASE/destination-dash-title_orig.png"              destination-dash-title.png
get "$BASE/published/cover.jpg"                          peek-a-beak.png
get "$BASE/peak-a-beak-title_orig.png"                   peek-a-beak-title.png
get "$BASE/map-1_orig.png"                               12x16.png
get "$BASE/map-3_orig.png"                               1000m2.png
get "$BASE/1000m2-title_orig.png"                        1000m2-title.png
get "$BASE/1-million-map.png"                            pirate-adventure.png
get "$BASE/swinging-skyway-level-and-cadence_orig.png"   swinging-skyway.png
get "$BASE/portal-planet-level-and-cadence_orig.png"     portal-planet.png
get "$BASE/bouncy-balloon-level-and-cadence_orig.png"    bouncy-balloon.png

echo
echo "Report PDFs:"
get "$BASE/ai_proposal_team_wo_ai_ni.pdf"  "$DOCS/multi-agent-pathfinding-report.pdf"
get "$BASE/seam_carving_report.pdf"        "$DOCS/seam-carving-report.pdf"

echo
echo "No image existed on Weebly for these — screenshot them yourself:"
echo "  parcellation.png    URA road network / parcellation output"
echo
echo "Recommended: 16:9, ~1600x900, under ~300 KB each."
