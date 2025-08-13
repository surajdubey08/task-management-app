# Scripts Directory

This directory contains utility scripts for building, deploying, and managing the Task Management application. Scripts are provided in both PowerShell (`.ps1`) and Bash (`.sh`) formats for cross-platform compatibility.

## Available Scripts

### Setup and Development

#### `setup-dev.ps1` / `setup-dev.sh`
Sets up the development environment by checking prerequisites and installing dependencies.

**PowerShell:**
```powershell
.\scripts\setup-dev.ps1
```

**Bash:**
```bash
./scripts/setup-dev.sh
```

**Features:**
- Checks for required tools (Node.js, .NET, Docker, kubectl)
- Installs backend and frontend dependencies
- Creates necessary directories
- Provides next steps guidance

### Build and Run

#### `build-and-run.ps1` / `build-and-run.sh`
Builds and runs the application using Docker Compose.

**🚀 New Feature: Automatic Cleanup**
These scripts now automatically detect and stop any running instances of the application before starting fresh, including:
- Docker containers from previous runs
- Processes running on ports 3000 (frontend) and 5000 (backend)
- .NET and Node.js processes related to the application
- Verification that ports are available before starting

This ensures a clean start every time, preventing port conflicts and stale processes.

**PowerShell:**
```powershell
# Run with default settings
.\scripts\build-and-run.ps1

# Run in detached mode
.\scripts\build-and-run.ps1 -DetachedMode

# Skip building images
.\scripts\build-and-run.ps1 -SkipBuild

# Clean start (remove existing containers)
.\scripts\build-and-run.ps1 -CleanStart
```

**Bash:**
```bash
# Run with default settings
./scripts/build-and-run.sh

# Run in detached mode
./scripts/build-and-run.sh --detached

# Skip building images
./scripts/build-and-run.sh --skip-build

# Clean start
./scripts/build-and-run.sh --clean
```

### Kubernetes Deployment

#### `deploy-k8s.ps1` / `deploy-k8s.sh`
Deploys the application to a Kubernetes cluster.

**PowerShell:**
```powershell
# Deploy with default settings
.\scripts\deploy-k8s.ps1

# Build images and deploy
.\scripts\deploy-k8s.ps1 -BuildImages

# Deploy to custom namespace
.\scripts\deploy-k8s.ps1 -Namespace "my-namespace"

# Custom image tag
.\scripts\deploy-k8s.ps1 -ImageTag "v1.0.0"
```

**Bash:**
```bash
# Deploy with default settings
./scripts/deploy-k8s.sh

# Build images and deploy
./scripts/deploy-k8s.sh --build-images

# Deploy to custom namespace
./scripts/deploy-k8s.sh --namespace "my-namespace"

# Custom image tag
./scripts/deploy-k8s.sh --tag "v1.0.0"
```

### Cleanup

#### `cleanup.ps1` / `cleanup.sh`
Cleans up Docker containers, Kubernetes resources, and build artifacts.

**PowerShell:**
```powershell
# Clean up Docker resources
.\scripts\cleanup.ps1 -Docker

# Clean up Kubernetes resources
.\scripts\cleanup.ps1 -Kubernetes

# Clean up dependencies and build artifacts
.\scripts\cleanup.ps1 -Dependencies

# Clean up everything
.\scripts\cleanup.ps1 -All

# Custom namespace for Kubernetes cleanup
.\scripts\cleanup.ps1 -Kubernetes -Namespace "my-namespace"
```

**Bash:**
```bash
# Clean up Docker resources
./scripts/cleanup.sh --docker

# Clean up Kubernetes resources
./scripts/cleanup.sh --kubernetes

# Clean up dependencies and build artifacts
./scripts/cleanup.sh --dependencies

# Clean up everything
./scripts/cleanup.sh --all

# Custom namespace for Kubernetes cleanup
./scripts/cleanup.sh --kubernetes --namespace "my-namespace"
```

### Testing Scripts

#### `test-cleanup.ps1` / `test-cleanup.sh`
Test scripts to verify the automatic cleanup functionality works correctly.

**PowerShell:**
```powershell
# Start test processes on ports 3000 and 5000
.\scripts\test-cleanup.ps1

# Then run the build script to test cleanup
.\scripts\build-and-run.ps1 -h
```

**Bash:**
```bash
# Start test processes on ports 3000 and 5000
./scripts/test-cleanup.sh

# Then run the build script to test cleanup
./scripts/build-and-run.sh --help
```

**Features:**
- Creates test processes on ports 3000 and 5000
- Allows you to verify the cleanup functionality
- Provides instructions for manual cleanup if needed

## Quick Start Workflows

### Local Development with Docker
```bash
# Setup environment
./scripts/setup-dev.sh

# Build and run
./scripts/build-and-run.sh --detached

# Access application at http://localhost:3000
```

### Kubernetes Deployment
```bash
# Setup environment
./scripts/setup-dev.sh

# Deploy to Kubernetes
./scripts/deploy-k8s.sh --build-images

# Access via port-forward or LoadBalancer
kubectl port-forward service/taskmanagement-frontend-service 3000:80 -n taskmanagement
```

### Clean Development Environment
```bash
# Clean everything
./scripts/cleanup.sh --all

# Rebuild from scratch
./scripts/setup-dev.sh
./scripts/build-and-run.sh
```

## Prerequisites

### Required Tools
- **Node.js 18+**: For frontend development
- **.NET 8 SDK**: For backend development
- **Docker**: For containerization
- **Docker Compose**: For local multi-container deployment

### Optional Tools
- **kubectl**: For Kubernetes deployment
- **Kubernetes cluster**: minikube, kind, or cloud provider

## Script Features

### Cross-Platform Compatibility
- PowerShell scripts work on Windows, macOS, and Linux
- Bash scripts work on macOS, Linux, and Windows (with WSL/Git Bash)

### Error Handling
- Comprehensive error checking and reporting
- Graceful handling of missing dependencies
- Clear error messages with suggested solutions

### Colored Output
- Color-coded output for better readability
- Consistent formatting across all scripts
- Progress indicators and status messages

### Flexible Options
- Command-line parameters for customization
- Default values for common scenarios
- Help documentation built into each script

## Troubleshooting

### Common Issues

1. **Permission Denied (Bash scripts)**
   ```bash
   chmod +x scripts/*.sh
   ```

2. **Docker not running**
   - Start Docker Desktop or Docker daemon
   - Verify with `docker version`

3. **Kubernetes context not set**
   ```bash
   kubectl config current-context
   kubectl config use-context <your-context>
   ```

4. **Port conflicts**
   - Stop other services using ports 3000 or 5000
   - Or modify port mappings in docker-compose.yml

### Getting Help

Each script includes built-in help:

**PowerShell:**
```powershell
.\scripts\<script-name>.ps1 -Help
```

**Bash:**
```bash
./scripts/<script-name>.sh --help
```

## Contributing

When adding new scripts:
1. Provide both PowerShell and Bash versions
2. Include comprehensive error handling
3. Add colored output for better UX
4. Document parameters and usage
5. Update this README
