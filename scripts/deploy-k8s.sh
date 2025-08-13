#!/bin/bash

# Bash script to deploy the Task Management application to Kubernetes

set -e

# Default values
NAMESPACE="taskmanagement"
IMAGE_TAG="latest"
BUILD_IMAGES=false

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
    echo "  -n, --namespace NAMESPACE    Kubernetes namespace (default: taskmanagement)"
    echo "  -t, --tag TAG               Docker image tag (default: latest)"
    echo "  -b, --build-images          Build Docker images before deployment"

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
;
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
    
    if ! kubectl version --client --short &> /dev/null; then
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
