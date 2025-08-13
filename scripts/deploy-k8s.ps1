# PowerShell script to deploy the Task Management application to Kubernetes

param(
    [string]$Namespace = "taskmanagement",
    [string]$ImageTag = "latest",
    [switch]$BuildImages = $false
)

Write-Host "Deploying Task Management Application to Kubernetes" -ForegroundColor Green
Write-Host "Namespace: $Namespace" -ForegroundColor Yellow
Write-Host "Image Tag: $ImageTag" -ForegroundColor Yellow

# Function to check if kubectl is available
function Test-Kubectl {
    try {
        kubectl version --client --short | Out-Null
        return $true
    }
    catch {
        Write-Error "kubectl is not available. Please install kubectl and configure it to connect to your cluster."
        return $false
    }
}

# Function to check if Docker is available
function Test-Docker {
    try {
        docker version --format '{{.Client.Version}}' | Out-Null
        return $true
    }
    catch {
        Write-Error "Docker is not available. Please install Docker."
        return $false
    }
}

# Check prerequisites
if (-not (Test-Kubectl)) {
    exit 1
}

if ($BuildImages -and -not (Test-Docker)) {
    exit 1
}

# Build Docker images if requested
if ($BuildImages) {
    Write-Host "Building Docker images..." -ForegroundColor Blue
    
    # Build backend image
    Write-Host "Building backend image..." -ForegroundColor Cyan
    Set-Location "backend/TaskManagement.API"
    docker build -t "taskmanagement-api:$ImageTag" .
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Failed to build backend image"
        exit 1
    }
    Set-Location "../.."
    
    # Build frontend image
    Write-Host "Building frontend image..." -ForegroundColor Cyan
    Set-Location "frontend"
    docker build -t "taskmanagement-frontend:$ImageTag" .
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Failed to build frontend image"
        exit 1
    }
    Set-Location ".."
    
    Write-Host "Docker images built successfully!" -ForegroundColor Green
}

# Create namespace
Write-Host "Creating namespace..." -ForegroundColor Blue
kubectl apply -f k8s/namespace.yaml

# Apply ConfigMap and Secrets
Write-Host "Applying configuration..." -ForegroundColor Blue
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/secret.yaml

# Deploy API
Write-Host "Deploying API..." -ForegroundColor Blue
kubectl apply -f k8s/api-deployment.yaml

# Wait for API to be ready
Write-Host "Waiting for API to be ready..." -ForegroundColor Yellow
kubectl wait --for=condition=ready pod -l app=taskmanagement-api -n $Namespace --timeout=300s
if ($LASTEXITCODE -ne 0) {
    Write-Warning "API may not be ready yet. Continuing with deployment..."
}

# Deploy Frontend
Write-Host "Deploying Frontend..." -ForegroundColor Blue
kubectl apply -f k8s/frontend-deployment.yaml

# Wait for frontend to be ready
Write-Host "Waiting for Frontend to be ready..." -ForegroundColor Yellow
kubectl wait --for=condition=ready pod -l app=taskmanagement-frontend -n $Namespace --timeout=300s

# Get service information
Write-Host "`nDeployment completed!" -ForegroundColor Green
Write-Host "Getting service information..." -ForegroundColor Blue

kubectl get services -n $Namespace

# Get frontend service URL
$frontendService = kubectl get service taskmanagement-frontend-service -n $Namespace -o jsonpath='{.status.loadBalancer.ingress[0].ip}'
if ($frontendService) {
    Write-Host "`nApplication is available at: http://$frontendService" -ForegroundColor Green
} else {
    Write-Host "`nTo access the application, run:" -ForegroundColor Yellow
    Write-Host "kubectl port-forward service/taskmanagement-frontend-service 3000:80 -n $Namespace" -ForegroundColor Cyan
    Write-Host "Then open http://localhost:3000 in your browser" -ForegroundColor Cyan
}

# Show pod status
Write-Host "`nPod status:" -ForegroundColor Blue
kubectl get pods -n $Namespace

Write-Host "`nDeployment script completed!" -ForegroundColor Green
