#!/usr/bin/env bash
# plot-progress.sh — progress visualization for the self-improvement loop.
#
# Replaces plot_progress.py (matplotlib). Reads raw_data.json and emits an SVG
# (deterministic, diffable, zero external deps): losers as grey scatter points,
# winners as a blue line with family annotations. If the requested output ends in
# .png it is rasterized with rsvg-convert (or ImageMagick when available).
#
# Usage:
#   plot-progress.sh --data /path/raw_data.json --output /path/progress.svg
#   plot-progress.sh --tracking-dir /path/to/.opencode/state/self-improve/tracking/
set -euo pipefail

DATA=""
OUTPUT=""

while [ $# -gt 0 ]; do
	case "$1" in
	--data)
		DATA="${2:-}"
		shift 2
		;;
	--output)
		OUTPUT="${2:-}"
		shift 2
		;;
	--tracking-dir)
		DATA="${2:-}/raw_data.json"
		OUTPUT="${2:-}/progress.svg"
		shift 2
		;;
	-h | --help)
		sed -n '2,11p' "$0" | sed 's/^# \{0,1\}//'
		exit 0
		;;
	*)
		echo "ERROR: unknown argument '$1'" >&2
		exit 2
		;;
	esac
done

if [ -z "$DATA" ] || [ -z "$OUTPUT" ]; then
	echo "Usage: plot-progress.sh --tracking-dir DIR | --data raw_data.json --output out.svg" >&2
	exit 1
fi

if [ ! -f "$DATA" ]; then
	echo "Warning: $DATA not found. No visualization generated."
	exit 0
fi

mkdir -p "$(dirname "$OUTPUT")"

