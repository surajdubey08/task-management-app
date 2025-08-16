# Build and Push Images for SRE POC
# This script builds, tags, and pushes Docker images to the SRE POC registry

param(
    [switch]$SkipCleanup = $false,
    [switch]$Help = $false
)

# Registry configuration
$REGISTRY_URL = "sre-citizenuser-jfp-west-virtual-docker-prod001.artifacts-west.pwc.com"
$REGISTRY_PROJECT = "sre-poc-app"
$API_IMAGE_NAME = "taskmanagement-api"
$FRONTEND_IMAGE_NAME = "taskmanagement-frontend"
$IMAGE_TAG = "latest"

# Full image names
$LOCAL_API_IMAGE = "${API_IMAGE_NAME}:${IMAGE_TAG}"
$LOCAL_FRONTEND_IMAGE = "${FRONTEND_IMAGE_NAME}:${IMAGE_TAG}"
$REGISTRY_API_IMAGE = "${REGISTRY_URL}/${REGISTRY_PROJECT}/${API_IMAGE_NAME}:${IMAGE_TAG}"
$REGISTRY_FRONTEND_IMAGE = "${REGISTRY_URL}/${REGISTRY_PROJECT}/${FRONTEND_IMAGE_NAME}:${IMAGE_TAG}"

# Function to display help
function Show-Help {
    Write-Host "SRE POC - Build and Push Docker Images" -ForegroundColor Green
    Write-Host ""
    Write-Host "DESCRIPTION:" -ForegroundColor Yellow
    Write-Host "  Builds, tags, and pushes Docker images to the SRE POC registry"
    Write-Host ""
    Write-Host "USAGE:" -ForegroundColor Yellow
    Write-Host "  .\scripts\build-image-for-sre-poc.ps1 [OPTIONS]"
    Write-Host ""
    Write-Host "OPTIONS:" -ForegroundColor Yellow
    Write-Host "  -SkipCleanup    Skip Docker cleanup step"
    Write-Host "  -Help           Show this help message"
    Write-Host ""
    Write-Host "PREREQUISITES:" -ForegroundColor Yellow
    Write-Host "  1. Docker must be running"
    Write-Host "  2. Must be logged in to registry:"
    Write-Host "     docker login $REGISTRY_URL"
    Write-Host ""
    Write-Host "EXAMPLES:" -ForegroundColor Yellow
    Write-Host "  .\scripts\build-image-for-sre-poc.ps1"
    Write-Host "  .\scripts\build-image-for-sre-poc.ps1 -SkipCleanup"
}

# Function to print colored output
function Write-ColorOutput {
    param(
        [string]$Message,
        [string]$Color = "White"
    )
    Write-Host $Message -ForegroundColor $Color
}

# Function to print header
function Write-Header {
    param([string]$Title)
    
    Write-Host ""
    Write-ColorOutput "==============================================" "Blue"
    Write-ColorOutput $Title "Blue"
    Write-ColorOutput "==============================================" "Blue"
    Write-Host ""
}

# Function to check if Docker is running
function Test-Docker {
    Write-ColorOutput "Checking Docker status..." "Blue"
    
    try {
        $dockerInfo = docker info 2>$null
        if ($LASTEXITCODE -ne 0) {
            throw "Docker command failed"
        }
        Write-ColorOutput "✅ Docker is running" "Green"
        return $true
    }
    catch {
        Write-ColorOutput "❌ Error: Docker is not running or not accessible" "Red"
        Write-ColorOutput "Please start Docker and try again" "Yellow"
        exit 1
    }
}

# Function to check Docker login
function Test-DockerLogin {
    Write-ColorOutput "Checking Docker registry authentication..." "Blue"
    
    try {
        # Try to get registry info (this will fail if not logged in)
        $loginCheck = docker system info 2>$null
        Write-ColorOutput "Note: Make sure you are logged in to the registry:" "Yellow"
        Write-ColorOutput "docker login $REGISTRY_URL" "Cyan"
        Write-ColorOutput "Continuing with build process..." "Yellow"
    }
    catch {
        Write-ColorOutput "Warning: Unable to verify registry authentication" "Yellow"
    }
}

# Function to clean up Docker resources
function Invoke-DockerCleanup {
    if ($SkipCleanup) {
        Write-ColorOutput "Skipping Docker cleanup (SkipCleanup flag set)" "Yellow"
        return
    }
    
    Write-Header "CLEANING UP DOCKER RESOURCES"
    
    Write-ColorOutput "Stopping and removing containers..." "Yellow"
    docker container prune -f 2>$null | Out-Null
    
    Write-ColorOutput "Removing unused images..." "Yellow"
    docker image prune -f 2>$null | Out-Null
    
    Write-ColorOutput "Removing unused volumes..." "Yellow"
    docker volume prune -f 2>$null | Out-Null
    
    Write-ColorOutput "Removing unused networks..." "Yellow"
    docker network prune -f 2>$null | Out-Null
    
    # Remove specific images if they exist
    Write-ColorOutput "Removing existing TaskFlow images..." "Yellow"
    docker rmi $LOCAL_API_IMAGE 2>$null | Out-Null
    docker rmi $LOCAL_FRONTEND_IMAGE 2>$null | Out-Null
    docker rmi $REGISTRY_API_IMAGE 2>$null | Out-Null
    docker rmi $REGISTRY_FRONTEND_IMAGE 2>$null | Out-Null
    
    Write-ColorOutput "✅ Docker cleanup completed" "Green"
}

