@echo off
title MediaCord - Universal Media Player Discord Rich Presence
echo 🚀 Starting MediaCord...
echo.
echo 📋 Prerequisites:
echo   - VLC or IINA (macOS) installed
echo   - Discord running
echo   - Media player configured (see documentation)
echo.
echo 🌐 Web interface will be available at: http://localhost:7100
echo 🛑 Press Ctrl+C to stop MediaCord
echo.

cd /d "%~dp0"
node src\main.js

echo.
echo MediaCord has stopped.
pause
