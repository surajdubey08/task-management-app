#!/bin/bash

# Build and Push Images for SRE POC
# This script builds, tags, and pushes Docker images to the SRE POC registry

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Registry configuration
REGISTRY_URL="sre-citizenuser-jfp-west-virtual-docker-prod001.artifacts-west.pwc.com"
REGISTRY_PROJECT="sre-poc-app"
API_IMAGE_NAME="taskmanagement-api"
FRONTEND_IMAGE_NAME="taskmanagement-frontend"
IMAGE_TAG="latest"

# Full image names
LOCAL_API_IMAGE="${API_IMAGE_NAME}:${IMAGE_TAG}"
LOCAL_FRONTEND_IMAGE="${FRONTEND_IMAGE_NAME}:${IMAGE_TAG}"
REGISTRY_API_IMAGE="${REGISTRY_URL}/${REGISTRY_PROJECT}/${API_IMAGE_NAME}:${IMAGE_TAG}"
REGISTRY_FRONTEND_IMAGE="${REGISTRY_URL}/${REGISTRY_PROJECT}/${FRONTEND_IMAGE_NAME}:${IMAGE_TAG}"

print_color() {
    printf "${1}${2}${NC}\n"
}

print_header() {
    echo
    print_color $BLUE "=============================================="
    print_color $BLUE "$1"
    print_color $BLUE "=============================================="
    echo
}

# Function to check if Docker is running
check_docker() {
    if ! docker info &> /dev/null; then
        print_color $RED "Error: Docker is not running or not accessible"
        print_color $YELLOW "Please start Docker and try again"
        exit 1
    fi
}

# Function to check Docker login
check_docker_login() {
    print_color $BLUE "Checking Docker registry authentication..."
    
    if ! docker info | grep -q "Registry:"; then
        print_color $YELLOW "Warning: Unable to verify registry authentication"
    fi
    
    # Try to access the registry
    if ! docker pull ${REGISTRY_URL}/hello-world:latest &> /dev/null; then
        print_color $YELLOW "Note: Make sure you are logged in to the registry:"
        print_color $CYAN "docker login ${REGISTRY_URL}"
        print_color $YELLOW "Continuing with build process..."
    else
        print_color $GREEN "Registry authentication verified"
    fi
}

# Function to clean up Docker resources
cleanup_docker() {
    print_header "CLEANING UP DOCKER RESOURCES"
    
    print_color $YELLOW "Stopping and removing containers..."
    docker container prune -f || true
    
    print_color $YELLOW "Removing unused images..."
    docker image prune -f || true
    
    print_color $YELLOW "Removing unused volumes..."
    docker volume prune -f || true
    
    print_color $YELLOW "Removing unused networks..."
    docker network prune -f || true
    
    # Remove specific images if they exist
    print_color $YELLOW "Removing existing TaskFlow images..."
    docker rmi $LOCAL_API_IMAGE 2>/dev/null || true
    docker rmi $LOCAL_FRONTEND_IMAGE 2>/dev/null || true
    docker rmi $REGISTRY_API_IMAGE 2>/dev/null || true
    docker rmi $REGISTRY_FRONTEND_IMAGE 2>/dev/null || true
    
    print_color $GREEN "Docker cleanup completed"
}

# Function to build images
build_images() {
    print_header "BUILDING DOCKER IMAGES"
    
    # Build API image
    print_color $CYAN "Building API image..."
    cd backend/TaskManagement.API
    docker build -t $LOCAL_API_IMAGE .
    cd ../..
    print_color $GREEN "API image built successfully: $LOCAL_API_IMAGE"
    
    # Build Frontend image
    print_color $CYAN "Building Frontend image..."
    cd frontend
    docker build -t $LOCAL_FRONTEND_IMAGE .
    cd ..
    print_color $GREEN "Frontend image built successfully: $LOCAL_FRONTEND_IMAGE"
}

# Function to tag images
tag_images() {
    print_header "TAGGING IMAGES FOR REGISTRY"
    
    print_color $CYAN "Tagging API image..."
    docker tag $LOCAL_API_IMAGE $REGISTRY_API_IMAGE
    print_color $GREEN "API image tagged: $REGISTRY_API_IMAGE"
    
    print_color $CYAN "Tagging Frontend image..."
    docker tag $LOCAL_FRONTEND_IMAGE $REGISTRY_FRONTEND_IMAGE
    print_color $GREEN "Frontend image tagged: $REGISTRY_FRONTEND_IMAGE"
}

# Function to push images
push_images() {
    print_header "PUSHING IMAGES TO REGISTRY"
    
    print_color $CYAN "Pushing API image..."
    docker push $REGISTRY_API_IMAGE
    print_color $GREEN "API image pushed successfully"
    
    print_color $CYAN "Pushing Frontend image..."
    docker push $REGISTRY_FRONTEND_IMAGE
    print_color $GREEN "Frontend image pushed successfully"
}

# Function to display summary
display_summary() {
    print_header "BUILD AND PUSH SUMMARY"
    
    print_color $GREEN "✅ Successfully built and pushed images:"
    echo
    print_color $CYAN "API Image:"
    print_color $YELLOW "  Local:    $LOCAL_API_IMAGE"
    print_color $YELLOW "  Registry: $REGISTRY_API_IMAGE"
    echo
    print_color $CYAN "Frontend Image:"
    print_color $YELLOW "  Local:    $LOCAL_FRONTEND_IMAGE"
    print_color $YELLOW "  Registry: $REGISTRY_FRONTEND_IMAGE"
    echo
    print_color $GREEN "Images are now available in the SRE POC registry!"
    echo
    print_color $BLUE "To deploy these images:"
    print_color $CYAN "  kubectl apply -f k8s/"
    echo
}

# Main execution
main() {
    print_header "SRE POC - BUILD AND PUSH DOCKER IMAGES"
    
    print_color $BLUE "Registry: $REGISTRY_URL"
    print_color $BLUE "Project:  $REGISTRY_PROJECT"
    print_color $BLUE "Tag:      $IMAGE_TAG"
    echo
    
    # Prerequisite checks
    check_docker
    check_docker_login
    
    # Main workflow
    cleanup_docker
    build_images
    tag_images
    push_images
    display_summary
    
    print_color $GREEN "🎉 Build and push process completed successfully!"
}

# Handle script interruption
trap 'print_color $RED "Script interrupted"; exit 1' INT TERM

# Run main function
main "$@"
