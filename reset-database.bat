@echo off
echo.
echo 🔥 Task Management App - Complete Database Reset
echo =================================================
echo ⚠️  WARNING: This will COMPLETELY WIPE the database!
echo.

REM Check if PowerShell is available
where pwsh >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo Using PowerShell Core...
    pwsh -ExecutionPolicy Bypass -File "reset-database.ps1"
) else (
    where powershell >nul 2>nul
    if %ERRORLEVEL% EQU 0 (
        echo Using Windows PowerShell...
        powershell -ExecutionPolicy Bypass -File "reset-database.ps1"
    ) else (
        echo ❌ PowerShell not found. Please install PowerShell to run this script.
        pause
        exit /b 1
    )
)

echo.
echo Press any key to exit...
pause >nul
