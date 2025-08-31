# TaskFlow Build and Deploy Script - PowerShell Version
# Comprehensive script for building, deploying, and managing TaskFlow application
# Supports Docker cleanup, build, run, and registry push operations

param(
    [switch]$CleanupOnly,
    [switch]$BuildRun,
    [string]$PushRegistry = "",
    [string]$Tag = "latest",
    [switch]$SkipBuild,
    [switch]$Detached,
    [switch]$ForceRebuild,
    [switch]$K8sBuild,
    [switch]$Help
)

# Function to write colored output
function Write-ColorOutput {
    param(
        [string]$ForegroundColor,
        [string]$Message
    )
    
    $currentColor = $Host.UI.RawUI.ForegroundColor
    $Host.UI.RawUI.ForegroundColor = $ForegroundColor
    Write-Output $Message
    $Host.UI.RawUI.ForegroundColor = $currentColor
}

# Function to print header
function Write-Header {
    param([string]$Title)
    
    Write-Output ""
    Write-ColorOutput "Magenta" "=================================="
    Write-ColorOutput "Magenta" $Title
    Write-ColorOutput "Magenta" "=================================="
    Write-Output ""
}

# Function to show usage
function Show-Usage {
    @"
TaskFlow Build and Deploy Script - PowerShell Version

USAGE:
    .\build-deploy.ps1 [OPTIONS]

OPTIONS:
    -CleanupOnly         Only perform cleanup and prune operations
    -BuildRun            Build and run the application (default if no options)
    -PushRegistry PATH   Build and push images to registry (requires login)
    -Tag TAG             Image tag to use (default: latest)
    -SkipBuild           Skip building, only run existing images
    -Detached            Run containers in detached mode
    -ForceRebuild        Force rebuild without using cache
    -K8sBuild            Build for Kubernetes deployment (uses k8s-specific configs)
    -Help                Show this help message

EXAMPLES:
    # Clean up everything and build/run application
    .\build-deploy.ps1 -BuildRun

    # Only cleanup Docker resources
    .\build-deploy.ps1 -CleanupOnly

    # Build and push to registry with default tag
    .\build-deploy.ps1 -PushRegistry "my.company.com/taskflow"

    # Build and push with custom tag
    .\build-deploy.ps1 -PushRegistry "my.company.com/taskflow" -Tag "v1.0.0"

    # Run in detached mode
    .\build-deploy.ps1 -BuildRun -Detached

    # Force rebuild without cache
    .\build-deploy.ps1 -BuildRun -ForceRebuild

REGISTRY PUSH:
    To push to a registry, ensure you are logged in first:
    docker login my.company.com

    Then specify the registry path (without image name):
    .\build-deploy.ps1 -PushRegistry "my.company.com/taskflow"
    .\build-deploy.ps1 -PushRegistry "my.company.com/taskflow" -Tag "v1.2.3"
"@
}

# Function to check prerequisites
function Test-Prerequisites {
    Write-Header "CHECKING PREREQUISITES"
    
    # Check Docker
    try {
        $dockerVersion = docker --version
        Write-ColorOutput "Green" "✅ Docker found: $dockerVersion"
    }
    catch {
        Write-ColorOutput "Red" "❌ Docker is not installed or not in PATH"
        exit 1
    }
    
    # Check Docker Compose
    try {
        try {
            $composeVersion = docker-compose --version
            $script:DockerComposeCmd = "docker-compose"
            Write-ColorOutput "Green" "✅ Docker Compose found: $composeVersion"
        }
        catch {
            $composeVersion = docker compose version
            $script:DockerComposeCmd = "docker compose"
            Write-ColorOutput "Green" "✅ Docker Compose (plugin) found: $composeVersion"
        }
    }
    catch {
        Write-ColorOutput "Red" "❌ Docker Compose is not available"
        exit 1
    }
    
    # Check if Docker daemon is running
    try {
        docker info | Out-Null
        Write-ColorOutput "Green" "✅ Docker daemon is running"
    }
    catch {
        Write-ColorOutput "Red" "❌ Docker daemon is not running"
        exit 1
    }
}

