# Kubernetes Deployment Guide

## ✅ **DEPLOYMENT READY - COMPREHENSIVE GUIDE**

This document provides a complete guide for deploying the TaskFlow application to Kubernetes clusters with enterprise-grade configurations.

## 🎯 **Quick Deployment**

### Prerequisites

- Kubernetes cluster access with `kubectl` configured
- Container registry access (for production deployments)
- Image pull secrets configured in target namespace

### Production Deployment

```bash
# 1. Validate configuration
./scripts/k8s-validate.sh

# 2. Deploy with registry images
./scripts/k8s-deploy.sh \
  --registry my.company.com/taskflow \
  --image-tag v1.0.0 \
  --image-pull-secret my-registry-secret \
  --namespace production \
  deploy

# 3. Verify deployment
./scripts/k8s-deploy.sh --namespace production status

# 4. Populate database
./scripts/k8s-database-manager.sh --namespace production populate
```

### Development Deployment

```bash
# Deploy with local images
./scripts/k8s-deploy.sh deploy

# Check status
./scripts/k8s-deploy.sh status
```

## 🔧 **Configuration Architecture**

### Placeholder System

The deployment uses a dynamic placeholder system for maximum flexibility:

| Placeholder | Purpose | Example Value |
|-------------|---------|---------------|
| `API_IMAGE_PLACEHOLDER` | Backend API image | `my.company.com/taskflow/taskmanagement-api:v1.0.0` |
| `FRONTEND_IMAGE_PLACEHOLDER` | Frontend image | `my.company.com/taskflow/taskmanagement-frontend:v1.0.0` |
| `IMAGE_PULL_SECRET_PLACEHOLDER` | Registry authentication | `my-registry-secret` |

### Deployment Components

- **Namespace**: `taskmanagement` (configurable)
- **API Deployment**: 2 replicas with health checks
- **Frontend Deployment**: 2 replicas with nginx proxy
- **Services**: ClusterIP for API, LoadBalancer for Frontend
- **ConfigMaps**: Application configuration and nginx settings
- **Secrets**: Database connection and registry authentication

## 🚀 **Deployment Commands**

### Core Commands

```bash
# Deploy application
./scripts/k8s-deploy.sh [OPTIONS] deploy

# Remove application
./scripts/k8s-deploy.sh [OPTIONS] undeploy

# Show status
./scripts/k8s-deploy.sh [OPTIONS] status

# Scale replicas
./scripts/k8s-deploy.sh [OPTIONS] --replicas 5 scale

# Rollback deployment
./scripts/k8s-deploy.sh [OPTIONS] rollback
```

### Parameters

| Parameter | Description | Required | Example |
|-----------|-------------|----------|---------|
| `--namespace NAME` | Kubernetes namespace | No | `--namespace production` |
| `--registry PATH` | Container registry path | No | `--registry my.company.com/taskflow` |
| `--image-tag TAG` | Image tag | No | `--image-tag v1.0.0` |
| `--image-pull-secret NAME` | Pull secret name | Yes (with registry) | `--image-pull-secret my-secret` |
| `--replicas NUM` | Replica count | No | `--replicas 3` |
| `--dry-run` | Preview changes | No | `--dry-run` |

## 🔐 **Security Configuration**

### Image Pull Secrets

```bash
# Create image pull secret
kubectl create secret docker-registry my-registry-secret \
  --docker-server=my.company.com \
  --docker-username=myuser \
  --docker-password=mypassword \
  --docker-email=myemail@company.com \
  --namespace=taskmanagement
```

### Security Features

- **Non-root containers**: All containers run as user 1001
- **Read-only root filesystem**: Where applicable
- **Dropped capabilities**: ALL capabilities dropped
- **Security contexts**: Properly configured for all deployments
- **Network policies**: Pod-to-pod communication control

## 🌐 **Access Methods**

### Internal Access (Cluster)

