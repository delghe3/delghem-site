#!/usr/bin/env bash
# Social previews composed solely of REAL DÈLGHEM D2 app screenshots and
# real Kratos solver-derived 2D shell plots. No synthetic analysis claims.
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "$BASH_SOURCE")" && pwd)"
cd "$SCRIPT_DIR/.."
mkdir -p assets/social
font='assets/Manrope.ttf'
plot='assets/fem-lab/gallery/surface-skewed-double-opening-slab.webp'
test -f "$font" && test -f "$plot"
build_social(){
  lang="$1"
  app="assets/genius/genius-workflow-$lang.webp"
  out="assets/social/delghem-apple-silicon-$lang.png"
  test -f "$app"
  if [ "$lang" = 'it' ];then
    kicker='INGEGNERIA STRUTTURALE / MAC'
    headline='Genius Assistant'
    line='Descrivi. Controlla. Applica.'
    sub='Mappe FEM 2D calcolate con Kratos'
    second='Modelli D2 e risultati documentati'
    status='vAlpha1 in sviluppo · gennaio 2027 previsto'
    appLabel='INTERFACCIA ORIGINALE DÈLGHEM D2'
    imageLabel='BENCHMARK KRATOS · QUAD4'
  else
    kicker='STRUCTURAL ENGINEERING / MAC'
    headline='Genius Assistant'
    line='Describe. Review. Apply.'
    sub='Real 2D Kratos stress maps'
    second='Editable D2 models and source-backed FEM'
    status='vAlpha1 in development · January 2027 planned'
    appLabel='AUTHENTIC DÈLGHEM D2 INTERFACE'
    imageLabel='KRATOS BENCHMARK · QUAD4'
  fi
  # Source images remain unchanged. Overlays only crop/scale their actual
  # pixels to the social 1200x630 canvas; no fabricated solver imagery.
  tmp="$(mktemp -d)"
  magick "$app" -resize '532x265^' -gravity center -extent 532x265 "$tmp/app.png"
  magick "$plot" -resize '532x164^' -gravity center -extent 532x164 "$tmp/stress.png"
  magick -size 1200x630 'gradient:#0c2b3b-#1f5261' \
    -fill '#173e4b' -stroke '#386e7c' -strokewidth 1 \
    -draw 'roundrectangle 607,54 1179,582 15,15' \
    -stroke none -fill '#295a68' -draw 'roundrectangle 624,80 1161,348 8,8' \
    '(' "$tmp/app.png" ')' -gravity northwest -geometry +628+82 -compose over -composite \
    '(' "$tmp/stress.png" ')' -gravity northwest -geometry +628+403 -compose over -composite \
    -fill '#8fc3c0' -font "$font" -pointsize 15 -annotate +58+72 "$kicker" \
    -fill '#f4faf7' -pointsize 65 -annotate +55+171 'DÈLGHEM' \
    -fill '#a2dcd0' -pointsize 35 -annotate +57+241 "$headline" \
    -fill '#e9f9f2' -pointsize 23 -annotate +59+290 "$line" \
    -stroke '#558b92' -strokewidth 1 -draw 'line 58,327 550,327' -stroke none \
    -fill '#c1ebe0' -pointsize 21 -annotate +59+372 "$sub" \
    -fill '#b7d7d9' -pointsize 17 -annotate +59+409 "$second" \
    -fill '#f5c09b' -pointsize 17 -annotate +59+500 "$status" \
    -fill '#ecf9f2' -pointsize 28 -annotate +59+563 'www.delghe.com' \
    -fill '#d5f1e6' -pointsize 12 -annotate +630+72 "$appLabel" \
    -fill '#cce6e7' -pointsize 12 -annotate +630+394 "$imageLabel" \
    -strip "$out"
  rm -rf "$tmp"
  magick identify "$out"
}
build_social en
build_social it
