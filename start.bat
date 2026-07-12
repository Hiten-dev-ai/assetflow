@echo off
setlocal

cd /d "%~dp0"

where npm.cmd >nul 2>nul
if errorlevel 1 (
  echo npm was not found. Install Node.js 22 or newer, then run this file again.
  exit /b 1
)

if not exist "node_modules" (
  echo Installing dependencies...
  call npm.cmd ci
  if errorlevel 1 exit /b 1
)

echo Starting AssetFlow development server...
call npm.cmd run dev

endlocal
