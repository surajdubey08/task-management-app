#!/bin/bash

# Bash script to build and run the Task Management application with SQLite

set -e

# Default values
SKIP_BUILD=false
DETACHED_MODE=false
CLEAN_START=false

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Function to print colored output
print_color() {
    printf "${1}${2}${NC}\n"
}

# Function to show usage
show_usage() {
    echo "Usage: $0 [OPTIONS]"
    echo "Options:"
    echo "  -s, --skip-build            Skip building Docker images"
    echo "  -d, --detached              Run in detached mode"
    echo "  -c, --clean                 Clean start - remove existing containers and volumes"
    echo "  -h, --help                  Show this help message"
    exit 1
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -s|--skip-build)
            SKIP_BUILD=true
            shift
            ;;
        -d|--detached)
            DETACHED_MODE=true
            shift
            ;;
        -c|--clean)
            CLEAN_START=true
            shift
            ;;
        -h|--help)
            show_usage
            ;;
        *)
            echo "Unknown option: $1"
            show_usage
            ;;
    esac
done

print_color $GREEN "Task Management Application - Build and Run Script"
print_color $CYAN "🚀 This script will automatically detect and stop any running instances before starting fresh!"

# Function to check if Docker is available
check_docker() {
    if ! command -v docker &> /dev/null; then
        print_color $RED "Docker is not available. Please install Docker."
        exit 1
    fi
    
    if ! docker version --format '{{.Client.Version}}' &> /dev/null; then
        print_color $RED "Docker is not running. Please start Docker."
        exit 1
    fi
}

# Function to check if Docker Compose is available
check_docker_compose() {
    # Check for docker-compose (standalone) or docker compose (plugin)
    if command -v docker-compose &> /dev/null; then
        DOCKER_COMPOSE_CMD="docker-compose"
    elif docker compose version &> /dev/null; then
        DOCKER_COMPOSE_CMD="docker compose"
    else
        print_color $RED "Docker Compose is not available. Please install Docker Compose."
        exit 1
    fi
}

# Function to check and stop running application instances
cleanup_running_instances() {
    print_color $YELLOW "🔍 Checking for running application instances..."

    # Check for Docker containers
    if command -v docker &> /dev/null; then
        print_color $BLUE "Checking for Docker containers..."

        # Stop and remove containers from this project
        if docker ps -q --filter "name=task-management" | grep -q .; then
            print_color $YELLOW "📦 Found running Docker containers. Stopping them..."
            docker stop $(docker ps -q --filter "name=task-management") 2>/dev/null || true
            docker rm $(docker ps -aq --filter "name=task-management") 2>/dev/null || true
        fi

        # Try to stop using docker-compose if available
        if [ -f "docker-compose.yml" ]; then
            print_color $BLUE "🐳 Stopping Docker Compose services..."
            $DOCKER_COMPOSE_CMD down -v --remove-orphans 2>/dev/null || true
        fi
    fi

    # Check for processes running on ports 3000 and 5000
    print_color $BLUE "🔌 Checking for processes on ports 3000 and 5000..."

    # Kill processes on port 3000 (React frontend)
    if command -v lsof &> /dev/null && lsof -ti:3000 >/dev/null 2>&1; then
        print_color $YELLOW "⚡ Found process on port 3000. Terminating..."
        lsof -ti:3000 | xargs kill -9 2>/dev/null || true
        sleep 2
    elif command -v netstat &> /dev/null && netstat -tlnp 2>/dev/null | grep -q ":3000 "; then
        print_color $YELLOW "⚡ Found process on port 3000. Terminating..."
        fuser -k 3000/tcp 2>/dev/null || true
        sleep 2
    fi

    # Kill processes on port 5000 (ASP.NET backend)
    if command -v lsof &> /dev/null && lsof -ti:5000 >/dev/null 2>&1; then
        print_color $YELLOW "⚡ Found process on port 5000. Terminating..."
        lsof -ti:5000 | xargs kill -9 2>/dev/null || true
        sleep 2
    elif command -v netstat &> /dev/null && netstat -tlnp 2>/dev/null | grep -q ":5000 "; then
        print_color $YELLOW "⚡ Found process on port 5000. Terminating..."
        fuser -k 5000/tcp 2>/dev/null || true
        sleep 2
    fi

    # Kill any dotnet processes related to TaskManagement
    if pgrep -f "TaskManagement" >/dev/null 2>&1; then
        print_color $YELLOW "🔧 Found TaskManagement .NET processes. Terminating..."
        pkill -f "TaskManagement" 2>/dev/null || true
        sleep 2
    fi

    # Kill any npm/node processes that might be running the frontend
    if pgrep -f "react-scripts" >/dev/null 2>&1; then
        print_color $YELLOW "⚛️ Found React development server processes. Terminating..."
        pkill -f "react-scripts" 2>/dev/null || true
        sleep 2
    fi

    # Kill any node processes running on port 3000
    if pgrep -f "node.*3000" >/dev/null 2>&1; then
        print_color $YELLOW "🟢 Found Node.js processes on port 3000. Terminating..."
        pkill -f "node.*3000" 2>/dev/null || true
        sleep 2
    fi

    print_color $GREEN "✅ Cleanup completed!"
}

