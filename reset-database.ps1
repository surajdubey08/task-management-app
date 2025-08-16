#!/usr/bin/env pwsh

# Task Management App - Complete Database Reset Script
# This script completely resets the database and populates with fresh data

Write-Host "🔥 Task Management App - Complete Database Reset" -ForegroundColor Red
Write-Host "=================================================" -ForegroundColor Red
Write-Host "⚠️  WARNING: This will COMPLETELY WIPE the database!" -ForegroundColor Yellow
Write-Host ""

# Configuration
$API_BASE_URL = "http://localhost:5000/api"

# Function to completely reset the database and containers
function Reset-Database {
    Write-Host "🛑 Completely stopping all containers and removing volumes..." -ForegroundColor Yellow

    try {
        # Stop all containers and remove volumes (this completely wipes the database)
        docker-compose down -v
        Write-Host "   ✅ All containers stopped and volumes removed" -ForegroundColor Green

        # Remove any local database files if they exist (SQLite)
        $dbPath = "backend/TaskManagement.API/taskmanagement.db"
        if (Test-Path $dbPath) {
            Remove-Item $dbPath -Force
            Write-Host "   ✅ Local database file removed" -ForegroundColor Green
        }

        # Also remove any journal files
        $journalPath = "backend/TaskManagement.API/taskmanagement.db-journal"
        if (Test-Path $journalPath) {
            Remove-Item $journalPath -Force
            Write-Host "   ✅ Database journal file removed" -ForegroundColor Green
        }

        $walPath = "backend/TaskManagement.API/taskmanagement.db-wal"
        if (Test-Path $walPath) {
            Remove-Item $walPath -Force
            Write-Host "   ✅ Database WAL file removed" -ForegroundColor Green
        }

        $shmPath = "backend/TaskManagement.API/taskmanagement.db-shm"
        if (Test-Path $shmPath) {
            Remove-Item $shmPath -Force
            Write-Host "   ✅ Database SHM file removed" -ForegroundColor Green
        }

        # Start all containers fresh (this will recreate everything from scratch)
        Write-Host "🚀 Starting all containers fresh (will recreate database)..." -ForegroundColor Yellow
        docker-compose up -d
        
        # Wait for the API to be ready
        Write-Host "⏳ Waiting for API to be ready..." -ForegroundColor Yellow
        $maxAttempts = 30
        $attempt = 0
        
        do {
            Start-Sleep -Seconds 2
            $attempt++
            try {
                $response = Invoke-RestMethod -Uri "$API_BASE_URL/users" -Method GET -TimeoutSec 5
                Write-Host "   ✅ API is ready!" -ForegroundColor Green
                return $true
            }
            catch {
                Write-Host "   ⏳ Attempt $attempt/$maxAttempts - API not ready yet..." -ForegroundColor Yellow
            }
        } while ($attempt -lt $maxAttempts)
        
        Write-Host "   ❌ API failed to start within timeout" -ForegroundColor Red
        return $false
    }
    catch {
        Write-Host "   ❌ Error during database reset: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# Main execution
function Main {
    Write-Host ""
    Write-Host "Starting complete database reset..." -ForegroundColor Cyan
    Write-Host ""
    
    # Reset the database
    $resetSuccess = Reset-Database
    
    if (-not $resetSuccess) {
        Write-Host "❌ Database reset failed!" -ForegroundColor Red
        exit 1
    }
    
    Write-Host ""
    Write-Host "🎉 Database reset completed successfully!" -ForegroundColor Green
    Write-Host "   The database has been completely wiped and recreated with seed data." -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Now running data population script..." -ForegroundColor Cyan
    Write-Host ""
    
    # Run the data population script
    try {
        & ".\populate-data.ps1"
    }
    catch {
        Write-Host "❌ Data population failed: $($_.Exception.Message)" -ForegroundColor Red
        exit 1
    }
}

# Run the script
Main