# Function to build images
function Build-Images {
    Write-Header "BUILDING DOCKER IMAGES"
    
    # Build API image
    Write-ColorOutput "Building API image..." "Cyan"
    Set-Location "backend/TaskManagement.API"
    docker build -t $LOCAL_API_IMAGE .
    if ($LASTEXITCODE -ne 0) {
        Write-ColorOutput "❌ Failed to build API image" "Red"
        exit 1
    }
    Set-Location "../.."
    Write-ColorOutput "✅ API image built successfully: $LOCAL_API_IMAGE" "Green"
    
    # Build Frontend image
    Write-ColorOutput "Building Frontend image..." "Cyan"
    Set-Location "frontend"
    docker build -t $LOCAL_FRONTEND_IMAGE .
    if ($LASTEXITCODE -ne 0) {
        Write-ColorOutput "❌ Failed to build Frontend image" "Red"
        exit 1
    }
    Set-Location ".."
    Write-ColorOutput "✅ Frontend image built successfully: $LOCAL_FRONTEND_IMAGE" "Green"
}

# Function to tag images
function Add-ImageTags {
    Write-Header "TAGGING IMAGES FOR REGISTRY"
    
    Write-ColorOutput "Tagging API image..." "Cyan"
    docker tag $LOCAL_API_IMAGE $REGISTRY_API_IMAGE
    if ($LASTEXITCODE -ne 0) {
        Write-ColorOutput "❌ Failed to tag API image" "Red"
        exit 1
    }
    Write-ColorOutput "✅ API image tagged: $REGISTRY_API_IMAGE" "Green"
    
    Write-ColorOutput "Tagging Frontend image..." "Cyan"
    docker tag $LOCAL_FRONTEND_IMAGE $REGISTRY_FRONTEND_IMAGE
    if ($LASTEXITCODE -ne 0) {
        Write-ColorOutput "❌ Failed to tag Frontend image" "Red"
        exit 1
    }
    Write-ColorOutput "✅ Frontend image tagged: $REGISTRY_FRONTEND_IMAGE" "Green"
}

# Function to push images
function Push-Images {
    Write-Header "PUSHING IMAGES TO REGISTRY"
    
    Write-ColorOutput "Pushing API image..." "Cyan"
    docker push $REGISTRY_API_IMAGE
    if ($LASTEXITCODE -ne 0) {
        Write-ColorOutput "❌ Failed to push API image" "Red"
        Write-ColorOutput "Make sure you are logged in: docker login $REGISTRY_URL" "Yellow"
        exit 1
    }
    Write-ColorOutput "✅ API image pushed successfully" "Green"
    
    Write-ColorOutput "Pushing Frontend image..." "Cyan"
    docker push $REGISTRY_FRONTEND_IMAGE
    if ($LASTEXITCODE -ne 0) {
        Write-ColorOutput "❌ Failed to push Frontend image" "Red"
        Write-ColorOutput "Make sure you are logged in: docker login $REGISTRY_URL" "Yellow"
        exit 1
    }
    Write-ColorOutput "✅ Frontend image pushed successfully" "Green"
}

# Function to display summary
function Show-Summary {
    Write-Header "BUILD AND PUSH SUMMARY"
    
    Write-ColorOutput "✅ Successfully built and pushed images:" "Green"
    Write-Host ""
    Write-ColorOutput "API Image:" "Cyan"
    Write-ColorOutput "  Local:    $LOCAL_API_IMAGE" "Yellow"
    Write-ColorOutput "  Registry: $REGISTRY_API_IMAGE" "Yellow"
    Write-Host ""
    Write-ColorOutput "Frontend Image:" "Cyan"
    Write-ColorOutput "  Local:    $LOCAL_FRONTEND_IMAGE" "Yellow"
    Write-ColorOutput "  Registry: $REGISTRY_FRONTEND_IMAGE" "Yellow"
    Write-Host ""
    Write-ColorOutput "✅ Images are now available in the SRE POC registry!" "Green"
    Write-Host ""
    Write-ColorOutput "To deploy these images:" "Blue"
    Write-ColorOutput "  kubectl apply -f k8s/" "Cyan"
    Write-Host ""
}

# Main execution
function Main {
    if ($Help) {
        Show-Help
        return
    }
    
    Write-Header "SRE POC - BUILD AND PUSH DOCKER IMAGES"
    
    Write-ColorOutput "Registry: $REGISTRY_URL" "Blue"
    Write-ColorOutput "Project:  $REGISTRY_PROJECT" "Blue"
    Write-ColorOutput "Tag:      $IMAGE_TAG" "Blue"
    Write-Host ""
    
    # Prerequisite checks
    Test-Docker
    Test-DockerLogin
    
    # Main workflow
    Invoke-DockerCleanup
    Build-Images
    Add-ImageTags
    Push-Images
    Show-Summary
    
    Write-ColorOutput "🎉 Build and push process completed successfully!" "Green"
}

# Error handling
trap {
    Write-ColorOutput "❌ Script interrupted or failed" "Red"
    exit 1
}

# Run main function
Main