# Function to perform comprehensive cleanup
function Invoke-Cleanup {
    Write-Header "PERFORMING COMPREHENSIVE CLEANUP"
    
    Write-ColorOutput "Yellow" "🛑 Stopping all TaskFlow containers..."
    try {
        Invoke-Expression "$script:DockerComposeCmd down --remove-orphans" 2>$null
    }
    catch {
        # Ignore errors if containers are not running
    }
    
    Write-ColorOutput "Yellow" "🗑️ Removing TaskFlow images..."
    try {
        docker rmi task-management-app-api task-management-app-frontend 2>$null
    }
    catch {
        # Ignore errors if images don't exist
    }
    
    Write-ColorOutput "Yellow" "🧹 Pruning unused Docker resources..."
    docker container prune -f
    docker image prune -f
    docker volume prune -f
    docker network prune -f
    
    Write-ColorOutput "Yellow" "🔍 Checking for processes on ports 3000 and 5000..."
    
    # Kill processes on port 3000
    try {
        $processes = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue
        if ($processes) {
            Write-ColorOutput "Yellow" "⚡ Terminating process on port 3000..."
            $processes | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }
        }
    }
    catch {
        # Ignore errors
    }
    
    # Kill processes on port 5000
    try {
        $processes = Get-NetTCPConnection -LocalPort 5000 -ErrorAction SilentlyContinue
        if ($processes) {
            Write-ColorOutput "Yellow" "⚡ Terminating process on port 5000..."
            $processes | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }
        }
    }
    catch {
        # Ignore errors
    }
    
    Write-ColorOutput "Green" "✅ Cleanup completed successfully!"
}

# Function to verify ports are available
function Test-Ports {
    Write-ColorOutput "Blue" "🔍 Verifying ports 3000 and 5000 are available..."
    
    try {
        $port3000 = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue
        if ($port3000) {
            Write-ColorOutput "Red" "❌ Port 3000 is still in use!"
            $port3000 | Format-Table
            exit 1
        }
        
        $port5000 = Get-NetTCPConnection -LocalPort 5000 -ErrorAction SilentlyContinue
        if ($port5000) {
            Write-ColorOutput "Red" "❌ Port 5000 is still in use!"
            $port5000 | Format-Table
            exit 1
        }
    }
    catch {
        # Assume ports are available if we can't check
    }
    
    Write-ColorOutput "Green" "✅ Ports are available"
}

# Function to build application
function Invoke-Build {
    Write-Header "BUILDING APPLICATION"

    $buildArgs = @()
    if ($ForceRebuild) {
        $buildArgs += "--no-cache"
        Write-ColorOutput "Yellow" "🔨 Force rebuilding without cache..."
    }
    else {
        Write-ColorOutput "Blue" "🔨 Building application..."
    }

    if ($K8sBuild) {
        Write-ColorOutput "Cyan" "🎯 Building for Kubernetes deployment..."

        # Build API (same for both)
        $apiCmd = "docker build $($buildArgs -join ' ') -t task-management-app-api:$Tag backend/TaskManagement.API/"
        Invoke-Expression $apiCmd

        # Build Frontend with K8s-specific Dockerfile
        $frontendCmd = "docker build $($buildArgs -join ' ') -f frontend/Dockerfile.k8s -t task-management-app-frontend:$Tag frontend/"
        Invoke-Expression $frontendCmd
    }
    else {
        Write-ColorOutput "Cyan" "🐳 Building for local Docker Compose..."
        $composeCmd = "$script:DockerComposeCmd build $($buildArgs -join ' ') --parallel"
        Invoke-Expression $composeCmd
    }

    Write-ColorOutput "Green" "✅ Build completed successfully!"
}