render_svg() {
	jq -r '.[] | [ (.iteration // 0), (.benchmark_score // 0),
                   ((.is_winner // false) | tostring),
                   (.approach_family // "unknown"), (.plan_id // "?") ] | @tsv' "$DATA" |
		awk -F'\t' '
    function fx(it)    { return ML + (it - x0) / (x1 - x0) * PW }
    function fy(score) { return MT + (1 - (score - y0) / (y1 - y0)) * PH }
    { n++; it[n]=$1+0; sc[n]=$2+0; win[n]=($3=="true"||$3=="1"); fam[n]=$4
      if (n==1) { minx=maxx=it[1]; miny=maxy=sc[1] }
      if (it[n]<minx) minx=it[n]; if (it[n]>maxx) maxx=it[n]
      if (sc[n]<miny) miny=sc[n]; if (sc[n]>maxy) maxy=sc[n] }
    END {
      W=960; H=480; ML=70; MR=20; MT=50; MB=60; PW=W-ML-MR; PH=H-MT-MB
      print "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"" W "\" height=\"" H "\" viewBox=\"0 0 " W " " H "\" font-family=\"sans-serif\">"
      print "<rect width=\"" W "\" height=\"" H "\" fill=\"white\"/>"
      if (n==0) { print "<text x=\"20\" y=\"40\" font-size=\"16\">No data</text></svg>"; exit }
      px=(maxx-minx)*0.05; if (px==0) px=1
      py=(maxy-miny)*0.10; if (py==0) py=1
      x0=minx-px; x1=maxx+px; y0=miny-py; y1=maxy+py
      print "<text x=\"" (W/2) "\" y=\"28\" text-anchor=\"middle\" font-size=\"18\" font-weight=\"bold\">Self-Improvement Progress</text>"
      # y grid + labels
      for (k=0;k<=4;k++) { v=y0+(y1-y0)*k/4; yy=fy(v)
        printf "<line x1=\"%d\" y1=\"%.1f\" x2=\"%d\" y2=\"%.1f\" stroke=\"#e0e0e0\"/>\n", ML, yy, W-MR, yy
        printf "<text x=\"%d\" y=\"%.1f\" text-anchor=\"end\" font-size=\"11\" fill=\"#444\">%.3f</text>\n", ML-8, yy+4, v }
      # x ticks
      step=int((maxx-minx)/8)+1; for (t=int(minx); t<=int(maxx); t+=step) { xx=fx(t)
        printf "<line x1=\"%.1f\" y1=\"%d\" x2=\"%.1f\" y2=\"%d\" stroke=\"#e0e0e0\" stroke-dasharray=\"3 3\"/>\n", xx, MT, xx, H-MB
        printf "<text x=\"%.1f\" y=\"%d\" text-anchor=\"middle\" font-size=\"11\" fill=\"#444\">%d</text>\n", xx, H-MB+18, t }
      # axes
      printf "<line x1=\"%d\" y1=\"%d\" x2=\"%d\" y2=\"%d\" stroke=\"#333\"/>\n", ML, H-MB, W-MR, H-MB
      printf "<line x1=\"%d\" y1=\"%d\" x2=\"%d\" y2=\"%d\" stroke=\"#333\"/>\n", ML, MT, ML, H-MB
      printf "<text x=\"%d\" y=\"%d\" text-anchor=\"middle\" font-size=\"13\">Iteration</text>\n", W/2, H-18
      printf "<text x=\"18\" y=\"%d\" text-anchor=\"middle\" font-size=\"13\" transform=\"rotate(-90 18 %d)\">Benchmark Score</text>\n", H/2, H/2
      # losers
      for (i=1;i<=n;i++) if (!win[i]) printf "<circle cx=\"%.1f\" cy=\"%.1f\" r=\"3\" fill=\"lightgray\" opacity=\"0.5\"/>\n", fx(it[i]), fy(sc[i])
      # winners polyline
      m=0; pts=""
      for (i=1;i<=n;i++) if (win[i]) { pts=pts sprintf("%.1f,%.1f ", fx(it[i]), fy(sc[i])); m++ }
      if (m>0) printf "<polyline points=\"%s\" fill=\"none\" stroke=\"#1f77b4\" stroke-width=\"2\"/>\n", pts
      for (i=1;i<=n;i++) if (win[i]) {
        printf "<circle cx=\"%.1f\" cy=\"%.1f\" r=\"4\" fill=\"#1f77b4\"/>\n", fx(it[i]), fy(sc[i])
        printf "<text x=\"%.1f\" y=\"%.1f\" text-anchor=\"middle\" font-size=\"7\" fill=\"#555\">%s</text>\n", fx(it[i]), fy(sc[i])-8, substr(fam[i],1,4) }
      # legend
      printf "<circle cx=\"%d\" cy=\"44\" r=\"4\" fill=\"lightgray\" opacity=\"0.6\"/><text x=\"%d\" y=\"48\" font-size=\"12\">Candidates</text>\n", W-MR-190, W-MR-180
      printf "<line x1=\"%d\" y1=\"44\" x2=\"%d\" y2=\"44\" stroke=\"#1f77b4\" stroke-width=\"2\"/><circle cx=\"%d\" cy=\"44\" r=\"4\" fill=\"#1f77b4\"/><text x=\"%d\" y=\"48\" font-size=\"12\">Winners</text>\n", W-MR-90, W-MR-70, W-MR-80, W-MR-60
      print "</svg>" }
  '
}

if [ "${OUTPUT##*.}" = "png" ]; then
	TMP_SVG="$(mktemp --suffix=.svg)"
	trap 'rm -f "$TMP_SVG"' EXIT
	render_svg >"$TMP_SVG"
	if command -v rsvg-convert >/dev/null 2>&1; then
		rsvg-convert -w 960 -h 480 "$TMP_SVG" -o "$OUTPUT"
	elif command -v magick >/dev/null 2>&1; then
		magick "$TMP_SVG" "$OUTPUT"
	elif command -v nix-shell >/dev/null 2>&1; then
		nix-shell -p librsvg --run "$(printf '%q ' rsvg-convert -w 960 -h 480 "$TMP_SVG" -o "$OUTPUT")"
	else
		OUTPUT="${OUTPUT%.png}.svg"
		render_svg >"$OUTPUT"
		echo "Warning: no SVG rasterizer found; wrote $OUTPUT instead" >&2
	fi
else
	render_svg >"$OUTPUT"
fi

echo "Visualization saved to: $OUTPUT"
