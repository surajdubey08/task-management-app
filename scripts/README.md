# TaskFlow Automation Scripts

Enterprise-grade automation scripts for building, deploying, and managing the TaskFlow application across development, staging, and production environments.

## 📋 Script Overview

| Script | Purpose | Environment | Key Features |
|--------|---------|-------------|--------------|
| `build-deploy.sh` | Build & Container Management | Local/Docker | Multi-stage builds, registry push, cleanup |
| `k8s-deploy.sh` | Kubernetes Deployment | K8s Clusters | Multi-environment, scaling, rollback |
| `database-manager.sh` | Database Operations | Local/Docker | API-based data management |
| `k8s-database-manager.sh` | Database Operations | Kubernetes | Port forwarding, service discovery |
| `k8s-validate.sh` | Configuration Validation | Pre-deployment | Comprehensive validation checks |

## 🎯 Quick Start

### Development Workflow
```bash
# Build and run locally
./scripts/build-deploy.sh --build-run

# Populate with sample data
./scripts/database-manager.sh populate
```

### Production Deployment
```bash
# Build and push to registry
./scripts/build-deploy.sh --push-registry my.company.com/taskflow --tag v1.0.0

# Validate Kubernetes configuration
./scripts/k8s-validate.sh

# Deploy to Kubernetes
./scripts/k8s-deploy.sh --registry my.company.com/taskflow --image-tag v1.0.0 --image-pull-secret my-secret deploy
```

## 🔧 Prerequisites

### System Requirements

- **Bash shell** (Linux/macOS/WSL)
- **Docker & Docker Compose** (for containerized operations)
- **kubectl** (for Kubernetes operations)
- **curl** (for API operations)
- **jq** (for JSON processing)
- **.NET 8 SDK** (for local development)

### Installing Prerequisites

**Ubuntu/WSL:**

```bash
sudo apt update
sudo apt install curl jq docker.io docker-compose kubectl
```

**macOS:**

```bash
brew install curl jq docker docker-compose kubectl
```

**Windows:**
Use WSL (Windows Subsystem for Linux) and follow Ubuntu instructions above.

### Permissions

- Execute permissions on script files
- Docker daemon access
- Kubernetes cluster access (for k8s operations)
- Network access to APIs and registries

---

## 🚀 Script 1: build-deploy.sh

### Purpose

Comprehensive script for building, deploying, and managing TaskFlow application containers. Handles Docker cleanup, image building, container orchestration, and registry operations.

### Usage

```bash
./scripts/build-deploy.sh [OPTIONS]
```

### Parameters

| Parameter | Description | Example |
|-----------|-------------|---------|
| `--cleanup-only` | Only perform cleanup and prune operations | `./scripts/build-deploy.sh --cleanup-only` |
| `--build-run` | Build and run the application (default) | `./scripts/build-deploy.sh --build-run` |
| `--push-registry PATH` | Build and push images to registry | `./scripts/build-deploy.sh --push-registry my.company.com/taskflow` |
| `--tag TAG` | Image tag to use (default: latest) | `./scripts/build-deploy.sh --tag v1.0.0` |
| `--skip-build` | Skip building, only run existing images | `./scripts/build-deploy.sh --skip-build` |
| `--detached` | Run containers in detached mode | `./scripts/build-deploy.sh --build-run --detached` |
| `--force-rebuild` | Force rebuild without using cache | `./scripts/build-deploy.sh --build-run --force-rebuild` |
| `--help` | Show help message | `./scripts/build-deploy.sh --help` |

### Use Cases

#### 1. Development Workflow

```bash
# Clean start for development
./scripts/build-deploy.sh --cleanup-only
./scripts/build-deploy.sh --build-run

# Quick restart without rebuild
./scripts/build-deploy.sh --skip-build
```

#### 2. Production Deployment

```bash
# Build and push to production registry
docker login my.company.com
./scripts/build-deploy.sh --push-registry my.company.com/taskflow --tag v1.0.0

# Run in background for server deployment
./scripts/build-deploy.sh --build-run --detached
```

### Registry Push Workflow

1. **Login to registry:**

   ```bash
   docker login my.company.com
   ```

2. **Build and push with default tag (latest):**

   ```bash
   ./scripts/build-deploy.sh --push-registry my.company.com/taskflow
   ```

3. **Build and push with custom tag:**

   ```bash
   ./scripts/build-deploy.sh --push-registry my.company.com/taskflow --tag v1.2.3
   ```

**Note:** The script automatically appends `/taskmanagement-api:TAG` and `/taskmanagement-frontend:TAG` to the registry path.

---

## 🎯 Script 2: k8s-deploy.sh

### Purpose

Complete Kubernetes deployment automation with support for multiple environments, scaling, monitoring, and rollback capabilities.

### Usage

