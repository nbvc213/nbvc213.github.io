@echo off
setlocal
chcp 65001 >nul
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js is not installed or not on PATH.
  pause
  exit /b 1
)
node "%~dp0scripts\publish-notes.mjs" %*
set "publish_result=%errorlevel%"
echo.
pause
exit /b %publish_result%
