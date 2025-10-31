#!/bin/bash
echo "🚀 Starting MediaCord..."
echo ""
echo "📋 Prerequisites:"
echo "  - VLC or IINA (macOS) installed"
echo "  - Discord running"
echo "  - Media player configured (see documentation)"
echo ""
echo "🌐 Web interface will be available at: http://localhost:7100"
echo "🛑 Press Ctrl+C to stop MediaCord"
echo ""

# Get the directory where this script is located
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
cd "$DIR"

node src/main.js

echo ""
echo "MediaCord has stopped."
read -p "Press Enter to exit..."