# Function to run application
function Invoke-Run {
    Write-Header "STARTING APPLICATION"
    
    $runArgs = @()
    if ($Detached) {
        $runArgs += "-d"
        Write-ColorOutput "Blue" "🚀 Starting application in detached mode..."
    }
    else {
        Write-ColorOutput "Blue" "🚀 Starting application..."
    }
    
    $runCmd = "$script:DockerComposeCmd up $($runArgs -join ' ')"
    Invoke-Expression $runCmd
    
    if ($Detached) {
        Write-ColorOutput "Green" "✅ Application started successfully!"
        Write-ColorOutput "Cyan" "📱 Frontend: http://localhost:3000"
        Write-ColorOutput "Cyan" "🔧 Backend API: http://localhost:5000"
        Write-ColorOutput "Cyan" "📚 API Docs: http://localhost:5000/swagger"
        Write-Output ""
        Write-ColorOutput "Yellow" "💡 To view logs: $script:DockerComposeCmd logs -f"
        Write-ColorOutput "Yellow" "💡 To stop: $script:DockerComposeCmd down"
    }
}

# Function to push to registry
function Invoke-RegistryPush {
    Write-Header "PUSHING TO REGISTRY"
    
    if ([string]::IsNullOrEmpty($PushRegistry)) {
        Write-ColorOutput "Red" "❌ Registry path not specified"
        exit 1
    }
    
    # Construct full image names using the registry path and image tag
    $apiImage = "$PushRegistry/taskmanagement-api:$Tag"
    $frontendImage = "$PushRegistry/taskmanagement-frontend:$Tag"

    Write-ColorOutput "Blue" "🏷️ Tagging images for registry..."
    Write-ColorOutput "Cyan" "📱 API Image: $apiImage"
    Write-ColorOutput "Cyan" "🌐 Frontend Image: $frontendImage"

    docker tag task-management-app-api $apiImage
    docker tag task-management-app-frontend $frontendImage

    Write-ColorOutput "Blue" "📤 Pushing API image..."
    docker push $apiImage

    Write-ColorOutput "Blue" "📤 Pushing Frontend image..."
    docker push $frontendImage

    Write-ColorOutput "Green" "✅ Images pushed successfully!"
    Write-ColorOutput "Cyan" "📱 API Image: $apiImage"
    Write-ColorOutput "Cyan" "🌐 Frontend Image: $frontendImage"

    Write-Output ""
    Write-ColorOutput "Yellow" "💡 To deploy these images to Kubernetes:"
    Write-ColorOutput "Yellow" "   .\scripts\k8s-deploy.ps1 -Registry $PushRegistry -ImageTag $Tag -ImagePullSecret <secret-name> -Deploy"
}

# Function to show application status
function Show-Status {
    Write-Header "APPLICATION STATUS"
    
    Write-ColorOutput "Blue" "📊 Container Status:"
    Invoke-Expression "$script:DockerComposeCmd ps"
    
    Write-Output ""
    Write-ColorOutput "Blue" "🔗 Application URLs:"
    Write-ColorOutput "Cyan" "📱 Frontend: http://localhost:3000"
    Write-ColorOutput "Cyan" "🔧 Backend API: http://localhost:5000"
    Write-ColorOutput "Cyan" "📚 API Documentation: http://localhost:5000/swagger"
    Write-ColorOutput "Cyan" "❤️ Health Check: http://localhost:5000/health"
}

# Main execution
if ($Help) {
    Show-Usage
    exit 0
}

# Set default behavior if no specific action is chosen
if (-not $CleanupOnly -and -not $BuildRun -and [string]::IsNullOrEmpty($PushRegistry)) {
    $BuildRun = $true
}

Write-Header "TASKFLOW BUILD AND DEPLOY SCRIPT - POWERSHELL"

# Check prerequisites
Test-Prerequisites

# Always perform cleanup first (unless skipping build and only running)
if (-not $SkipBuild) {
    Invoke-Cleanup
    Test-Ports
}

# Execute based on chosen action
if ($CleanupOnly) {
    Write-ColorOutput "Green" "🎉 Cleanup completed successfully!"
    exit 0
}

if (-not [string]::IsNullOrEmpty($PushRegistry)) {
    if (-not $SkipBuild) {
        Invoke-Build
    }
    Invoke-RegistryPush
    exit 0
}

if ($BuildRun) {
    if (-not $SkipBuild) {
        Invoke-Build
    }
    Invoke-Run
    
    if ($Detached) {
        Show-Status
    }
}

Write-ColorOutput "Green" "🎉 Script completed successfully!"