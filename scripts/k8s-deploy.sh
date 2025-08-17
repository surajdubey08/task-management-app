#!/bin/bash

# TaskFlow Kubernetes Deployment Script
# Comprehensive script for deploying TaskFlow application to Kubernetes cluster
# Supports deployment, rollback, scaling, and monitoring operations

set -e  # Exit on any error

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Default values
NAMESPACE="taskmanagement"
ACTION=""
IMAGE_TAG="latest"
REGISTRY_PATH=""
DRY_RUN=false
WAIT_TIMEOUT=300
REPLICAS=""

# Function to print colored output
print_color() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

# Function to print header
print_header() {
    echo
    print_color $PURPLE "=================================="
    print_color $PURPLE "$1"
    print_color $PURPLE "=================================="
    echo
}

# Function to show usage
show_usage() {
    cat << EOF
TaskFlow Kubernetes Deployment Script

USAGE:
    $0 [OPTIONS] ACTION

ACTIONS:
    deploy              Deploy application to Kubernetes
    undeploy           Remove application from Kubernetes
    status             Show deployment status
    logs               Show application logs
    scale              Scale application replicas
    rollback           Rollback to previous deployment
    restart            Restart deployments

OPTIONS:
    --namespace NAME    Kubernetes namespace (default: taskmanagement)
    --image-tag TAG     Docker image tag (default: latest)
    --registry PATH     Registry path for images
    --replicas NUM      Number of replicas for scaling
    --dry-run          Show what would be deployed without applying
    --wait-timeout SEC  Timeout for waiting operations (default: 300)
    --help             Show this help message

EXAMPLES:
    # Deploy application
    $0 deploy

    # Deploy with custom image tag
    $0 --image-tag v1.2.3 deploy

    # Deploy with registry images
    $0 --registry my.company.com/taskflow deploy

    # Scale application
    $0 --replicas 3 scale

    # Check deployment status
    $0 status

    # View logs
    $0 logs

    # Rollback deployment
    $0 rollback

    # Dry run deployment
    $0 --dry-run deploy

PREREQUISITES:
    - kubectl configured and connected to cluster
    - Appropriate RBAC permissions
    - Docker images available (local or registry)

EOF
}

# Function to check prerequisites
check_prerequisites() {
    print_header "CHECKING PREREQUISITES"
    
    # Check kubectl
    if ! command -v kubectl &> /dev/null; then
        print_color $RED "❌ kubectl is not installed or not in PATH"
        exit 1
    fi
    print_color $GREEN "✅ kubectl found: $(kubectl version --client --short 2>/dev/null || kubectl version --client)"
    
    # Check cluster connectivity
    if ! kubectl cluster-info &> /dev/null; then
        print_color $RED "❌ Cannot connect to Kubernetes cluster"
        print_color $YELLOW "💡 Make sure kubectl is configured and cluster is accessible"
        exit 1
    fi
    print_color $GREEN "✅ Connected to Kubernetes cluster"
    
    # Check cluster info
    local cluster_info=$(kubectl config current-context 2>/dev/null || echo "unknown")
    print_color $CYAN "🔗 Current context: $cluster_info"
    
    # Check if namespace exists
    if kubectl get namespace "$NAMESPACE" &> /dev/null; then
        print_color $GREEN "✅ Namespace '$NAMESPACE' exists"
    else
        print_color $YELLOW "⚠️ Namespace '$NAMESPACE' does not exist (will be created)"
    fi
}

# Function to create or update namespace
setup_namespace() {
    print_header "SETTING UP NAMESPACE"
    
    if kubectl get namespace "$NAMESPACE" &> /dev/null; then
        print_color $BLUE "📁 Namespace '$NAMESPACE' already exists"
    else
        print_color $BLUE "📁 Creating namespace '$NAMESPACE'..."
        if [ "$DRY_RUN" = true ]; then
            kubectl create namespace "$NAMESPACE" --dry-run=client -o yaml
        else
            kubectl create namespace "$NAMESPACE"
        fi
        print_color $GREEN "✅ Namespace created successfully"
    fi
}

