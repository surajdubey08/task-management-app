@echo off
echo.
echo 🚀 Task Management App - Data Population Script
echo =================================================
echo.

REM Check if PowerShell is available
where pwsh >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo Using PowerShell Core...
    pwsh -ExecutionPolicy Bypass -File "populate-data.ps1"
) else (
    where powershell >nul 2>nul
    if %ERRORLEVEL% EQU 0 (
        echo Using Windows PowerShell...
        powershell -ExecutionPolicy Bypass -File "populate-data.ps1"
    ) else (
        echo ❌ PowerShell not found. Please install PowerShell to run this script.
        pause
        exit /b 1
    )
)

echo.
echo Press any key to exit...
pause >nul
