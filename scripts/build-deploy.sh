#!/bin/bash

# TaskFlow Build and Deploy Script
# Comprehensive script for building, deploying, and managing TaskFlow application
# Supports Docker cleanup, build, run, and registry push operations

set -e  # Exit on any error

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Default values
CLEANUP_ONLY=false
BUILD_RUN_ONLY=false
PUSH_TO_REGISTRY=false
REGISTRY_PATH=""
IMAGE_TAG="latest"
SKIP_BUILD=false
DETACHED=false
FORCE_REBUILD=false
K8S_BUILD=false

# Function to print colored output
print_color() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

# Function to print header
print_header() {
    echo
    print_color $PURPLE "=================================="
    print_color $PURPLE "$1"
    print_color $PURPLE "=================================="
    echo
}

# Function to show usage
show_usage() {
    cat << EOF
TaskFlow Build and Deploy Script

USAGE:
    $0 [OPTIONS]

OPTIONS:
    --cleanup-only         Only perform cleanup and prune operations
    --build-run            Build and run the application (default if no options)
    --push-registry PATH   Build and push images to registry (requires login)
    --tag TAG              Image tag to use (default: latest)
    --skip-build           Skip building, only run existing images
    --detached             Run containers in detached mode
    --force-rebuild        Force rebuild without using cache
    --k8s-build            Build for Kubernetes deployment (uses k8s-specific configs)
    --help                 Show this help message

EXAMPLES:
    # Clean up everything and build/run application
    $0 --build-run

    # Only cleanup Docker resources
    $0 --cleanup-only

    # Build and push to registry with default tag
    $0 --push-registry my.company.com/taskflow

    # Build and push with custom tag
    $0 --push-registry my.company.com/taskflow --tag v1.0.0

    # Run in detached mode
    $0 --build-run --detached

    # Force rebuild without cache
    $0 --build-run --force-rebuild

REGISTRY PUSH:
    To push to a registry, ensure you are logged in first:
    docker login my.company.com

    Then specify the registry path (without image name):
    $0 --push-registry my.company.com/taskflow
    $0 --push-registry my.company.com/taskflow --tag v1.2.3

EOF
}

# Function to check prerequisites
check_prerequisites() {
    print_header "CHECKING PREREQUISITES"
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        print_color $RED "❌ Docker is not installed or not in PATH"
        exit 1
    fi
    print_color $GREEN "✅ Docker found: $(docker --version)"
    
    # Check Docker Compose
    if command -v docker-compose &> /dev/null; then
        DOCKER_COMPOSE_CMD="docker-compose"
        print_color $GREEN "✅ Docker Compose found: $(docker-compose --version)"
    elif docker compose version &> /dev/null; then
        DOCKER_COMPOSE_CMD="docker compose"
        print_color $GREEN "✅ Docker Compose (plugin) found: $(docker compose version)"
    else
        print_color $RED "❌ Docker Compose is not available"
        exit 1
    fi
    
    # Check if Docker daemon is running
    if ! docker info &> /dev/null; then
        print_color $RED "❌ Docker daemon is not running"
        exit 1
    fi
    print_color $GREEN "✅ Docker daemon is running"
}

# Function to perform comprehensive cleanup
perform_cleanup() {
    print_header "PERFORMING COMPREHENSIVE CLEANUP"
    
    print_color $YELLOW "🛑 Stopping all TaskFlow containers..."
    $DOCKER_COMPOSE_CMD down --remove-orphans 2>/dev/null || true
    
    print_color $YELLOW "🗑️ Removing TaskFlow images..."
    docker rmi task-management-app-api task-management-app-frontend 2>/dev/null || true
    
    print_color $YELLOW "🧹 Pruning unused Docker resources..."
    docker container prune -f
    docker image prune -f
    docker volume prune -f
    docker network prune -f
    
    print_color $YELLOW "🔍 Checking for processes on ports 3000 and 5000..."
    
    # Kill processes on port 3000
    if command -v lsof &> /dev/null && lsof -ti:3000 >/dev/null 2>&1; then
        print_color $YELLOW "⚡ Terminating process on port 3000..."
        lsof -ti:3000 | xargs kill -9 2>/dev/null || true
    elif command -v netstat &> /dev/null && netstat -tlnp 2>/dev/null | grep -q ":3000 "; then
        print_color $YELLOW "⚡ Terminating process on port 3000..."
        fuser -k 3000/tcp 2>/dev/null || true
    fi
    
    # Kill processes on port 5000
    if command -v lsof &> /dev/null && lsof -ti:5000 >/dev/null 2>&1; then
        print_color $YELLOW "⚡ Terminating process on port 5000..."
        lsof -ti:5000 | xargs kill -9 2>/dev/null || true
    elif command -v netstat &> /dev/null && netstat -tlnp 2>/dev/null | grep -q ":5000 "; then
        print_color $YELLOW "⚡ Terminating process on port 5000..."
        fuser -k 5000/tcp 2>/dev/null || true
    fi
    
    print_color $GREEN "✅ Cleanup completed successfully!"
}