# Function to update image tags in manifests
update_image_tags() {
    print_header "UPDATING IMAGE CONFIGURATIONS"
    
    local api_image="task-management-app-api:$IMAGE_TAG"
    local frontend_image="task-management-app-frontend:$IMAGE_TAG"

    if [ -n "$REGISTRY_PATH" ]; then
        api_image="${REGISTRY_PATH}/taskmanagement-api:$IMAGE_TAG"
        frontend_image="${REGISTRY_PATH}/taskmanagement-frontend:$IMAGE_TAG"
    fi
    
    print_color $BLUE "🏷️ API Image: $api_image"
    print_color $BLUE "🏷️ Frontend Image: $frontend_image"
    
    # Create temporary manifests with updated images
    mkdir -p /tmp/taskflow-k8s
    
    # Update API deployment
    sed "s|image: task-management-app-api.*|image: $api_image|g" k8s/api-deployment.yaml > /tmp/taskflow-k8s/api-deployment.yaml
    
    # Update Frontend deployment
    sed "s|image: task-management-app-frontend.*|image: $frontend_image|g" k8s/frontend-deployment.yaml > /tmp/taskflow-k8s/frontend-deployment.yaml
    
    # Copy other manifests
    cp k8s/namespace.yaml /tmp/taskflow-k8s/ 2>/dev/null || true
    cp k8s/configmap.yaml /tmp/taskflow-k8s/ 2>/dev/null || true
    cp k8s/nginx-configmap.yaml /tmp/taskflow-k8s/ 2>/dev/null || true
    cp k8s/secret.yaml /tmp/taskflow-k8s/ 2>/dev/null || true
    
    print_color $GREEN "✅ Image configurations updated"
}

# Function to deploy application
deploy_application() {
    print_header "DEPLOYING APPLICATION"
    
    setup_namespace
    update_image_tags
    
    local kubectl_args=""
    if [ "$DRY_RUN" = true ]; then
        kubectl_args="--dry-run=client"
        print_color $YELLOW "🔍 DRY RUN - Showing what would be deployed:"
    else
        print_color $BLUE "🚀 Deploying TaskFlow to Kubernetes..."
    fi
    
    # Apply manifests in order
    local manifests=(
        "namespace.yaml"
        "configmap.yaml"
        "nginx-configmap.yaml"
        "secret.yaml"
        "api-deployment.yaml"
        "api-service.yaml"
        "frontend-deployment.yaml"
        "frontend-service.yaml"
        "ingress.yaml"
    )
    
    for manifest in "${manifests[@]}"; do
        if [ -f "/tmp/taskflow-k8s/$manifest" ]; then
            print_color $CYAN "📄 Applying $manifest..."
            kubectl apply -f "/tmp/taskflow-k8s/$manifest" -n "$NAMESPACE" $kubectl_args
        elif [ -f "k8s/$manifest" ]; then
            print_color $CYAN "📄 Applying $manifest..."
            kubectl apply -f "k8s/$manifest" -n "$NAMESPACE" $kubectl_args
        else
            print_color $YELLOW "⚠️ Manifest $manifest not found, skipping..."
        fi
    done
    
    if [ "$DRY_RUN" = false ]; then
        print_color $BLUE "⏳ Waiting for deployments to be ready..."
        kubectl wait --for=condition=available --timeout=${WAIT_TIMEOUT}s deployment --all -n "$NAMESPACE"
        print_color $GREEN "✅ Application deployed successfully!"
    fi
    
    # Cleanup temporary files
    rm -rf /tmp/taskflow-k8s
}

# Function to undeploy application
undeploy_application() {
    print_header "UNDEPLOYING APPLICATION"
    
    print_color $YELLOW "🗑️ Removing TaskFlow from Kubernetes..."
    
    # Delete in reverse order
    kubectl delete -f k8s/ -n "$NAMESPACE" --ignore-not-found=true
    
    print_color $BLUE "📁 Removing namespace '$NAMESPACE'..."
    kubectl delete namespace "$NAMESPACE" --ignore-not-found=true
    
    print_color $GREEN "✅ Application undeployed successfully!"
}

# Function to show deployment status
show_status() {
    print_header "DEPLOYMENT STATUS"
    
    if ! kubectl get namespace "$NAMESPACE" &> /dev/null; then
        print_color $RED "❌ Namespace '$NAMESPACE' does not exist"
        return 1
    fi
    
    print_color $BLUE "📊 Namespace: $NAMESPACE"
    echo
    
    print_color $CYAN "🚀 Deployments:"
    kubectl get deployments -n "$NAMESPACE" -o wide
    echo
    
    print_color $CYAN "📦 Pods:"
    kubectl get pods -n "$NAMESPACE" -o wide
    echo
    
    print_color $CYAN "🌐 Services:"
    kubectl get services -n "$NAMESPACE" -o wide
    echo
    
    print_color $CYAN "🔧 ConfigMaps:"
    kubectl get configmaps -n "$NAMESPACE"
    echo
    
    # Show ingress if exists
    if kubectl get ingress -n "$NAMESPACE" &> /dev/null; then
        print_color $CYAN "🌍 Ingress:"
        kubectl get ingress -n "$NAMESPACE" -o wide
        echo
    fi
    
    # Show resource usage
    print_color $CYAN "📈 Resource Usage:"
    kubectl top pods -n "$NAMESPACE" 2>/dev/null || print_color $YELLOW "⚠️ Metrics not available (metrics-server required)"
}

