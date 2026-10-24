#!/usr/bin/env bash
set -euo pipefail
cd /Users/delghe/Desktop/DELGHEM-SITO-AGGIORNAMENTO
mkdir -p assets/social
base='assets/real-d2/complex-frame-poster.webp'
curve='assets/fem-lab/gallery/pushover-plastic-x-actual-solver.webp'
font='assets/Manrope.ttf'
function draw_social(){
  lang="$1"
  out="assets/social/delghem-apple-silicon-$lang.png"
  if [[ "$lang" == "it" ]]; then
    kicker='INGEGNERIA STRUTTURALE / MAC'
    title='Il calcolo FEM.'
    line='Nativo per'
    note='Apple Silicon'
    subtitle='Modelli 3D, analisi e risultati'
    status='vAlpha1 · gennaio 2027 (previsto)'
    footer='Modello D2 e benchmark distinti · non certificati'
  else
    kicker='STRUCTURAL ENGINEERING / MAC'
    title='Structural FEM.'
    line='Built for'
    note='Apple Silicon'
    subtitle='3D modelling, analysis and results'
    status='vAlpha1 · January 2027 (planned)'
    footer='Separate D2 concept & test cases · not certified'
  fi
  magick -size 1200x630 'gradient:#edf8f5-#c9e4df' \
   '(' "$base" -resize 575x500 ')' -gravity northeast -geometry +2+78 -compose over -composite \
   -gravity northwest \
   -stroke '#2e7e8c' -strokewidth 0.8 -fill none -draw 'roundrectangle 750,387 1167,597 16,16' \
   '(' "$curve" -resize 402x190 ')' -gravity northwest -geometry +758+397 -compose over -composite \
   -font "$font" -stroke none \
   -fill '#327585' -pointsize 17 -annotate +60+75 "$kicker" \
   -fill '#142e3c' -pointsize 70 -annotate +55+168 'DÈLGHEM' \
   -fill '#1f4657' -pointsize 37 -annotate +57+254 "$title" \
   -pointsize 35 -annotate +57+305 "$line" \
   -fill '#1e8191' -pointsize 47 -annotate +57+369 "$note" \
   -fill '#416c75' -pointsize 20 -annotate +60+416 "$subtitle" \
   -stroke '#91c4c6' -strokewidth 2 -draw 'line 57,450 575,450' \
   -stroke none -fill '#2c5d6d' -pointsize 17 -annotate +59+503 "$status" \
   -fill '#547e83' -pointsize 13 -annotate +59+540 "$footer" \
   -fill '#143e51' -pointsize 25 -annotate +59+584 'www.delghe.com' \
   -strip "$out"
  magick identify "$out"
}
draw_social en
draw_social it