```bash
./scripts/k8s-deploy.sh [OPTIONS] ACTION
```

### Actions

| Action | Description | Example |
|--------|-------------|---------|
| `deploy` | Deploy application to Kubernetes | `./scripts/k8s-deploy.sh deploy` |
| `undeploy` | Remove application from Kubernetes | `./scripts/k8s-deploy.sh undeploy` |
| `status` | Show deployment status | `./scripts/k8s-deploy.sh status` |
| `logs` | Show application logs | `./scripts/k8s-deploy.sh logs` |
| `scale` | Scale application replicas | `./scripts/k8s-deploy.sh --replicas 3 scale` |
| `rollback` | Rollback to previous deployment | `./scripts/k8s-deploy.sh rollback` |
| `restart` | Restart deployments | `./scripts/k8s-deploy.sh restart` |

### Parameters

| Parameter | Description | Default | Example |
|-----------|-------------|---------|---------|
| `--namespace NAME` | Kubernetes namespace | `taskmanagement` | `--namespace production` |
| `--image-tag TAG` | Docker image tag | `latest` | `--image-tag v1.0.0` |
| `--registry PATH` | Registry path for images | - | `--registry my.company.com/taskflow` |
| `--image-pull-secret NAME` | Image pull secret name (required with registry) | `sre-jfrog-artifactory` | `--image-pull-secret my-secret` |
| `--replicas NUM` | Number of replicas for scaling | - | `--replicas 5` |
| `--dry-run` | Show what would be deployed | - | `--dry-run` |
| `--help` | Show help message | - | `--help` |

### Configuration Requirements
- **Registry Deployments**: Must specify `--image-pull-secret` when using `--registry`
- **Image Pull Secrets**: Must exist in target namespace before deployment
- **Placeholder System**: Uses `API_IMAGE_PLACEHOLDER`, `FRONTEND_IMAGE_PLACEHOLDER`, and `IMAGE_PULL_SECRET_PLACEHOLDER` for dynamic configuration

### Use Cases

#### 1. Development Deployment

```bash
# Deploy with default settings
./scripts/k8s-deploy.sh deploy

# Deploy with custom namespace and tag
./scripts/k8s-deploy.sh --namespace dev --image-tag v1.0.0 deploy

# Dry run to preview deployment
./scripts/k8s-deploy.sh --dry-run deploy
```

#### 2. Production Management

```bash
# Deploy from registry
./scripts/k8s-deploy.sh --registry my.company.com/taskflow --image-tag v1.2.3 --image-pull-secret sre-jfrog-artifactory deploy

# Scale for high availability
./scripts/k8s-deploy.sh --replicas 5 scale

# Monitor deployment
./scripts/k8s-deploy.sh status
./scripts/k8s-deploy.sh logs
```

---

## 📊 Script 3: database-manager.sh

### Purpose

Database management for local development and Docker Compose environments. Uses API endpoints for all operations.

### Usage

```bash
./scripts/database-manager.sh [OPTIONS] COMMAND
```

### Commands

| Command | Description | Example |
|---------|-------------|---------|
| `start` | Start the .NET API application | `./scripts/database-manager.sh start` |
| `status` | Show database and API status | `./scripts/database-manager.sh status` |
| `populate` | Populate database with sample data | `./scripts/database-manager.sh populate` |
| `clear` | Clear all data from database | `./scripts/database-manager.sh clear` |
| `remove` | Remove database file | `./scripts/database-manager.sh remove` |

### Parameters

| Parameter | Description | Example |
|-----------|-------------|---------|
| `--force` | Skip confirmation prompts | `./scripts/database-manager.sh --force clear` |
| `--help` | Show help message | `./scripts/database-manager.sh --help` |

### Features

- **Auto-Start Capability**: Can automatically start the .NET application if not running
- **API-Based Operations**: All operations go through REST API endpoints
- **Data Integrity**: Respects application business rules and validation
- **No External Tools**: No need to install SQLite3 or other database tools

---

## 🎯 Script 4: k8s-database-manager.sh

### Purpose

Database management for applications running in Kubernetes clusters. Provides seamless data operations through port forwarding and service discovery.

### Usage

```bash
./scripts/k8s-database-manager.sh [OPTIONS] COMMAND
```

### Commands

| Command | Description | Example |
|---------|-------------|---------|
| `status` | Show deployment and data status | `./scripts/k8s-database-manager.sh status` |
| `populate` | Populate database with sample data | `./scripts/k8s-database-manager.sh populate` |
| `clear` | Clear all data from database | `./scripts/k8s-database-manager.sh clear` |

### Parameters

