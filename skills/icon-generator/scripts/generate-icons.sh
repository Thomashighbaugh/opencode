#!/usr/bin/env bash
# generate-icons.sh — generate web/PWA icon assets (and optional Unreal Engine
# packaging icons) from a single source image.
#
# Replaces generate_icons.py. Orchestrates the tools this system already has —
# rsvg-convert for SVG rasterization and ImageMagick for resampling/format
# conversion — falling back to nix-shell only when a tool is missing from PATH.
#
# Usage:
#   generate-icons.sh --input icon.png --out ./dist [--targets web|web,ue]
#                     [--no-pad] [--background '#RRGGBB[AA]'] [--maskable-scale 0.8]
#
# Outputs (web): favicon.ico, apple-touch-icon.png, icon-192.png, icon-512.png,
#                icon-maskable-512.png
# Outputs (ue):  ue/windows/icon.ico, ue/mac/AppIcon.iconset/*.png, ue/linux/*.png
set -euo pipefail

INPUT=""
OUT="."
TARGETS="web"
PAD=1
BACKGROUND="#000000"
MASKABLE_SCALE="0.80"

usage() {
	sed -n '2,15p' "$0" | sed 's/^# \{0,1\}//'
}

while [ $# -gt 0 ]; do
	case "$1" in
	--input)
		INPUT="${2:-}"
		shift 2
		;;
	--out)
		OUT="${2:-}"
		shift 2
		;;
	--targets)
		TARGETS="${2:-}"
		shift 2
		;;
	--no-pad)
		PAD=0
		shift
		;;
	--background)
		BACKGROUND="${2:-}"
		shift 2
		;;
	--maskable-scale)
		MASKABLE_SCALE="${2:-}"
		shift 2
		;;
	-h | --help)
		usage
		exit 0
		;;
	*)
		echo "ERROR: unknown argument '$1'" >&2
		usage >&2
		exit 2
		;;
	esac
done

[ -n "$INPUT" ] || {
	echo "ERROR: --input is required" >&2
	exit 2
}
[ -f "$INPUT" ] || {
	echo "ERROR: input not found: $INPUT" >&2
	exit 2
}

for t in ${TARGETS//,/ }; do
	case "$t" in web | ue) ;; *)
		echo "ERROR: unknown target '$t'. Use: web, ue" >&2
		exit 2
		;;
	esac
done

# --- tool resolution (PATH first, nix-shell fallback) -------------------------
magick() {
	if command -v magick >/dev/null 2>&1; then
		command magick "$@"
	elif command -v convert >/dev/null 2>&1; then
		command convert "$@"
	elif command -v nix-shell >/dev/null 2>&1; then
		nix-shell -p imagemagick --run "$(printf '%q ' magick "$@")"
	else
		echo "ERROR: ImageMagick not found (nix-shell -p imagemagick)" >&2
		return 1
	fi
}
identify_img() {
	if command -v magick >/dev/null 2>&1; then
		command magick identify "$@"
	elif command -v identify >/dev/null 2>&1; then
		command identify "$@"
	elif command -v nix-shell >/dev/null 2>&1; then
		nix-shell -p imagemagick --run "$(printf '%q ' identify "$@")"
	else
		echo "ERROR: ImageMagick identify not found (nix-shell -p imagemagick)" >&2
		return 1
	fi
}
rsvg_convert() {
	if command -v rsvg-convert >/dev/null 2>&1; then
		command rsvg-convert "$@"
	elif command -v nix-shell >/dev/null 2>&1; then
		nix-shell -p librsvg --run "$(printf '%q ' rsvg-convert "$@")"
	else
		echo "ERROR: rsvg-convert not found (nix-shell -p librsvg)" >&2
		return 1
	fi
}

has_target() { case ",$TARGETS," in *",$1,"*) return 0 ;; *) return 1 ;; esac }

TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

# --- 1. resolve source to a raster, rasterize SVG if needed -------------------
SRC="$INPUT"
case "${INPUT,,}" in
*.svg)
	SRC="$TMP/source.png"
	rsvg_convert -w 1024 -h 1024 "$INPUT" -o "$SRC"
	;;
esac

# --- 2. ensure square (pad to square by default, else center-crop) ------------
read -r W H < <(identify_img -format '%w %h\n' "${SRC}[0]") || true
SQ="$TMP/square.png"
if [ "$W" -eq "$H" ]; then
	cp "$SRC" "$SQ"
elif [ "$PAD" -eq 1 ]; then
	SIDE="$W"
	[ "$H" -gt "$SIDE" ] && SIDE="$H"
	magick "$SRC" -background "$BACKGROUND" -gravity center -extent "${SIDE}x${SIDE}" "$SQ"
else
	SIDE="$W"
	[ "$H" -lt "$SIDE" ] && SIDE="$H"
	magick "$SRC" -gravity center -crop "${SIDE}x${SIDE}+0+0" +repage "$SQ"
fi

resize() { magick "$1" -filter Lanczos -resize "$2x$2" "$3"; }

# --- 3. web / PWA -------------------------------------------------------------
if has_target web; then
	mkdir -p "$OUT"
	magick "$SQ" -define icon:auto-resize=16,32,48 "$OUT/favicon.ico"
	resize "$SQ" 180 "$OUT/apple-touch-icon.png"
	resize "$SQ" 192 "$OUT/icon-192.png"
	resize "$SQ" 512 "$OUT/icon-512.png"

	INNER="$(awk -v s=512 -v c="$MASKABLE_SCALE" 'BEGIN{i=int(s*c+0.5); if(i<1)i=1; if(i>s)i=s; print i}')"
	magick "$SQ" -filter Lanczos -resize "${INNER}x${INNER}" \
		-background "$BACKGROUND" -gravity center \
		-extent 512x512 -alpha remove -alpha off "$OUT/icon-maskable-512.png"
fi

# --- 4. Unreal Engine packaging ----------------------------------------------
if has_target ue; then
	UE="$OUT/ue"
	mkdir -p "$UE/windows" "$UE/mac/AppIcon.iconset" "$UE/linux"

	magick "$SQ" -define icon:auto-resize=16,24,32,48,64,128,256 "$UE/windows/icon.ico"

	while read -r name size; do
		resize "$SQ" "$size" "$UE/mac/AppIcon.iconset/$name"
	done <<'ICONSET'
icon_16x16.png 16
icon_16x16@2x.png 32
icon_32x32.png 32
icon_32x32@2x.png 64
icon_128x128.png 128
icon_128x128@2x.png 256
icon_256x256.png 256
icon_256x256@2x.png 512
icon_512x512.png 512
icon_512x512@2x.png 1024
ICONSET

	resize "$SQ" 256 "$UE/linux/icon-256.png"
	resize "$SQ" 512 "$UE/linux/icon-512.png"
fi

echo "OK: icons written to $OUT (targets: $TARGETS)"
