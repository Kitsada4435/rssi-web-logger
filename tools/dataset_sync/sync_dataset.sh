#!/usr/bin/env bash
# ==========================================================
# RSSI Telemetry Dataset Sync & Deduplication Tool
# รองรับการรันบน Git Bash, WSL, macOS, Linux
# ==========================================================

echo "=========================================================="
echo "📡 RSSI Telemetry Dataset Sync & Deduplication"
echo "=========================================================="

cd "$(dirname "$0")" || exit 1

if command -v python3 &>/dev/null; then
    python3 sync_dataset.py "$@"
elif command -v python &>/dev/null; then
    python sync_dataset.py "$@"
elif command -v py &>/dev/null; then
    py -3 sync_dataset.py "$@"
else
    echo "❌ Error: Python not found in system PATH."
    exit 1
fi