| Parameter | Description | Example |
|-----------|-------------|---------|
| `--namespace NAME` | Kubernetes namespace | `./scripts/k8s-database-manager.sh --namespace production status` |
| `--service NAME` | API service name | `./scripts/k8s-database-manager.sh --service api-service populate` |
| `--port PORT` | Local port for port forwarding | `./scripts/k8s-database-manager.sh --port 9090 status` |
| `--force` | Skip confirmation prompts | `./scripts/k8s-database-manager.sh --force clear` |
| `--help` | Show help message | `./scripts/k8s-database-manager.sh --help` |

### Features

- **Port Forwarding**: Automatic setup and cleanup of kubectl port-forward
- **Service Discovery**: Automatic detection of API services and pods
- **Multi-Environment**: Support for different namespaces and services
- **Data Validation**: JSON validation and API connectivity checks

---

## ✅ Script 5: k8s-validate.sh

### Purpose

Pre-deployment validation of all Kubernetes configurations to ensure deployment readiness.

### Usage

```bash
./scripts/k8s-validate.sh
```

### Validation Categories

- **Kubernetes Manifests**: Validates all required YAML files exist
- **Docker Configurations**: Checks Dockerfile and docker-compose.yml
- **Port Configurations**: Ensures consistent port mappings
- **Service Communication**: Validates inter-service connectivity setup
- **Environment Variables**: Checks all required variables are present
- **Security Configurations**: Validates security contexts and permissions
- **Resource Management**: Checks resource limits and requests
- **Health Checks**: Validates liveness and readiness probes

---

## 🔄 Complete Workflow Examples

### Development Workflow

```bash
# 1. Start local development
./scripts/build-deploy.sh --build-run

# 2. Populate with sample data
./scripts/database-manager.sh populate

# 3. Check status
./scripts/database-manager.sh status
```

### Production Deployment Workflow

```bash
# 1. Build and push images to registry
docker login my.company.com
./scripts/build-deploy.sh --push-registry my.company.com/taskflow --tag v1.0.0

# 2. Validate Kubernetes configuration
./scripts/k8s-validate.sh

# 3. Deploy to Kubernetes with registry images
./scripts/k8s-deploy.sh \
  --namespace production \
  --registry my.company.com/taskflow \
  --image-tag v1.0.0 \
  --image-pull-secret my-registry-secret \
  deploy

# 4. Populate database with sample data
./scripts/k8s-database-manager.sh --namespace production populate

# 5. Verify deployment status
./scripts/k8s-deploy.sh --namespace production status
```

### Key Features
- **Placeholder-Based Configuration**: Uses dynamic placeholders for images and secrets
- **Multi-Environment Support**: Consistent deployment across dev, staging, and production
- **Validation Pipeline**: Pre-deployment validation prevents configuration errors
- **Registry Integration**: Seamless integration with container registries
- **Security**: Configurable image pull secrets for private registries

---

## 🛠️ Environment Variables

### Common Variables

| Variable | Description | Default | Example |
|----------|-------------|---------|---------|
| `NAMESPACE` | Kubernetes namespace | `taskmanagement` | `export NAMESPACE=production` |
| `REGISTRY_PATH` | Container registry path | - | `export REGISTRY_PATH=my.company.com/taskflow` |
| `IMAGE_TAG` | Docker image tag | `latest` | `export IMAGE_TAG=v1.0.0` |

### Database Manager Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `API_URL` | API base URL | `http://localhost:5000` |
| `DB_FILE` | Database file path | `backend/TaskManagement.API/taskmanagement.db` |
| `SAMPLE_DATA_FILE` | Sample data JSON file | `scripts/sample-data.json` |

---

## 🔍 Troubleshooting

### Common Issues

#### "Database file does not exist" (Informational)

This message is normal and indicates that the SQLite database file is not found on disk. This can happen when:

- The database is created in-memory or temporarily
- The database file is created in a different location than expected
- The application uses Entity Framework's `EnsureCreated()` method

This does not affect functionality - the database operations work correctly through the API.

#### "API not responding"

1. Check if the .NET application is running: `./scripts/database-manager.sh status`
2. Start the API manually: `./scripts/database-manager.sh start`
3. Verify the API URL is correct
4. Check firewall and network connectivity

#### "kubectl command not found"

Install kubectl for your platform:

- **Ubuntu/WSL**: `sudo apt install kubectl`
- **macOS**: `brew install kubectl`
- **Windows**: Download from Kubernetes official site

#### "Permission denied" errors

Make scripts executable:

```bash
chmod +x scripts/*.sh
```

---

## 📚 Additional Resources

- **Main README**: `../README.md` - Application overview and setup
- **Kubernetes Deployment**: `../K8S-DEPLOYMENT-CHECKLIST.md` - Complete K8s deployment guide
- **Sample Data**: `sample-data.json` - JSON structure for sample data
- **Docker Compose**: `../docker-compose.yml` - Local development environment

---

**For additional support or questions, refer to the main README.md or create an issue in the repository.**
