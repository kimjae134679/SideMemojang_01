@echo off
cd /d "%~dp0"

set CI=1
set ELECTRON_BUILDER_DISABLE_PUBLISH=true
set CSC_IDENTITY_AUTO_DISCOVERY=false

echo ====================================
echo SideMemojang Build
echo ====================================
echo.
echo [1/4] Project folder
cd
echo.
echo [2/4] Install dependencies if needed
if not exist node_modules (
  call npm install
  if errorlevel 1 (
    echo.
    echo npm install failed.
    pause
    exit /b 1
  )
) else (
  echo node_modules exists. Skip npm install.
)
echo.
echo [3/4] Build setup exe and latest.yml
echo Command: npm run dist
echo.
call npm run dist
if errorlevel 1 (
  echo.
  echo Build failed.
  pause
  exit /b 1
)
echo.
echo [4/4] Done. Opening release folder...
if exist release start "" release
pause
