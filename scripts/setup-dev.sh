#!/bin/bash

# Development environment setup script for Task Management Application

set -e

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

print_color $GREEN "Task Management Application - Development Setup"

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
print_color $BLUE "Checking prerequisites..."

# Check Node.js
if command_exists node; then
    NODE_VERSION=$(node --version)
    print_color $GREEN "✓ Node.js found: $NODE_VERSION"
    
    # Check if version is 18 or higher
    NODE_MAJOR=$(echo $NODE_VERSION | cut -d'.' -f1 | sed 's/v//')
    if [ "$NODE_MAJOR" -lt 18 ]; then
        print_color $YELLOW "⚠ Node.js version 18+ recommended (current: $NODE_VERSION)"
    fi
else
    print_color $RED "✗ Node.js not found. Please install Node.js 18+"
    exit 1
fi

# Check npm
if command_exists npm; then
    NPM_VERSION=$(npm --version)
    print_color $GREEN "✓ npm found: $NPM_VERSION"
else
    print_color $RED "✗ npm not found. Please install npm"
    exit 1
fi

# Check .NET
if command_exists dotnet; then
    DOTNET_VERSION=$(dotnet --version)
    print_color $GREEN "✓ .NET found: $DOTNET_VERSION"
    
    # Check if version is 8.0 or higher
    DOTNET_MAJOR=$(echo $DOTNET_VERSION | cut -d'.' -f1)
    if [ "$DOTNET_MAJOR" -lt 8 ]; then
        print_color $YELLOW "⚠ .NET 8.0+ recommended (current: $DOTNET_VERSION)"
    fi
else
    print_color $RED "✗ .NET not found. Please install .NET 8 SDK"
    exit 1
fi

# Check Docker
if command_exists docker; then
    DOCKER_VERSION=$(docker --version | cut -d' ' -f3 | sed 's/,//')
    print_color $GREEN "✓ Docker found: $DOCKER_VERSION"
    
    # Check if Docker is running
    if docker info >/dev/null 2>&1; then
        print_color $GREEN "✓ Docker is running"
    else
        print_color $YELLOW "⚠ Docker is not running. Please start Docker"
    fi
else
    print_color $YELLOW "⚠ Docker not found. Install Docker for containerized development"
fi

# Check Docker Compose
if command_exists docker-compose || docker compose version >/dev/null 2>&1; then
    print_color $GREEN "✓ Docker Compose found"
else
    print_color $YELLOW "⚠ Docker Compose not found. Install for containerized development"
fi

# Check kubectl
if command_exists kubectl; then
    KUBECTL_VERSION=$(kubectl version --client --short 2>/dev/null | cut -d' ' -f3 || echo "unknown")
    print_color $GREEN "✓ kubectl found: $KUBECTL_VERSION"
else
    print_color $YELLOW "⚠ kubectl not found. Install for Kubernetes deployment"
fi

print_color $BLUE "\nSetting up development environment..."

# Install backend dependencies
print_color $CYAN "Installing backend dependencies..."
cd backend/TaskManagement.API
if dotnet restore; then
    print_color $GREEN "✓ Backend dependencies installed"
else
    print_color $RED "✗ Failed to install backend dependencies"
    exit 1
fi
cd ../..

# Install frontend dependencies
print_color $CYAN "Installing frontend dependencies..."
cd frontend
if npm install; then
    print_color $GREEN "✓ Frontend dependencies installed"
    # Generate package-lock.json if it doesn't exist
    if [ ! -f package-lock.json ]; then
        print_color $CYAN "Generating package-lock.json..."
        npm install --package-lock-only
        print_color $GREEN "✓ package-lock.json generated"
    fi
else
    print_color $RED "✗ Failed to install frontend dependencies"
    exit 1
fi
cd ..

# Create logs directory for backend
mkdir -p backend/TaskManagement.API/logs
print_color $GREEN "✓ Created logs directory"

print_color $GREEN "\n🎉 Development environment setup completed!"

print_color $YELLOW "\nNext steps:"
print_color $CYAN "1. For local development:"
print_color $CYAN "   Backend:  cd backend/TaskManagement.API && dotnet run"
print_color $CYAN "   Frontend: cd frontend && npm start"

print_color $CYAN "\n2. For Docker development:"
print_color $CYAN "   ./scripts/build-and-run.sh -d"

print_color $CYAN "\n3. For Kubernetes deployment:"
print_color $CYAN "   ./scripts/deploy-k8s.sh -b"

print_color $YELLOW "\nApplication URLs (when running):"
print_color $CYAN "  Frontend: http://localhost:3000"
print_color $CYAN "  Backend:  http://localhost:5000"
print_color $CYAN "  Swagger:  http://localhost:5000/swagger"