```bash
# API Service
http://taskmanagement-api-service.taskmanagement.svc.cluster.local

# Frontend Service
http://taskmanagement-frontend-service.taskmanagement.svc.cluster.local
```

### External Access

#### LoadBalancer (Default - Cloud Environments)

```bash
# Get external IP (cloud providers)
kubectl get svc taskmanagement-frontend-service -n taskmanagement

# Access via external IP
http://<external-ip>
```

#### NodePort (On-Premises/Development)

If LoadBalancer is not available, enable NodePort service:

```bash
# Uncomment NodePort service in k8s/frontend-service.yaml
# Then apply the configuration
kubectl apply -f k8s/frontend-service.yaml

# Access via node IP
http://<node-ip>:30080
```

#### Ingress (Advanced)

```bash
# With ingress controller configured
http://taskmanagement.local
```

## 📊 **Resource Configuration**

### API Deployment

```yaml
resources:
  requests:
    cpu: 250m
    memory: 256Mi
  limits:
    cpu: 500m
    memory: 512Mi
```

### Frontend Deployment

```yaml
resources:
  requests:
    cpu: 100m
    memory: 128Mi
  limits:
    cpu: 200m
    memory: 256Mi
```

## 🔍 **Monitoring & Health Checks**

### Health Endpoints

- **API Health**: `/health`
- **Frontend Health**: `/health`

### Probes Configuration

```yaml
livenessProbe:
  httpGet:
    path: /health
    port: 8080
  initialDelaySeconds: 30
  periodSeconds: 10

readinessProbe:
  httpGet:
    path: /health
    port: 8080
  initialDelaySeconds: 5
  periodSeconds: 5
```

## 🛠️ **Database Management**

### Kubernetes Database Operations

```bash
# Check database status
./scripts/k8s-database-manager.sh status

# Populate with sample data
./scripts/k8s-database-manager.sh populate

# Clear all data
./scripts/k8s-database-manager.sh --force clear

# Custom namespace
./scripts/k8s-database-manager.sh --namespace production status
```

## 🔄 **CI/CD Integration**

### Pipeline Example

```yaml
stages:
  - validate:
      script: ./scripts/k8s-validate.sh
  
  - deploy:
      script: |
        ./scripts/k8s-deploy.sh \
          --registry $CI_REGISTRY \
          --image-tag $CI_COMMIT_TAG \
          --image-pull-secret $REGISTRY_SECRET \
          --namespace $ENVIRONMENT \
          deploy
  
  - verify:
      script: ./scripts/k8s-deploy.sh --namespace $ENVIRONMENT status
```

## 🚨 **Troubleshooting**

### Common Issues

#### Image Pull Errors

```bash
# Check image pull secret
kubectl get secrets -n taskmanagement

# Verify secret configuration
kubectl describe secret my-registry-secret -n taskmanagement
```

#### Pod Startup Issues

```bash
# Check pod logs
kubectl logs -f deployment/taskmanagement-api -n taskmanagement

# Check pod events
kubectl describe pod <pod-name> -n taskmanagement
```

#### Service Connectivity

```bash
# Test service endpoints
kubectl port-forward svc/taskmanagement-api-service 8080:80 -n taskmanagement

# Check service configuration
kubectl describe svc taskmanagement-api-service -n taskmanagement
```

## ✅ **Validation Checklist**

Before deployment, ensure:

- [ ] Kubernetes cluster is accessible
- [ ] Image pull secrets are configured
- [ ] Registry images are available
- [ ] Namespace exists or will be created
- [ ] Resource quotas are sufficient
- [ ] Network policies allow required traffic

## 📚 **Additional Resources**

- **Scripts Documentation**: [scripts/README.md](scripts/README.md)
- **Application README**: [README.md](README.md)
- **Sample Data**: [scripts/sample-data.json](scripts/sample-data.json)

---

**Status**: ✅ **PRODUCTION READY**  
**Last Updated**: Current  
**Validation**: All checks passed
