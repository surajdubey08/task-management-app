#!/bin/bash

# Kubernetes Deployment Validation Script
# Validates all configurations for proper K8s deployment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Logging functions
print_header() {
    echo
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${CYAN}$1${NC}"
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

print_color() {
    echo -e "$1$2${NC}"
}

log_success() {
    print_color $GREEN "✅ $1"
}

log_warning() {
    print_color $YELLOW "⚠️  $1"
}

log_error() {
    print_color $RED "❌ $1"
}

log_info() {
    print_color $BLUE "ℹ️  $1"
}

# Validation functions
validate_k8s_files() {
    print_header "VALIDATING KUBERNETES MANIFESTS"
    
    local required_files=(
        "k8s/namespace.yaml"
        "k8s/configmap.yaml"
        "k8s/nginx-configmap.yaml"
        "k8s/secret.yaml"
        "k8s/api-deployment.yaml"
        "k8s/api-service.yaml"
        "k8s/frontend-deployment.yaml"
        "k8s/frontend-service.yaml"
        "k8s/ingress.yaml"
    )
    
    local missing_files=()
    
    for file in "${required_files[@]}"; do
        if [ -f "$file" ]; then
            log_success "Found: $file"
        else
            log_error "Missing: $file"
            missing_files+=("$file")
        fi
    done
    
    if [ ${#missing_files[@]} -eq 0 ]; then
        log_success "All required Kubernetes manifests found"
    else
        log_error "Missing ${#missing_files[@]} required manifest files"
        return 1
    fi
}

validate_docker_files() {
    print_header "VALIDATING DOCKER CONFIGURATIONS"
    
    local docker_files=(
        "backend/TaskManagement.API/Dockerfile"
        "frontend/Dockerfile"
        "docker-compose.yml"
    )
    
    for file in "${docker_files[@]}"; do
        if [ -f "$file" ]; then
            log_success "Found: $file"
        else
            log_error "Missing: $file"
        fi
    done
}

validate_port_configurations() {
    print_header "VALIDATING PORT CONFIGURATIONS"
    
    # Check backend port configuration
    local backend_program_port=$(grep -o "UseUrls.*8080" backend/TaskManagement.API/Program.cs || echo "")
    if [ -n "$backend_program_port" ]; then
        log_success "Backend Program.cs configured for port 8080"
    else
        log_error "Backend Program.cs port configuration issue"
    fi
    
    # Check Dockerfile port
    local dockerfile_port=$(grep "EXPOSE 8080" backend/TaskManagement.API/Dockerfile || echo "")
    if [ -n "$dockerfile_port" ]; then
        log_success "Backend Dockerfile exposes port 8080"
    else
        log_error "Backend Dockerfile port configuration issue"
    fi
    
    # Check ConfigMap
    local configmap_port=$(grep "ASPNETCORE_URLS.*8080" k8s/configmap.yaml || echo "")
    if [ -n "$configmap_port" ]; then
        log_success "ConfigMap configured for port 8080"
    else
        log_error "ConfigMap port configuration issue"
    fi
}

validate_service_communication() {
    print_header "VALIDATING SERVICE COMMUNICATION"
    
    # Check nginx proxy configuration
    local nginx_proxy=$(grep "taskmanagement-api-service:80" k8s/nginx-configmap.yaml || echo "")
    if [ -n "$nginx_proxy" ]; then
        log_success "Nginx proxy configured for API service"
    else
        log_error "Nginx proxy configuration issue"
    fi
    
    # Check service definitions
    if [ -f "k8s/api-service.yaml" ]; then
        local api_service_port=$(grep "targetPort: 8080" k8s/api-service.yaml || echo "")
        if [ -n "$api_service_port" ]; then
            log_success "API service targetPort correctly configured"
        else
            log_error "API service port mapping issue"
        fi
    fi
}

validate_environment_variables() {
    print_header "VALIDATING ENVIRONMENT VARIABLES"
    
    # Check ConfigMap environment variables
    local required_env_vars=(
        "ASPNETCORE_ENVIRONMENT"
        "ASPNETCORE_URLS"
        "REACT_APP_API_URL"
    )
    
    for env_var in "${required_env_vars[@]}"; do
        if grep -q "$env_var" k8s/configmap.yaml; then
            log_success "Environment variable $env_var found in ConfigMap"
        else
            log_error "Missing environment variable: $env_var"
        fi
    done
}

validate_security_configurations() {
    print_header "VALIDATING SECURITY CONFIGURATIONS"
    
    # Check non-root user configuration
    local api_security=$(grep -A 5 "securityContext:" k8s/api-deployment.yaml | grep "runAsNonRoot: true" || echo "")
    if [ -n "$api_security" ]; then
        log_success "API deployment configured with non-root security context"
    else
        log_warning "API deployment security context may need review"
    fi
    
    local frontend_security=$(grep -A 5 "securityContext:" k8s/frontend-deployment.yaml | grep "runAsNonRoot: true" || echo "")
    if [ -n "$frontend_security" ]; then
        log_success "Frontend deployment configured with non-root security context"
    else
        log_warning "Frontend deployment security context may need review"
    fi
}

validate_resource_limits() {
    print_header "VALIDATING RESOURCE CONFIGURATIONS"
    
    # Check if resource limits are defined
    if grep -q "resources:" k8s/api-deployment.yaml && grep -q "limits:" k8s/api-deployment.yaml; then
        log_success "API deployment has resource limits configured"
    else
        log_warning "API deployment missing resource limits"
    fi
    
    if grep -q "resources:" k8s/frontend-deployment.yaml && grep -q "limits:" k8s/frontend-deployment.yaml; then
        log_success "Frontend deployment has resource limits configured"
    else
        log_warning "Frontend deployment missing resource limits"
    fi
}

validate_health_checks() {
    print_header "VALIDATING HEALTH CHECKS"
    
    # Check liveness and readiness probes
    if grep -q "livenessProbe:" k8s/api-deployment.yaml && grep -q "readinessProbe:" k8s/api-deployment.yaml; then
        log_success "API deployment has health checks configured"
    else
        log_error "API deployment missing health checks"
    fi
    
    if grep -q "livenessProbe:" k8s/frontend-deployment.yaml && grep -q "readinessProbe:" k8s/frontend-deployment.yaml; then
        log_success "Frontend deployment has health checks configured"
    else
        log_error "Frontend deployment missing health checks"
    fi
}

# Main validation function
main() {
    print_header "KUBERNETES DEPLOYMENT VALIDATION"
    print_color $BLUE "🔍 Validating TaskFlow application for Kubernetes deployment..."
    
    local validation_failed=false
    
    # Run all validations
    validate_k8s_files || validation_failed=true
    validate_docker_files || validation_failed=true
    validate_port_configurations || validation_failed=true
    validate_service_communication || validation_failed=true
    validate_environment_variables || validation_failed=true
    validate_security_configurations || validation_failed=true
    validate_resource_limits || validation_failed=true
    validate_health_checks || validation_failed=true
    
    # Final result
    print_header "VALIDATION SUMMARY"
    
    if [ "$validation_failed" = true ]; then
        log_error "Validation completed with issues. Please fix the errors above before deploying."
        exit 1
    else
        log_success "All validations passed! Application is ready for Kubernetes deployment."
        print_color $GREEN "🚀 You can now deploy using: ./scripts/k8s-deploy.sh deploy"
    fi
}

# Run main function
main "$@"