# Function to verify ports are available
verify_ports() {
    print_color $BLUE "🔍 Verifying ports 3000 and 5000 are available..."
    
    if command -v lsof &> /dev/null; then
        if lsof -ti:3000 >/dev/null 2>&1; then
            print_color $RED "❌ Port 3000 is still in use!"
            lsof -i:3000
            exit 1
        fi
        if lsof -ti:5000 >/dev/null 2>&1; then
            print_color $RED "❌ Port 5000 is still in use!"
            lsof -i:5000
            exit 1
        fi
    elif command -v netstat &> /dev/null; then
        if netstat -tlnp 2>/dev/null | grep -q ":3000 "; then
            print_color $RED "❌ Port 3000 is still in use!"
            netstat -tlnp | grep ":3000 "
            exit 1
        fi
        if netstat -tlnp 2>/dev/null | grep -q ":5000 "; then
            print_color $RED "❌ Port 5000 is still in use!"
            netstat -tlnp | grep ":5000 "
            exit 1
        fi
    fi
    
    print_color $GREEN "✅ Ports are available"
}

# Function to build application
build_application() {
    print_header "BUILDING APPLICATION"

    local build_args=""
    if [ "$FORCE_REBUILD" = true ]; then
        build_args="--no-cache"
        print_color $YELLOW "🔨 Force rebuilding without cache..."
    else
        print_color $BLUE "🔨 Building application..."
    fi

    if [ "$K8S_BUILD" = true ]; then
        print_color $CYAN "🎯 Building for Kubernetes deployment..."

        # Build API (same for both)
        docker build $build_args -t task-management-app-api:$IMAGE_TAG backend/TaskManagement.API/

        # Build Frontend with K8s-specific Dockerfile
        docker build $build_args -f frontend/Dockerfile.k8s -t task-management-app-frontend:$IMAGE_TAG frontend/
    else
        print_color $CYAN "🐳 Building for local Docker Compose..."
        $DOCKER_COMPOSE_CMD build $build_args --parallel
    fi

    print_color $GREEN "✅ Build completed successfully!"
}

# Function to run application
run_application() {
    print_header "STARTING APPLICATION"
    
    local run_args=""
    if [ "$DETACHED" = true ]; then
        run_args="-d"
        print_color $BLUE "🚀 Starting application in detached mode..."
    else
        print_color $BLUE "🚀 Starting application..."
    fi
    
    $DOCKER_COMPOSE_CMD up $run_args
    
    if [ "$DETACHED" = true ]; then
        print_color $GREEN "✅ Application started successfully!"
        print_color $CYAN "📱 Frontend: http://localhost:3000"
        print_color $CYAN "🔧 Backend API: http://localhost:5000"
        print_color $CYAN "📚 API Docs: http://localhost:5000/swagger"
        echo
        print_color $YELLOW "💡 To view logs: $DOCKER_COMPOSE_CMD logs -f"
        print_color $YELLOW "💡 To stop: $DOCKER_COMPOSE_CMD down"
    fi
}

