@echo off
powershell.exe -NoProfile -File "%~dp0tools\startTrial.ps1" -OpenBrowser
if errorlevel 1 pause