# Function to show logs
show_logs() {
    print_header "APPLICATION LOGS"
    
    print_color $BLUE "📋 Available pods in namespace '$NAMESPACE':"
    kubectl get pods -n "$NAMESPACE" --no-headers -o custom-columns=":metadata.name"
    echo
    
    print_color $CYAN "🔍 API Logs:"
    kubectl logs -l app=taskmanagement-api -n "$NAMESPACE" --tail=50 --follow=false
    echo
    
    print_color $CYAN "🔍 Frontend Logs:"
    kubectl logs -l app=taskmanagement-frontend -n "$NAMESPACE" --tail=50 --follow=false
}

# Function to scale application
scale_application() {
    print_header "SCALING APPLICATION"
    
    if [ -z "$REPLICAS" ]; then
        print_color $RED "❌ Number of replicas not specified"
        print_color $YELLOW "💡 Use --replicas NUM to specify replica count"
        exit 1
    fi
    
    print_color $BLUE "📈 Scaling deployments to $REPLICAS replicas..."
    
    kubectl scale deployment taskmanagement-api --replicas="$REPLICAS" -n "$NAMESPACE"
    kubectl scale deployment taskmanagement-frontend --replicas="$REPLICAS" -n "$NAMESPACE"
    
    print_color $BLUE "⏳ Waiting for scaling to complete..."
    kubectl wait --for=condition=available --timeout=${WAIT_TIMEOUT}s deployment --all -n "$NAMESPACE"
    
    print_color $GREEN "✅ Scaling completed successfully!"
    show_status
}

# Function to rollback deployment
rollback_deployment() {
    print_header "ROLLING BACK DEPLOYMENT"
    
    print_color $BLUE "⏪ Rolling back deployments..."
    
    kubectl rollout undo deployment/taskmanagement-api -n "$NAMESPACE"
    kubectl rollout undo deployment/taskmanagement-frontend -n "$NAMESPACE"
    
    print_color $BLUE "⏳ Waiting for rollback to complete..."
    kubectl rollout status deployment/taskmanagement-api -n "$NAMESPACE" --timeout=${WAIT_TIMEOUT}s
    kubectl rollout status deployment/taskmanagement-frontend -n "$NAMESPACE" --timeout=${WAIT_TIMEOUT}s
    
    print_color $GREEN "✅ Rollback completed successfully!"
    show_status
}

# Function to restart deployments
restart_deployments() {
    print_header "RESTARTING DEPLOYMENTS"
    
    print_color $BLUE "🔄 Restarting deployments..."
    
    kubectl rollout restart deployment/taskmanagement-api -n "$NAMESPACE"
    kubectl rollout restart deployment/taskmanagement-frontend -n "$NAMESPACE"
    
    print_color $BLUE "⏳ Waiting for restart to complete..."
    kubectl rollout status deployment/taskmanagement-api -n "$NAMESPACE" --timeout=${WAIT_TIMEOUT}s
    kubectl rollout status deployment/taskmanagement-frontend -n "$NAMESPACE" --timeout=${WAIT_TIMEOUT}s
    
    print_color $GREEN "✅ Restart completed successfully!"
    show_status
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --namespace)
            NAMESPACE="$2"
            shift 2
            ;;
        --image-tag)
            IMAGE_TAG="$2"
            shift 2
            ;;
        --registry)
            REGISTRY_PATH="$2"
            shift 2
            ;;
        --replicas)
            REPLICAS="$2"
            shift 2
            ;;
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        --wait-timeout)
            WAIT_TIMEOUT="$2"
            shift 2
            ;;
        --help)
            show_usage
            exit 0
            ;;
        deploy|undeploy|status|logs|scale|rollback|restart)
            ACTION="$1"
            shift
            ;;
        *)
            print_color $RED "❌ Unknown option: $1"
            show_usage
            exit 1
            ;;
    esac
done

# Validate action
if [ -z "$ACTION" ]; then
    print_color $RED "❌ No action specified"
    show_usage
    exit 1
fi

# Main execution
print_header "TASKFLOW KUBERNETES DEPLOYMENT SCRIPT"

# Check prerequisites
check_prerequisites

# Execute based on action
case $ACTION in
    deploy)
        deploy_application
        if [ "$DRY_RUN" = false ]; then
            show_status
        fi
        ;;
    undeploy)
        undeploy_application
        ;;
    status)
        show_status
        ;;
    logs)
        show_logs
        ;;
    scale)
        scale_application
        ;;
    rollback)
        rollback_deployment
        ;;
    restart)
        restart_deployments
        ;;
    *)
        print_color $RED "❌ Unknown action: $ACTION"
        show_usage
        exit 1
        ;;
esac

print_color $GREEN "🎉 Script completed successfully!"
