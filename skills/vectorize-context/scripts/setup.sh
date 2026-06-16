#!/bin/bash
# Setup script for vectorize-context skill
# Installs dependencies on first use to avoid 303MB of pre-installed node_modules
set -e
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
if [ ! -d "$SCRIPT_DIR/node_modules" ]; then
	echo "Installing vectorize-context dependencies..."
	cd "$SCRIPT_DIR"
	npm install --no-audit --no-fund 2>&1
	echo "Dependencies installed."
else
	echo "Dependencies already installed."
fi