# Function to push to registry
push_to_registry() {
    print_header "PUSHING TO REGISTRY"
    
    if [ -z "$REGISTRY_PATH" ]; then
        print_color $RED "❌ Registry path not specified"
        exit 1
    fi
    
    # Construct full image names using the registry path and image tag
    local api_image="${REGISTRY_PATH}/taskmanagement-api:${IMAGE_TAG}"
    local frontend_image="${REGISTRY_PATH}/taskmanagement-frontend:${IMAGE_TAG}"

    print_color $BLUE "🏷️ Tagging images for registry..."
    print_color $CYAN "📱 API Image: ${api_image}"
    print_color $CYAN "🌐 Frontend Image: ${frontend_image}"

    docker tag task-management-app-api "${api_image}"
    docker tag task-management-app-frontend "${frontend_image}"

    print_color $BLUE "📤 Pushing API image..."
    docker push "${api_image}"

    print_color $BLUE "📤 Pushing Frontend image..."
    docker push "${frontend_image}"

    print_color $GREEN "✅ Images pushed successfully!"
    print_color $CYAN "📱 API Image: ${api_image}"
    print_color $CYAN "🌐 Frontend Image: ${frontend_image}"

    echo
    print_color $YELLOW "💡 To deploy these images to Kubernetes:"
    print_color $YELLOW "   ./scripts/k8s-deploy.sh --registry ${REGISTRY_PATH} --image-tag ${IMAGE_TAG} --image-pull-secret <secret-name> deploy"
    print_color $YELLOW "   Example: ./scripts/k8s-deploy.sh --registry ${REGISTRY_PATH} --image-tag ${IMAGE_TAG} --image-pull-secret sre-jfrog-artifactory deploy"
}

# Function to show application status
show_status() {
    print_header "APPLICATION STATUS"
    
    print_color $BLUE "📊 Container Status:"
    $DOCKER_COMPOSE_CMD ps
    
    echo
    print_color $BLUE "🔗 Application URLs:"
    print_color $CYAN "📱 Frontend: http://localhost:3000"
    print_color $CYAN "🔧 Backend API: http://localhost:5000"
    print_color $CYAN "📚 API Documentation: http://localhost:5000/swagger"
    print_color $CYAN "❤️ Health Check: http://localhost:5000/health"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --cleanup-only)
            CLEANUP_ONLY=true
            shift
            ;;
        --build-run)
            BUILD_RUN_ONLY=true
            shift
            ;;
        --push-registry)
            PUSH_TO_REGISTRY=true
            REGISTRY_PATH="$2"
            shift 2
            ;;
        --tag)
            IMAGE_TAG="$2"
            shift 2
            ;;
        --skip-build)
            SKIP_BUILD=true
            shift
            ;;
        --detached)
            DETACHED=true
            shift
            ;;
        --force-rebuild)
            FORCE_REBUILD=true
            shift
            ;;
        --k8s-build)
            K8S_BUILD=true
            shift
            ;;
        --help)
            show_usage
            exit 0
            ;;
        *)
            print_color $RED "❌ Unknown option: $1"
            show_usage
            exit 1
            ;;
    esac
done

# Set default behavior if no specific action is chosen
if [ "$CLEANUP_ONLY" = false ] && [ "$BUILD_RUN_ONLY" = false ] && [ "$PUSH_TO_REGISTRY" = false ]; then
    BUILD_RUN_ONLY=true
fi

# Main execution
print_header "TASKFLOW BUILD AND DEPLOY SCRIPT"

# Check prerequisites
check_prerequisites

# Always perform cleanup first (unless skipping build and only running)
if [ "$SKIP_BUILD" = false ]; then
    perform_cleanup
    verify_ports
fi

# Execute based on chosen action
if [ "$CLEANUP_ONLY" = true ]; then
    print_color $GREEN "🎉 Cleanup completed successfully!"
    exit 0
fi

if [ "$PUSH_TO_REGISTRY" = true ]; then
    if [ "$SKIP_BUILD" = false ]; then
        build_application
    fi
    push_to_registry
    exit 0
fi

if [ "$BUILD_RUN_ONLY" = true ]; then
    if [ "$SKIP_BUILD" = false ]; then
        build_application
    fi
    run_application
    
    if [ "$DETACHED" = true ]; then
        show_status
    fi
fi

print_color $GREEN "🎉 Script completed successfully!"
