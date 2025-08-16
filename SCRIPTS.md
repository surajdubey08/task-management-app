# TaskFlow Automation Scripts Documentation

This document provides comprehensive documentation for all automation scripts included with TaskFlow, covering their usage, parameters, and various use cases.

## 📁 Scripts Overview

TaskFlow includes three powerful automation scripts designed to streamline development, deployment, and database management workflows:

1. **`build-deploy.sh`** - Build and deployment automation
2. **`k8s-deploy.sh`** - Kubernetes deployment management
3. **`database-manager.sh`** - Database operations and data management

## 🔧 Prerequisites

### System Requirements
- **Bash shell** (Linux/macOS/WSL)
- **Docker & Docker Compose** (for containerized operations)
- **kubectl** (for Kubernetes operations)
- **curl** (for API operations)
- **jq** (recommended for JSON processing)

### Permissions
- Execute permissions on script files
- Docker daemon access
- Kubernetes cluster access (for k8s operations)
- Network access to APIs and registries

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
| `--push-registry PATH` | Build and push images to registry | `./scripts/build-deploy.sh --push-registry myregistry.com/taskflow` |
| `--skip-build` | Skip building, only run existing images | `./scripts/build-deploy.sh --skip-build` |
| `--detached` | Run containers in detached mode | `./scripts/build-deploy.sh --build-run --detached` |
| `--force-rebuild` | Force rebuild without using cache | `./scripts/build-deploy.sh --build-run --force-rebuild` |
| `--help` | Show help message | `./scripts/build-deploy.sh --help` |

### Use Cases

#### 1. Development Workflow
```bash
# Start fresh development environment
./scripts/build-deploy.sh --build-run

# Quick restart without rebuild
./scripts/build-deploy.sh --skip-build

# Force clean rebuild
./scripts/build-deploy.sh --cleanup-only
./scripts/build-deploy.sh --build-run --force-rebuild
```

#### 2. Production Deployment
```bash
# Build and push to production registry
docker login myregistry.com
./scripts/build-deploy.sh --push-registry myregistry.com/apps/taskflow:v1.0.0

# Run in background for server deployment
./scripts/build-deploy.sh --build-run --detached
```

#### 3. Maintenance Operations
```bash
# Clean up Docker resources
./scripts/build-deploy.sh --cleanup-only

# Reset development environment
./scripts/build-deploy.sh --cleanup-only
./scripts/build-deploy.sh --build-run
```

### Registry Push Workflow
1. **Login to registry**:
   ```bash
   docker login myregistry.com
   ```

2. **Build and push**:
   ```bash
   ./scripts/build-deploy.sh --push-registry myregistry.com/apps/taskflow:latest
   ```

3. **Verify images**:
   ```bash
   docker images | grep taskflow
   ```

## ☸️ Script 2: k8s-deploy.sh

### Purpose
Kubernetes deployment management script for deploying, scaling, monitoring, and managing TaskFlow application in Kubernetes clusters.

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
| `--image-tag TAG` | Docker image tag | `latest` | `--image-tag v1.2.3` |
| `--registry PATH` | Registry path for images | - | `--registry myregistry.com/taskflow` |
| `--replicas NUM` | Number of replicas | - | `--replicas 5` |
| `--dry-run` | Show what would be deployed | - | `--dry-run` |
| `--wait-timeout SEC` | Timeout for operations | `300` | `--wait-timeout 600` |

### Use Cases

#### 1. Initial Deployment
```bash
# Deploy with default settings
./scripts/k8s-deploy.sh deploy

# Deploy with custom namespace and tag
./scripts/k8s-deploy.sh --namespace production --image-tag v1.0.0 deploy

# Dry run to preview deployment
./scripts/k8s-deploy.sh --dry-run deploy
```

#### 2. Production Management
```bash
# Deploy from registry
./scripts/k8s-deploy.sh --registry myregistry.com/taskflow --image-tag v1.2.3 deploy

# Scale for high availability
./scripts/k8s-deploy.sh --replicas 5 scale

# Monitor deployment
./scripts/k8s-deploy.sh status
./scripts/k8s-deploy.sh logs
```

#### 3. Maintenance Operations
```bash
# Rolling restart
./scripts/k8s-deploy.sh restart

# Rollback problematic deployment
./scripts/k8s-deploy.sh rollback

# Complete removal
./scripts/k8s-deploy.sh undeploy
```

#### 4. Multi-Environment Workflow
```bash
# Development environment
./scripts/k8s-deploy.sh --namespace dev --image-tag dev-latest deploy

# Staging environment
./scripts/k8s-deploy.sh --namespace staging --image-tag v1.2.3-rc deploy

# Production environment
./scripts/k8s-deploy.sh --namespace production --image-tag v1.2.3 deploy
```

## 🗄️ Script 3: database-manager.sh

### Purpose
Database management script for resetting, populating, backing up, and managing TaskFlow database operations through API calls.

### Usage
```bash
./scripts/database-manager.sh [OPTIONS] ACTION
```

### Actions

