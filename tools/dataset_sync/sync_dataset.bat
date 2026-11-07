@echo off
title RSSI Telemetry Dataset Sync
echo ==========================================================
echo RSSI Telemetry Dataset Sync and Deduplication
echo ==========================================================
cd /d "%~dp0"

python sync_dataset.py %*
if %ERRORLEVEL% equ 0 goto finish

py -3 sync_dataset.py %*
if %ERRORLEVEL% equ 0 goto finish

echo [ERROR] Python not found in PATH.
pause
exit /b 1

:finish
echo.
pause

