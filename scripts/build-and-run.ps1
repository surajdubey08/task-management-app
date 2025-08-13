# PowerShell script to build and run the Task Management application with SQLite

param(
    [switch]$SkipBuild = $false,
    [switch]$DetachedMode = $false,
    [switch]$CleanStart = $false
)

Write-Host "Task Management Application - Build and Run Script (SQLite)" -ForegroundColor Green
Write-Host "🚀 This script will automatically detect and stop any running instances before starting fresh!" -ForegroundColor Cyan

# Function to check if Docker is available
function Test-Docker {
    try {
        docker version --format '{{.Client.Version}}' | Out-Null
        return $true
    }
    catch {
        Write-Error "Docker is not available. Please install Docker and Docker Compose."
        return $false
    }
}

# Function to check if Docker Compose is available
function Test-DockerCompose {
    try {
        docker-compose version --short | Out-Null
        $script:DockerComposeCmd = "docker-compose"
        return $true
    }
    catch {
        try {
            docker compose version | Out-Null
            $script:DockerComposeCmd = "docker compose"
            return $true
        }
        catch {
            Write-Error "Docker Compose is not available. Please install Docker Compose."
            return $false
        }
    }
}

# Function to check and stop running application instances
function Stop-RunningInstances {
    Write-Host "🔍 Checking for running application instances..." -ForegroundColor Yellow

    # Check for Docker containers
    try {
        Write-Host "Checking for Docker containers..." -ForegroundColor Blue

        # Stop and remove containers from this project
        $containers = docker ps -q --filter "name=task-management" 2>$null
        if ($containers) {
            Write-Host "📦 Found running Docker containers. Stopping them..." -ForegroundColor Yellow
            docker stop $containers 2>$null | Out-Null
            docker rm $containers 2>$null | Out-Null
        }

        # Try to stop using docker-compose if available
        if (Test-Path "docker-compose.yml") {
            Write-Host "🐳 Stopping Docker Compose services..." -ForegroundColor Blue
            & $DockerComposeCmd down -v --remove-orphans 2>$null | Out-Null
        }
            Write-Host "🐳 Stopping Docker Compose services..." -ForegroundColor Blue
            docker-compose down -v --remove-orphans 2>$null | Out-Null
        }
    }
    catch {
        # Ignore errors if Docker is not available
    }

    # Check for processes running on ports 3000 and 5000
    Write-Host "🔌 Checking for processes on ports 3000 and 5000..." -ForegroundColor Blue

    # Kill processes on port 3000 (React frontend)
    try {
        $port3000Process = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue
        if ($port3000Process) {
            Write-Host "⚡ Found process on port 3000. Terminating..." -ForegroundColor Yellow
            $processId = $port3000Process.OwningProcess
            Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
            Start-Sleep -Seconds 2
        }
    }
    catch {
        # Try alternative method
        try {
            $processes = netstat -ano | Select-String ":3000 " | ForEach-Object { ($_ -split '\s+')[-1] }
            foreach ($pid in $processes) {
                if ($pid -and $pid -ne "0") {
                    Write-Host "⚡ Found process $pid on port 3000. Terminating..." -ForegroundColor Yellow
                    Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
                }
            }
        }
        catch {
            # Ignore if can't find processes
        }
    }

    # Kill processes on port 5000 (ASP.NET backend)
    try {
        $port5000Process = Get-NetTCPConnection -LocalPort 5000 -ErrorAction SilentlyContinue
        if ($port5000Process) {
            Write-Host "⚡ Found process on port 5000. Terminating..." -ForegroundColor Yellow
            $processId = $port5000Process.OwningProcess
            Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
            Start-Sleep -Seconds 2
        }
    }
    catch {
        # Try alternative method
        try {
            $processes = netstat -ano | Select-String ":5000 " | ForEach-Object { ($_ -split '\s+')[-1] }
            foreach ($pid in $processes) {
                if ($pid -and $pid -ne "0") {
                    Write-Host "⚡ Found process $pid on port 5000. Terminating..." -ForegroundColor Yellow
                    Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
                }
            }
        }
        catch {
            # Ignore if can't find processes
        }
    }

    # Kill any dotnet processes related to TaskManagement
    try {
        $dotnetProcesses = Get-Process | Where-Object { $_.ProcessName -like "*dotnet*" -and $_.CommandLine -like "*TaskManagement*" } -ErrorAction SilentlyContinue
        if ($dotnetProcesses) {
            Write-Host "🔧 Found TaskManagement .NET processes. Terminating..." -ForegroundColor Yellow
            $dotnetProcesses | Stop-Process -Force -ErrorAction SilentlyContinue
            Start-Sleep -Seconds 2
        }
    }
    catch {
        # Try alternative method
        try {
            Get-Process -Name "dotnet" -ErrorAction SilentlyContinue | Where-Object { $_.MainWindowTitle -like "*TaskManagement*" } | Stop-Process -Force -ErrorAction SilentlyContinue
        }
        catch {
            # Ignore if can't find processes
        }
    }

    # Kill any npm/node processes that might be running the frontend
    try {
        $nodeProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -like "*react-scripts*" }
        if ($nodeProcesses) {
            Write-Host "⚛️ Found React development server processes. Terminating..." -ForegroundColor Yellow
            $nodeProcesses | Stop-Process -Force -ErrorAction SilentlyContinue
            Start-Sleep -Seconds 2
        }
    }
    catch {
        # Ignore if can't find processes
    }

    Write-Host "✅ Cleanup completed!" -ForegroundColor Green
}

