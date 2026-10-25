#!/usr/bin/env bash
# Original DÈLGHEM D2 GUI and real Kratos QUAD4 stress imagery only.
# Static type/banner composites; no fictitious structural calculations.
set -euo pipefail
cd "$(dirname "$0")/.."
out="assets/banners"
mkdir -p "$out"
font="assets/Manrope.ttf"
stress="assets/fem-lab/gallery/surface-skewed-double-opening-slab.webp"
test -s "$font"; test -s "$stress"
tmp="$(mktemp -d /tmp/delghem-ads.XXXXXX)"
trap 'rm -rf "$tmp"' EXIT

for lang in it en; do
  ui="assets/genius/genius-workflow-$lang.webp"
  test -s "$ui"
  if [ "$lang" = it ]; then
    eyebrow="INGEGNERIA STRUTTURALE / MAC"
    subtitle="FEM nativo per Apple Silicon"
    teaser="Genius · Modelli 3D · Risultati Kratos"
    status="vAlpha1 in sviluppo"
    action="SCOPRI IL PROGETTO"
    evidence="INTERFACCIA D2 + TENSIONI QUAD4 REALI"
    compact="FEM NATIVO • MAC"
    small="Modelli FEM · Genius"
  else
    eyebrow="STRUCTURAL ENGINEERING / MAC"
    subtitle="Native FEM for Apple Silicon"
    teaser="Genius · 3D Models · Kratos Results"
    status="vAlpha1 in development"
    action="EXPLORE THE PROJECT"
    evidence="REAL D2 UI + KRATOS QUAD4 STRESS"
    compact="NATIVE FEM • MAC"
    small="FEM Models · Genius"
  fi
  magick "$ui" -resize '365x168^' -gravity center -extent 365x168 \
    -bordercolor '#579eab' -border 2 "$tmp/ui-billboard.png"
  magick "$ui" -resize '275x99^' -gravity center -extent 275x99 \
    -bordercolor '#579eab' -border 2 "$tmp/ui-small.png"
  magick "$ui" -resize '920x392^' -gravity center -extent 920x392 \
    -bordercolor '#579eab' -border 2 "$tmp/ui-large.png"
  magick "$stress" -resize '260x129^' -gravity center -extent 260x129 \
    -bordercolor '#5bbec6' -border 2 "$tmp/stress-small.png"
  magick "$stress" -resize '920x146^' -gravity center -extent 920x146 \
    -bordercolor '#5bbec6' -border 2 "$tmp/stress-large.png"
  magick "$ui" -resize '174x69^' -gravity center -extent 174x69 \
    -bordercolor '#79b2b8' -border 1 "$tmp/ui-leader.png"
  magick "$ui" -resize '260x191^' -gravity center -extent 260x191 \
    -bordercolor '#5db5b4' -border 2 "$tmp/ui-vertical.png"

  magick -size 970x250 'gradient:#071f2d-#1c5661' \
    -fill '#27596b' -stroke '#507d8b' -strokewidth 1 \
    -draw 'roundrectangle 573,10 959,240 12,12' -stroke none \
    '(' "$tmp/ui-billboard.png" ')' -geometry +585+28 -compose over -composite \
    -font "$font" \
    -fill '#a9dcd6' -pointsize 13 -annotate +37+34 "$eyebrow" \
    -fill '#ffffff' -pointsize 61 -annotate +34+117 'DÈLGHEM' \
    -fill '#a9e7d8' -pointsize 23 -annotate +36+152 "$subtitle" \
    -fill '#c2dde0' -pointsize 15 -annotate +37+184 "$teaser" \
    -fill '#f8c59f' -pointsize 12 -annotate +37+216 "$status" \
    -fill '#f8fcfb' -pointsize 17 -annotate +335+233 'delghe.com' \
    -fill '#89cfc8' -pointsize 10 -annotate +590+21 "$evidence" \
    -quality 90 -strip "$out/delghem-billboard-$lang.webp"

  magick -size 728x90 'gradient:#061b29-#225665' \
    -fill '#7fd3c7' -draw 'rectangle 0,0 5,90' \
    '(' "$tmp/ui-leader.png" ')' -geometry +535+10 -compose over -composite \
    -font "$font" \
    -fill '#ffffff' -pointsize 32 -annotate +21+43 'DÈLGHEM' \
    -fill '#a6dfd7' -pointsize 14 -annotate +23+63 "$subtitle" \
    -fill '#f6be90' -pointsize 11 -annotate +328+39 'Genius · Apple Silicon' \
    -fill '#d9f0e9' -pointsize 13 -annotate +328+61 'www.delghe.com' \
    -quality 88 -strip "$out/delghem-leaderboard-$lang.webp"

  magick -size 300x250 'gradient:#061e2b-#1a5360' \
    -fill '#76d4be' -draw 'rectangle 0,0 300,3' \
    '(' "$tmp/ui-small.png" ')' -geometry +10+92 -compose over -composite \
    -font "$font" \
    -fill '#ffffff' -pointsize 31 -annotate +12+49 'DÈLGHEM' \
    -fill '#aee3d9' -pointsize 14 -annotate +13+70 "$compact" \
    -fill '#f4c9a7' -pointsize 11 -annotate +12+218 "$action" \
    -fill '#e2fbf4' -pointsize 16 -annotate +157+243 'delghe.com' \
    -quality 90 -strip "$out/delghem-rectangle-$lang.webp"

  magick -size 300x600 'gradient:#061a28-#205d67' \
    -fill '#87dbcd' -draw 'rectangle 0,0 300,4' \
    '(' "$tmp/ui-vertical.png" ')' -geometry +18+142 -compose over -composite \
    '(' "$tmp/stress-small.png" ')' -geometry +18+364 -compose over -composite \
    -font "$font" \
    -fill '#e6f6f3' -pointsize 13 -annotate +20+48 "$eyebrow" \
    -fill '#ffffff' -pointsize 43 -annotate +18+108 'DÈLGHEM' \
    -fill '#96e0d6' -pointsize 15 -annotate +19+129 "$subtitle" \
    -fill '#f0c1a1' -pointsize 12 -annotate +20+354 'GENIUS / TRUE FEM' \
    -fill '#e3f5f1' -pointsize 13 -annotate +21+530 "$small" \
    -fill '#ffcca0' -pointsize 11 -annotate +21+559 "$status" \
    -fill '#ffffff' -pointsize 24 -annotate +20+590 'delghe.com' \
    -quality 90 -strip "$out/delghem-skyscraper-$lang.webp"

  magick -size 1080x1080 'gradient:#071b29-#1d5360' \
    -fill '#77d2c9' -draw 'rectangle 0,0 1080,8' \
    '(' "$tmp/ui-large.png" ')' -geometry +78+295 -compose over -composite \
    '(' "$tmp/stress-large.png" ')' -geometry +78+715 -compose over -composite \
    -font "$font" \
    -fill '#a1d9d4' -pointsize 25 -annotate +84+91 "$eyebrow" \
    -fill '#ffffff' -pointsize 110 -annotate +77+210 'DÈLGHEM' \
    -fill '#b7ebde' -pointsize 40 -annotate +83+267 "$subtitle" \
    -fill '#bde0e1' -pointsize 18 -annotate +84+697 "$evidence" \
    -fill '#f9c398' -pointsize 24 -annotate +82+910 "$status" \
    -fill '#e7f7f2' -pointsize 31 -annotate +80+974 "$teaser" \
    -fill '#ffffff' -pointsize 43 -annotate +79+1040 'www.delghe.com' \
    -quality 91 -strip "$out/delghem-square-$lang.webp"
done
magick identify -format '%f %wx%h (%b)\n' "$out"/delghem-*.webp
