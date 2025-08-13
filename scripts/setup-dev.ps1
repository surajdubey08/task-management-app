# PowerShell script for development environment setup

Write-Host "Task Management Application - Development Setup" -ForegroundColor Green

# Function to check if a command exists
function Test-Command {
    param($Command)
    try {
        Get-Command $Command -ErrorAction Stop | Out-Null
        return $true
    }
    catch {
        return $false
    }
}

# Check prerequisites
Write-Host "Checking prerequisites..." -ForegroundColor Blue

# Check Node.js
if (Test-Command "node") {
    $nodeVersion = node --version
    Write-Host "✓ Node.js found: $nodeVersion" -ForegroundColor Green
    
    # Check if version is 18 or higher
    $nodeMajor = [int]($nodeVersion -replace 'v', '' -split '\.')[0]
    if ($nodeMajor -lt 18) {
        Write-Host "⚠ Node.js version 18+ recommended (current: $nodeVersion)" -ForegroundColor Yellow
    }
} else {
    Write-Host "✗ Node.js not found. Please install Node.js 18+" -ForegroundColor Red
    exit 1
}

# Check npm
if (Test-Command "npm") {
    $npmVersion = npm --version
    Write-Host "✓ npm found: $npmVersion" -ForegroundColor Green
} else {
    Write-Host "✗ npm not found. Please install npm" -ForegroundColor Red
    exit 1
}

# Check .NET
if (Test-Command "dotnet") {
    $dotnetVersion = dotnet --version
    Write-Host "✓ .NET found: $dotnetVersion" -ForegroundColor Green
    
    # Check if version is 8.0 or higher
    $dotnetMajor = [int]($dotnetVersion -split '\.')[0]
    if ($dotnetMajor -lt 8) {
        Write-Host "⚠ .NET 8.0+ recommended (current: $dotnetVersion)" -ForegroundColor Yellow
    }
} else {
    Write-Host "✗ .NET not found. Please install .NET 8 SDK" -ForegroundColor Red
    exit 1
}

# Check Docker
if (Test-Command "docker") {
    try {
        $dockerVersion = (docker --version).Split(' ')[2].TrimEnd(',')
        Write-Host "✓ Docker found: $dockerVersion" -ForegroundColor Green
        
        # Check if Docker is running
        docker info 2>$null | Out-Null
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✓ Docker is running" -ForegroundColor Green
        } else {
            Write-Host "⚠ Docker is not running. Please start Docker" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "⚠ Docker found but may not be working properly" -ForegroundColor Yellow
    }
} else {
    Write-Host "⚠ Docker not found. Install Docker for containerized development" -ForegroundColor Yellow
}

# Check Docker Compose
if (Test-Command "docker-compose") {
    Write-Host "✓ Docker Compose found" -ForegroundColor Green
} else {
    # Check for docker compose plugin
    try {
        docker compose version 2>$null | Out-Null
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✓ Docker Compose (plugin) found" -ForegroundColor Green
        } else {
            Write-Host "⚠ Docker Compose not found. Install for containerized development" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "⚠ Docker Compose not found. Install for containerized development" -ForegroundColor Yellow
    }
}

# Check kubectl
if (Test-Command "kubectl") {
    try {
        $kubectlVersion = (kubectl version --client --short 2>$null).Split(' ')[-1]
        Write-Host "✓ kubectl found: $kubectlVersion" -ForegroundColor Green
    } catch {
        Write-Host "✓ kubectl found" -ForegroundColor Green
    }
} else {
    Write-Host "⚠ kubectl not found. Install for Kubernetes deployment" -ForegroundColor Yellow
}

Write-Host "`nSetting up development environment..." -ForegroundColor Blue

# Install backend dependencies
Write-Host "Installing backend dependencies..." -ForegroundColor Cyan
Set-Location "backend/TaskManagement.API"
try {
    dotnet restore
    Write-Host "✓ Backend dependencies installed" -ForegroundColor Green
} catch {
    Write-Host "✗ Failed to install backend dependencies" -ForegroundColor Red
    exit 1
}
Set-Location "../.."

# Install frontend dependencies
Write-Host "Installing frontend dependencies..." -ForegroundColor Cyan
Set-Location "frontend"
try {
    npm install
    Write-Host "✓ Frontend dependencies installed" -ForegroundColor Green
    # Generate package-lock.json if it doesn't exist
    if (-not (Test-Path "package-lock.json")) {
        Write-Host "Generating package-lock.json..." -ForegroundColor Cyan
        npm install --package-lock-only
        Write-Host "✓ package-lock.json generated" -ForegroundColor Green
    }
} catch {
    Write-Host "✗ Failed to install frontend dependencies" -ForegroundColor Red
    exit 1
}
Set-Location ".."

# Create logs directory for backend
$logsPath = "backend/TaskManagement.API/logs"
if (-not (Test-Path $logsPath)) {
    New-Item -ItemType Directory -Path $logsPath -Force | Out-Null
}
Write-Host "✓ Created logs directory" -ForegroundColor Green

Write-Host "`n🎉 Development environment setup completed!" -ForegroundColor Green

Write-Host "`nNext steps:" -ForegroundColor Yellow
Write-Host "1. For local development:" -ForegroundColor Cyan
Write-Host "   Backend:  cd backend/TaskManagement.API && dotnet run" -ForegroundColor Cyan
Write-Host "   Frontend: cd frontend && npm start" -ForegroundColor Cyan

Write-Host "`n2. For Docker development:" -ForegroundColor Cyan
Write-Host "   .\scripts\build-and-run.ps1 -DetachedMode" -ForegroundColor Cyan

Write-Host "`n3. For Kubernetes deployment:" -ForegroundColor Cyan
Write-Host "   .\scripts\deploy-k8s.ps1 -BuildImages" -ForegroundColor Cyan

Write-Host "`nApplication URLs (when running):" -ForegroundColor Yellow
Write-Host "  Frontend: http://localhost:3000" -ForegroundColor Cyan
Write-Host "  Backend:  http://localhost:5000" -ForegroundColor Cyan
Write-Host "  Swagger:  http://localhost:5000/swagger" -ForegroundColor Cyan