# Function to verify ports are free
function Test-PortsAvailable {
    Write-Host "🔍 Verifying ports 3000 and 5000 are available..." -ForegroundColor Blue

    # Check port 3000
    try {
        $port3000 = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue
        if ($port3000) {
            Write-Host "❌ Port 3000 is still in use!" -ForegroundColor Red
            Get-NetTCPConnection -LocalPort 3000 | Format-Table
            exit 1
        }
    }
    catch {
        # Port is free
    }

    # Check port 5000
    try {
        $port5000 = Get-NetTCPConnection -LocalPort 5000 -ErrorAction SilentlyContinue
        if ($port5000) {
            Write-Host "❌ Port 5000 is still in use!" -ForegroundColor Red
            Get-NetTCPConnection -LocalPort 5000 | Format-Table
            exit 1
        }
    }
    catch {
        # Port is free
    }

    Write-Host "✅ Ports are available!" -ForegroundColor Green
}

# Check prerequisites
if (-not (Test-Docker) -or -not (Test-DockerCompose)) {
    exit 1
}

Write-Host "Using Docker Compose command: $DockerComposeCmd" -ForegroundColor Blue

# Always cleanup running instances before starting
Stop-RunningInstances
Test-PortsAvailable

# Clean start - remove existing containers and volumes
if ($CleanStart) {
    Write-Host "🧹 Performing deep cleanup of containers and volumes..." -ForegroundColor Yellow
    try {
        Invoke-Expression "$DockerComposeCmd down -v --remove-orphans" 2>$null
        docker system prune -f 2>$null
        Write-Host "✅ Deep cleanup completed!" -ForegroundColor Green
    } catch {
        # Ignore errors if containers don't exist
    }
}

# Build images if not skipped
if (-not $SkipBuild) {
    Write-Host "Building Docker images..." -ForegroundColor Blue
    Invoke-Expression "$DockerComposeCmd build"
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Failed to build Docker images"
        exit 1
    }
    Write-Host "Docker images built successfully!" -ForegroundColor Green
}

# Start services
Write-Host "Starting services..." -ForegroundColor Blue
if ($DetachedMode) {
    Invoke-Expression "$DockerComposeCmd up -d"
} else {
    Invoke-Expression "$DockerComposeCmd up"
}

if ($LASTEXITCODE -ne 0) {
    Write-Error "Failed to start services"
    exit 1
}

if ($DetachedMode) {
    Write-Host "`nServices started successfully!" -ForegroundColor Green
    Write-Host "Application URLs:" -ForegroundColor Yellow
    Write-Host "  Frontend: http://localhost:3000" -ForegroundColor Cyan
    Write-Host "  Backend API: http://localhost:5000" -ForegroundColor Cyan
    Write-Host "  Swagger UI: http://localhost:5000/swagger" -ForegroundColor Cyan
    
    Write-Host "`nTo view logs, run:" -ForegroundColor Yellow
    Write-Host "  $DockerComposeCmd logs -f" -ForegroundColor Cyan
    
    Write-Host "`nTo stop services, run:" -ForegroundColor Yellow
    Write-Host "  $DockerComposeCmd down" -ForegroundColor Cyan
    
    Write-Host "`nTo check service status, run:" -ForegroundColor Yellow
    Write-Host "  $DockerComposeCmd ps" -ForegroundColor Cyan
    
    Write-Host "`n🎉 SQLite-based application is much faster and lighter!" -ForegroundColor Green
    Write-Host "Perfect for demos and POCs!" -ForegroundColor Cyan
}
