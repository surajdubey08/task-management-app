#!/bin/bash

# Bash script to deploy the Task Management application to Kubernetes

set -e

# Default values
NAMESPACE="taskmanagement"
IMAGE_TAG="latest"
BUILD_IMAGES=false
USE_LOCAL_IMAGES=false

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

# Function to check if Docker images exist locally
check_local_images() {
    local api_image="taskmanagement-api:$IMAGE_TAG"
    local frontend_image="taskmanagement-frontend:$IMAGE_TAG"

    if docker image inspect "$api_image" &> /dev/null && docker image inspect "$frontend_image" &> /dev/null; then
        return 0  # Both images exist
    else
        return 1  # One or both images don't exist
    fi
}

# Function to update imagePullPolicy in Kubernetes manifests
update_image_pull_policy() {
    local policy="$1"

    print_color $CYAN "Setting imagePullPolicy to $policy in Kubernetes manifests..."

    # Update API deployment
    if [ -f "k8s/api-deployment.yaml" ]; then
        sed -i.bak "s/imagePullPolicy: .*/imagePullPolicy: $policy/" k8s/api-deployment.yaml
    fi

    # Update frontend deployment
    if [ -f "k8s/frontend-deployment.yaml" ]; then
        sed -i.bak "s/imagePullPolicy: .*/imagePullPolicy: $policy/" k8s/frontend-deployment.yaml
    fi
}

# Function to show usage
show_usage() {
    echo "Usage: $0 [OPTIONS]"
    echo "Options:"
    echo "  -n, --namespace NAMESPACE    Kubernetes namespace (default: taskmanagement)"
    echo "  -t, --tag TAG               Docker image tag (default: latest)"
    echo "  -b, --build-images          Build Docker images before deployment"
    echo "  -l, --use-local-images      Use local images (sets imagePullPolicy to Never)"
    echo "  -h, --help                  Show this help message"
    exit 1
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -n|--namespace)
            NAMESPACE="$2"
            shift 2
            ;;
        -t|--tag)
            IMAGE_TAG="$2"
            shift 2
            ;;
        -b|--build-images)
            BUILD_IMAGES=true
            shift
            ;;
        -l|--use-local-images)
            USE_LOCAL_IMAGES=true
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

print_color $GREEN "Deploying Task Management Application to Kubernetes"
print_color $YELLOW "Namespace: $NAMESPACE"
print_color $YELLOW "Image Tag: $IMAGE_TAG"

# Function to check if kubectl is available
check_kubectl() {
    if ! command -v kubectl &> /dev/null; then
        print_color $RED "kubectl is not available. Please install kubectl and configure it to connect to your cluster."
        exit 1
    fi
    
    if ! kubectl version --client &> /dev/null; then
        print_color $RED "kubectl is not properly configured. Please configure it to connect to your cluster."
        exit 1
    fi
}

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

# Check prerequisites
check_kubectl

if [ "$BUILD_IMAGES" = true ]; then
    check_docker
fi

# Build Docker images if requested
if [ "$BUILD_IMAGES" = true ]; then
    print_color $BLUE "Building Docker images..."

    # Build backend image
    print_color $CYAN "Building backend image..."
    cd backend/TaskManagement.API
    docker build -t "taskmanagement-api:$IMAGE_TAG" .
    cd ../..

    # Build frontend image
    print_color $CYAN "Building frontend image..."
    cd frontend
    docker build -t "taskmanagement-frontend:$IMAGE_TAG" .
    cd ..

    print_color $GREEN "Docker images built successfully!"

    # Load images into Kubernetes cluster (for local development)
    print_color $BLUE "Loading images into Kubernetes cluster..."

    # Detect Kubernetes environment and load images accordingly
    if command -v minikube &> /dev/null && minikube status &> /dev/null; then
        print_color $CYAN "Detected minikube - loading images..."
        minikube image load "taskmanagement-api:$IMAGE_TAG"
        minikube image load "taskmanagement-frontend:$IMAGE_TAG"
    elif command -v kind &> /dev/null; then
        # Check if kind cluster exists
        if kind get clusters 2>/dev/null | grep -q "kind"; then
            print_color $CYAN "Detected kind - loading images..."
            kind load docker-image "taskmanagement-api:$IMAGE_TAG"
            kind load docker-image "taskmanagement-frontend:$IMAGE_TAG"
        fi
    elif command -v k3d &> /dev/null; then
        # Check if k3d cluster exists
        if k3d cluster list 2>/dev/null | grep -q "k3s-default"; then
            print_color $CYAN "Detected k3d - loading images..."
            k3d image import "taskmanagement-api:$IMAGE_TAG"
            k3d image import "taskmanagement-frontend:$IMAGE_TAG"
        fi
    else
        print_color $YELLOW "Local Kubernetes cluster not detected."
        print_color $YELLOW "Images are built locally. Make sure your cluster can access them."
        print_color $YELLOW "For Docker Desktop Kubernetes, images should be available automatically."
    fi