| Action | Description | Example |
|--------|-------------|---------|
| `reset` | Reset database (clear all data) | `./scripts/database-manager.sh reset` |
| `populate` | Populate with sample data | `./scripts/database-manager.sh populate` |
| `reset-populate` | Reset and populate database | `./scripts/database-manager.sh reset-populate` |
| `backup` | Backup database to file | `./scripts/database-manager.sh --backup-file backup.json backup` |
| `restore` | Restore database from file | `./scripts/database-manager.sh --backup-file backup.json restore` |
| `status` | Show database statistics | `./scripts/database-manager.sh status` |

### Parameters

| Parameter | Description | Default | Example |
|-----------|-------------|---------|---------|
| `--api-url URL` | API base URL | `http://localhost:5000/api` | `--api-url https://api.taskflow.com/api` |
| `--backup-file FILE` | Backup file path | Auto-generated | `--backup-file my-backup.json` |
| `--force` | Force operation without confirmation | - | `--force` |

### Use Cases

#### 1. Development Setup
```bash
# Quick setup with sample data
./scripts/database-manager.sh reset-populate

# Check current state
./scripts/database-manager.sh status

# Reset for clean testing
./scripts/database-manager.sh --force reset
```

#### 2. Data Management
```bash
# Create backup before changes
./scripts/database-manager.sh --backup-file pre-migration-backup.json backup

# Populate fresh environment
./scripts/database-manager.sh populate

# Restore from backup
./scripts/database-manager.sh --backup-file pre-migration-backup.json restore
```

#### 3. Production Operations
```bash
# Production API operations
./scripts/database-manager.sh --api-url https://api.taskflow.com/api status

# Automated backup
./scripts/database-manager.sh --api-url https://api.taskflow.com/api --backup-file "backup-$(date +%Y%m%d).json" backup

# Force reset (use with caution)
./scripts/database-manager.sh --api-url https://api.taskflow.com/api --force reset
```

### Sample Data Overview
The populate action creates:
- **7 Users**: Representing different departments (Engineering, Product, Design, Marketing, QA, DevOps, Data Science)
- **5 Categories**: Frontend, Backend, Design, Testing, DevOps with color coding
- **12 Tasks**: Realistic tasks with various statuses, priorities, and due dates

## 🔄 Common Workflows

### Complete Development Setup
```bash
# 1. Clean environment setup
./scripts/build-deploy.sh --cleanup-only
./scripts/build-deploy.sh --build-run --detached

# 2. Wait for services to start
sleep 30

# 3. Setup database with sample data
./scripts/database-manager.sh reset-populate

# 4. Verify everything is working
./scripts/database-manager.sh status
```

### Production Deployment Workflow
```bash
# 1. Build and push images
docker login myregistry.com
./scripts/build-deploy.sh --push-registry myregistry.com/apps/taskflow:v1.0.0

# 2. Deploy to Kubernetes
./scripts/k8s-deploy.sh --namespace production --registry myregistry.com/apps/taskflow --image-tag v1.0.0 deploy

# 3. Verify deployment
./scripts/k8s-deploy.sh --namespace production status

# 4. Scale for production load
./scripts/k8s-deploy.sh --namespace production --replicas 3 scale
```

### Disaster Recovery Workflow
```bash
# 1. Create backup
./scripts/database-manager.sh --backup-file emergency-backup.json backup

# 2. If needed, restore from backup
./scripts/database-manager.sh --backup-file emergency-backup.json restore

# 3. Restart services if needed
./scripts/k8s-deploy.sh restart
```

## 🛠️ Troubleshooting

### Common Issues

#### Port Conflicts
```bash
# Clean up port conflicts
./scripts/build-deploy.sh --cleanup-only
```

#### Docker Issues
```bash
# Reset Docker environment
docker system prune -a -f
./scripts/build-deploy.sh --build-run --force-rebuild
```

#### Kubernetes Issues
```bash
# Check cluster connectivity
kubectl cluster-info

# Reset deployment
./scripts/k8s-deploy.sh undeploy
./scripts/k8s-deploy.sh deploy
```

#### API Connectivity Issues
```bash
# Check API status
curl http://localhost:5000/health

# Restart API container
docker-compose restart api
```

## 🔒 Security Considerations

### Registry Authentication
- Always login before pushing to registries
- Use secure credentials and tokens
- Implement image scanning in CI/CD

### Kubernetes Security
- Use appropriate RBAC permissions
- Implement network policies
- Regular security updates

### Database Security
- Secure API endpoints
- Use environment-specific URLs
- Regular backup verification

## 📊 Monitoring and Logging

### Application Monitoring
```bash
# Check deployment status
./scripts/k8s-deploy.sh status

# View application logs
./scripts/k8s-deploy.sh logs

# Monitor database state
./scripts/database-manager.sh status
```

### Performance Monitoring
```bash
# Check resource usage
kubectl top pods -n taskmanagement

# Monitor container performance
docker stats
```

---

**For additional support or questions, refer to the main README.md or create an issue in the repository.**
