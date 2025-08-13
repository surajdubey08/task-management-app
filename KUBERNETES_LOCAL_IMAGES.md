# Using Local Docker Images with Kubernetes

This guide explains how to use locally built Docker images with Kubernetes clusters.

## Problem
When deploying to Kubernetes, you might see this error:
```
Failed to pull image "taskmanagement-api:latest": failed to pull and unpack image "docker.io/library/taskmanagement-api:latest": failed to resolve reference "docker.io/library/taskmanagement-api:latest": pull access denied, repository does not exist or may require authorization
```

This happens because Kubernetes tries to pull images from Docker Hub, but your images only exist locally.

## Solutions

### Solution 1: Use --use-local-images Flag (Recommended)

The deployment scripts now include a `--use-local-images` flag that automatically:
1. Checks if images exist locally
2. Sets `imagePullPolicy: Never` in Kubernetes manifests
3. Ensures Kubernetes uses only local images

**Usage:**
```bash
# PowerShell
.\scripts\deploy-k8s.ps1 -UseLocalImages

# Bash
./scripts/deploy-k8s.sh --use-local-images
```

### Solution 2: Automatic Image Detection

When the `--use-local-images` flag is NOT used, the scripts automatically:
- Check if images exist locally
- Set appropriate `imagePullPolicy` based on availability:
  - `Always` - if no local images found (pulls from registry)
  - `IfNotPresent` - if local images found but flag not set
  - `Never` - if `--use-local-images` flag is used

### Solution 3: Load Images into Kubernetes Cluster

The deployment scripts automatically detect your Kubernetes environment and load images when using `--build-images`.

## Supported Kubernetes Environments

### 1. Docker Desktop Kubernetes
```bash
# Images are automatically available
./scripts/deploy-k8s.sh --build-images
```

### 2. Minikube
```bash
# Script automatically detects and loads images
./scripts/deploy-k8s.sh --build-images

# Or manually:
minikube image load taskmanagement-api:latest
minikube image load taskmanagement-frontend:latest
```

### 3. Kind (Kubernetes in Docker)
```bash
# Script automatically detects and loads images
./scripts/deploy-k8s.sh --build-images

# Or manually:
kind load docker-image taskmanagement-api:latest
kind load docker-image taskmanagement-frontend:latest
```

### 4. K3d
```bash
# Script automatically detects and loads images
./scripts/deploy-k8s.sh --build-images

# Or manually:
k3d image import taskmanagement-api:latest
k3d image import taskmanagement-frontend:latest
```

## Manual Steps

### 1. Build Images Locally
```bash
# Build backend image
cd backend/TaskManagement.API
docker build -t taskmanagement-api:latest .
cd ../..

# Build frontend image
cd frontend
docker build -t taskmanagement-frontend:latest .
cd ..
```

### 2. Load Images (if not using Docker Desktop)
Choose the appropriate command for your Kubernetes environment:

```bash
# For minikube
minikube image load taskmanagement-api:latest
minikube image load taskmanagement-frontend:latest

# For kind
kind load docker-image taskmanagement-api:latest
kind load docker-image taskmanagement-frontend:latest

# For k3d
k3d image import taskmanagement-api:latest
k3d image import taskmanagement-frontend:latest
```

### 3. Deploy to Kubernetes
```bash
kubectl apply -f k8s/
```

## Verification

Check if images are available in your cluster:

```bash
# For minikube
minikube image ls | grep taskmanagement

# For kind
docker exec -it kind-control-plane crictl images | grep taskmanagement

# For k3d
k3d image list | grep taskmanagement

# For Docker Desktop - check pods
kubectl get pods -n taskmanagement
kubectl describe pod <pod-name> -n taskmanagement
```

## Troubleshooting

### Images Not Found
1. Verify images exist locally:
   ```bash
   docker images | grep taskmanagement
   ```

2. Make sure you're using the correct Kubernetes context:
   ```bash
   kubectl config current-context
   ```

3. Check if images were loaded into the cluster (for minikube/kind/k3d)

### Pod Still Trying to Pull
1. Verify `imagePullPolicy: Never` is set in deployment files
2. Delete and recreate the deployment:
   ```bash
   kubectl delete -f k8s/api-deployment.yaml
   kubectl apply -f k8s/api-deployment.yaml
   ```

## Automated Solution

### Option 1: Use Local Images (Recommended for Development)

```bash
# PowerShell - Use local images if available
.\scripts\deploy-k8s.ps1 -UseLocalImages

# Bash - Use local images if available
./scripts/deploy-k8s.sh --use-local-images

# Build and use local images
.\scripts\deploy-k8s.ps1 -BuildImages -UseLocalImages
./scripts/deploy-k8s.sh --build-images --use-local-images
```

### Option 2: Automatic Detection

```bash
# PowerShell - Automatically detect and configure
.\scripts\deploy-k8s.ps1 -BuildImages

# Bash - Automatically detect and configure
./scripts/deploy-k8s.sh --build-images
```

### How the Scripts Work:

**With `--use-local-images` flag:**
1. Check if local images exist
2. If found: Set `imagePullPolicy: Never` and deploy
3. If not found: Show error and exit

**Without `--use-local-images` flag:**
1. Check if local images exist
2. If found: Set `imagePullPolicy: IfNotPresent` (can use local or pull)
3. If not found: Set `imagePullPolicy: Always` (must pull from registry)

**With `--build-images` flag:**
1. Build the Docker images locally
2. Detect your Kubernetes environment
3. Load images into the cluster (if needed)
4. Deploy the application

## Production Deployment

For production environments, you would typically:
1. Push images to a container registry (Docker Hub, ECR, GCR, etc.)
2. Update deployment files to reference the registry images
3. Set `imagePullPolicy: Always` or `imagePullPolicy: IfNotPresent`