fi

# Determine and set imagePullPolicy
if [ "$USE_LOCAL_IMAGES" = true ]; then
    print_color $BLUE "Using local images (--use-local-images flag set)..."
    if check_local_images; then
        print_color $GREEN "Local images found. Setting imagePullPolicy to Never."
        update_image_pull_policy "Never"
    else
        print_color $RED "Error: --use-local-images flag set but local images not found!"
        print_color $YELLOW "Available images:"
        docker images | grep taskmanagement || echo "No taskmanagement images found"
        print_color $YELLOW "Please build images first or remove --use-local-images flag"
        exit 1
    fi
else
    print_color $BLUE "Checking for local images..."
    if check_local_images; then
        print_color $YELLOW "Local images found. You can use --use-local-images flag to use them."
        print_color $YELLOW "Currently set to pull from registry (imagePullPolicy: IfNotPresent)."
        update_image_pull_policy "IfNotPresent"
    else
        print_color $BLUE "No local images found. Will pull from registry (imagePullPolicy: Always)."
        update_image_pull_policy "Always"
    fi
fi

# Create namespace
print_color $BLUE "Creating namespace..."
kubectl apply -f k8s/namespace.yaml

# Apply ConfigMap and Secrets
print_color $BLUE "Applying configuration..."
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/secret.yaml

# Deploy API
print_color $BLUE "Deploying API..."
kubectl apply -f k8s/api-deployment.yaml

# Wait for API to be ready
print_color $YELLOW "Waiting for API to be ready..."
if ! kubectl wait --for=condition=ready pod -l app=taskmanagement-api -n $NAMESPACE --timeout=300s; then
    print_color $YELLOW "API may not be ready yet. Continuing with deployment..."
fi

# Deploy Frontend
print_color $BLUE "Deploying Frontend..."
kubectl apply -f k8s/frontend-deployment.yaml

# Wait for frontend to be ready
print_color $YELLOW "Waiting for Frontend to be ready..."
kubectl wait --for=condition=ready pod -l app=taskmanagement-frontend -n $NAMESPACE --timeout=300s

# Get service information
print_color $GREEN "\nDeployment completed!"
print_color $BLUE "Getting service information..."

kubectl get services -n $NAMESPACE

# Get frontend service URL
FRONTEND_SERVICE=$(kubectl get service taskmanagement-frontend-service -n $NAMESPACE -o jsonpath='{.status.loadBalancer.ingress[0].ip}' 2>/dev/null || echo "")
if [ -n "$FRONTEND_SERVICE" ]; then
    print_color $GREEN "\nApplication is available at: http://$FRONTEND_SERVICE"
else
    print_color $YELLOW "\nTo access the application, run:"
    print_color $CYAN "kubectl port-forward service/taskmanagement-frontend-service 3000:80 -n $NAMESPACE"
    print_color $CYAN "Then open http://localhost:3000 in your browser"
fi

# Show pod status
print_color $BLUE "\nPod status:"
kubectl get pods -n $NAMESPACE

print_color $GREEN "\nDeployment script completed!"