# Function to verify ports are free
verify_ports_free() {
    print_color $BLUE "🔍 Verifying ports 3000 and 5000 are available..."

    # Check port 3000
    if command -v lsof &> /dev/null && lsof -ti:3000 >/dev/null 2>&1; then
        print_color $RED "❌ Port 3000 is still in use!"
        lsof -i:3000
        exit 1
    elif command -v netstat &> /dev/null && netstat -tlnp 2>/dev/null | grep -q ":3000 "; then
        print_color $RED "❌ Port 3000 is still in use!"
        netstat -tlnp | grep ":3000 "
        exit 1
    fi

    # Check port 5000
    if command -v lsof &> /dev/null && lsof -ti:5000 >/dev/null 2>&1; then
        print_color $RED "❌ Port 5000 is still in use!"
        lsof -i:5000
        exit 1
    elif command -v netstat &> /dev/null && netstat -tlnp 2>/dev/null | grep -q ":5000 "; then
        print_color $RED "❌ Port 5000 is still in use!"
        netstat -tlnp | grep ":5000 "
        exit 1
    fi

    print_color $GREEN "✅ Ports are available!"
}

# Check prerequisites
check_docker
check_docker_compose

print_color $BLUE "Using Docker Compose command: $DOCKER_COMPOSE_CMD"

# Always cleanup running instances before starting
cleanup_running_instances
verify_ports_free

# Clean start - remove existing containers and volumes
if [ "$CLEAN_START" = true ]; then
    print_color $YELLOW "🧹 Performing deep cleanup of containers and volumes..."
    $DOCKER_COMPOSE_CMD down -v --remove-orphans || true
    docker system prune -f || true
    print_color $GREEN "✅ Deep cleanup completed!"
fi

# Build images if not skipped
if [ "$SKIP_BUILD" = false ]; then
    print_color $BLUE "Building Docker images..."
    $DOCKER_COMPOSE_CMD build
    print_color $GREEN "Docker images built successfully!"
fi

# Start services
print_color $BLUE "Starting services..."
if [ "$DETACHED_MODE" = true ]; then
    $DOCKER_COMPOSE_CMD up -d
else
    $DOCKER_COMPOSE_CMD up
fi

if [ "$DETACHED_MODE" = true ]; then
    print_color $GREEN "\nServices started successfully!"
    print_color $YELLOW "Application URLs:"
    print_color $CYAN "  Frontend: http://localhost:3000"
    print_color $CYAN "  Backend API: http://localhost:5000"
    print_color $CYAN "  Swagger UI: http://localhost:5000/swagger"
    
    print_color $YELLOW "\nTo view logs, run:"
    print_color $CYAN "  $DOCKER_COMPOSE_CMD logs -f"
    
    print_color $YELLOW "\nTo stop services, run:"
    print_color $CYAN "  $DOCKER_COMPOSE_CMD down"
    
    print_color $YELLOW "\nTo check service status, run:"
    print_color $CYAN "  $DOCKER_COMPOSE_CMD ps"
    
    print_color $GREEN "\n🎉 Application started successfully!"
    print_color $CYAN "Perfect for demos and POCs!"
fi
