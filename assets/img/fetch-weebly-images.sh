#!/usr/bin/env bash
# Pull the original project screenshots off the old Weebly site before it shuts down.
# Run this from the repo root:   bash assets/img/fetch-weebly-images.sh
#
# Each downloaded file lands at the exact filename index.html already points at,
# so the placeholder tiles turn into real screenshots with no HTML edits.

set -uo pipefail
cd "$(dirname "$0")"

BASE="https://cliffordtanek.weebly.com/uploads/1/2/4/8/124841696"

download() {
  local url="$1" out="$2"
  printf '  %-26s ' "$out"
  if curl -fsSL --max-time 30 -o "$out" "$url"; then
    echo "ok ($(du -h "$out" | cut -f1))"
  else
    echo "not found — grab it manually"
    rm -f "$out"
  fi
}

echo "Downloading project images from Weebly..."

download "$BASE/magique-cover_1.png"                       magique.png
download "$BASE/multi-agents-pathfinding-name_orig.png"    pathfinding.png
download "$BASE/astro-cow-main-menu.png"                   astro-cow.png
download "$BASE/makan-mania-main-menu.png"                 makan-mania.png
download "$BASE/map-1_orig.png"                            12x16.png
download "$BASE/portal-planet-level-and-cadence_orig.png"  portal-planet.png

echo
echo "Still needed (no image existed on the old site — screenshot these yourself):"
echo "  parcellation.png      URA road network / parcellation output"
echo "  seam-carving.png      the seam carving GUI mid-resize"
echo "  hole-in-the-wall.png  gameplay with the pose overlay"
echo "  destination-dash.png  the physical card game components"
echo "  peek-a-beak.png       the board and cards"
echo
echo "Recommended: 1600×900 (16:9), JPG or PNG, under ~300 KB each."
