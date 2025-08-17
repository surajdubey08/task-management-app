#!/bin/bash

# Kubernetes Database Manager Script
# Manages database operations for TaskFlow application running in Kubernetes

set -e

# Configuration
NAMESPACE="${NAMESPACE:-taskmanagement}"
SERVICE_NAME="${SERVICE_NAME:-taskmanagement-api-service}"
SERVICE_PORT="${SERVICE_PORT:-80}"
SAMPLE_DATA_FILE="${SAMPLE_DATA_FILE:-scripts/sample-data.json}"
KUBECTL_TIMEOUT="${KUBECTL_TIMEOUT:-60s}"
KUBECONFIG_FILE="${KUBECONFIG_FILE:-}"

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

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to setup kubeconfig
setup_kubeconfig() {
    if [ -n "$KUBECONFIG_FILE" ]; then
        if [ ! -f "$KUBECONFIG_FILE" ]; then
            log_error "Kubeconfig file not found: $KUBECONFIG_FILE"
            exit 1
        fi
        export KUBECONFIG="$KUBECONFIG_FILE"
        log_success "Using kubeconfig: $KUBECONFIG_FILE"
    elif [ -n "$KUBECONFIG" ]; then
        log_success "Using KUBECONFIG environment variable: $KUBECONFIG"
    else
        log_error "No kubeconfig specified"
        log_info "Either set KUBECONFIG environment variable or use --kubeconfig parameter"
        exit 1
    fi
}

# Check if required tools are available
check_prerequisites() {
    local missing_tools=()

    if ! command -v kubectl &> /dev/null; then
        missing_tools+=("kubectl")
    fi

    if ! command -v curl &> /dev/null; then
        missing_tools+=("curl")
    fi

    if ! command -v jq &> /dev/null; then
        missing_tools+=("jq")
    fi

    if [ ${#missing_tools[@]} -gt 0 ]; then
        log_error "Missing required tools: ${missing_tools[*]}"
        log_info "Please install the missing tools:"
        log_info "  kubectl: https://kubernetes.io/docs/tasks/tools/"
        log_info "  curl: sudo apt install curl (Linux) or brew install curl (macOS)"
        log_info "  jq: sudo apt install jq (Linux) or brew install jq (macOS)"
        exit 1
    fi

    log_success "Prerequisites available (kubectl, curl, jq)"

    # Setup kubeconfig
    setup_kubeconfig
}

# Check if namespace exists
check_namespace() {
    if ! kubectl get namespace "$NAMESPACE" &> /dev/null; then
        log_error "Namespace '$NAMESPACE' does not exist"
        log_info "Please deploy the application first: ./scripts/k8s-deploy.sh deploy"
        exit 1
    fi
}

# Check if API service is running
check_api_service() {
    if ! kubectl get service "$SERVICE_NAME" -n "$NAMESPACE" &> /dev/null; then
        log_error "API service '$SERVICE_NAME' not found in namespace '$NAMESPACE'"
        log_info "Please deploy the application first: ./scripts/k8s-deploy.sh deploy"
        exit 1
    fi

    # Check if pods are ready
    local ready_pods=$(kubectl get pods -n "$NAMESPACE" -l app=taskmanagement-api --field-selector=status.phase=Running -o jsonpath='{.items[*].status.containerStatuses[0].ready}' | grep -o true | wc -l)
    
    if [ "$ready_pods" -eq 0 ]; then
        log_error "No API pods are ready in namespace '$NAMESPACE'"
        log_info "Check pod status: kubectl get pods -n $NAMESPACE"
        exit 1
    fi

    log_success "API service is running with $ready_pods ready pod(s)"
}

# Setup port forwarding to API service
setup_port_forward() {
    local local_port="${LOCAL_PORT:-8080}"
    
    # Kill any existing port-forward on this port
    pkill -f "kubectl.*port-forward.*$local_port" 2>/dev/null || true
    
    log_info "Setting up port forwarding to API service..."
    kubectl port-forward "service/$SERVICE_NAME" "$local_port:$SERVICE_PORT" -n "$NAMESPACE" &
    local pf_pid=$!
    
    # Wait for port forward to be ready
    sleep 5

    # Test if port forward is working by checking health endpoint
    local max_attempts=10
    local attempt=1

    while [ $attempt -le $max_attempts ]; do
        if curl -s -f "http://localhost:$local_port/health" > /dev/null 2>&1; then
            log_success "Port forwarding established on localhost:$local_port"
            echo "$pf_pid" > /tmp/k8s-db-manager-pf.pid
            return 0
        fi

        log_info "Waiting for port forwarding (attempt $attempt/$max_attempts)..."
        sleep 2
        attempt=$((attempt + 1))
    done

    log_error "Failed to establish port forwarding after $max_attempts attempts"
    kill $pf_pid 2>/dev/null || true
    exit 1
}

# Cleanup port forwarding
cleanup_port_forward() {
    if [ -f /tmp/k8s-db-manager-pf.pid ]; then
        local pf_pid=$(cat /tmp/k8s-db-manager-pf.pid)
        kill $pf_pid 2>/dev/null || true
        rm -f /tmp/k8s-db-manager-pf.pid
        log_info "Port forwarding cleaned up"
    fi
}

# Trap to cleanup on exit
trap cleanup_port_forward EXIT

# Make API call through port forward
api_call() {
    local method="$1"
    local endpoint="$2"
    local data="$3"
    local local_port="${LOCAL_PORT:-8080}"
    local api_url="http://localhost:$local_port"

    local response
    local http_code

    if [ -n "$data" ]; then
        response=$(curl -s -w "\n%{http_code}" -X "$method" \
                       -H "Content-Type: application/json" \
                       -d "$data" \
                       "$api_url$endpoint")
    else
        response=$(curl -s -w "\n%{http_code}" -X "$method" "$api_url$endpoint")
    fi

    http_code=$(echo "$response" | tail -n1)
    response_body=$(echo "$response" | sed '$d')

    if [[ "$http_code" -ge 200 && "$http_code" -lt 300 ]]; then
        echo "$response_body"
        return 0
    else
        log_error "API call failed: $method $endpoint (HTTP $http_code)"
        if [ -n "$response_body" ]; then
            log_error "Response: $response_body"
        fi
        return 1
    fi
}

# Get all records from an endpoint
get_all_records() {
    local endpoint="$1"
    api_call "GET" "$endpoint"
}

# Load and validate JSON data
load_json_data() {
    if [ ! -f "$SAMPLE_DATA_FILE" ]; then
        log_error "Sample data file not found: $SAMPLE_DATA_FILE"
        exit 1
    fi

    # Validate JSON format
    if ! jq empty "$SAMPLE_DATA_FILE" 2>/dev/null; then
        log_error "Invalid JSON format in: $SAMPLE_DATA_FILE"
        exit 1
    fi

    log_success "Sample data file validated: $SAMPLE_DATA_FILE"
}

# Clear all data via API
clear_data() {
    log_info "Clearing all data via API..."

    # Delete tasks first (due to foreign key constraints)
    log_info "Deleting tasks..."
    local tasks=$(get_all_records "/api/tasks")
    if [ $? -eq 0 ] && [ -n "$tasks" ]; then
        local task_count=$(echo "$tasks" | jq '. | length' 2>/dev/null || echo "0")

        if [ "$task_count" -gt 0 ]; then
            local task_ids=$(echo "$tasks" | jq -r '.[].id')
            local deleted_count=0
            
            for task_id in $task_ids; do
                if api_call "DELETE" "/api/tasks/$task_id" > /dev/null; then
                    deleted_count=$((deleted_count + 1))
                else
                    log_warning "Failed to delete task $task_id"
                fi
            done
            log_success "Deleted $deleted_count tasks"
        else
            log_info "No tasks to delete"
        fi
    else
        log_info "No tasks found or failed to fetch tasks"
    fi

    # Delete categories
    log_info "Deleting categories..."
    local categories=$(get_all_records "/api/categories")
    if [ $? -eq 0 ] && [ -n "$categories" ]; then
        local category_count=$(echo "$categories" | jq '. | length' 2>/dev/null || echo "0")

        if [ "$category_count" -gt 0 ]; then
            local category_ids=$(echo "$categories" | jq -r '.[].id')
            local deleted_count=0
            
            for category_id in $category_ids; do
                if api_call "DELETE" "/api/categories/$category_id" > /dev/null; then
                    deleted_count=$((deleted_count + 1))
                else
                    log_warning "Failed to delete category $category_id"
                fi
            done
            log_success "Deleted $deleted_count categories"
        else
            log_info "No categories to delete"
        fi
    else
        log_info "No categories found or failed to fetch categories"
    fi

    # Delete users
    log_info "Deleting users..."
    local users=$(get_all_records "/api/users")
    if [ $? -eq 0 ] && [ -n "$users" ]; then
        local user_count=$(echo "$users" | jq '. | length' 2>/dev/null || echo "0")

        if [ "$user_count" -gt 0 ]; then
            local user_ids=$(echo "$users" | jq -r '.[].id')
            local deleted_count=0
            
            for user_id in $user_ids; do
                if api_call "DELETE" "/api/users/$user_id" > /dev/null; then
                    deleted_count=$((deleted_count + 1))
                else
                    log_warning "Failed to delete user $user_id"
                fi
            done
            log_success "Deleted $deleted_count users"
        else
            log_info "No users to delete"
        fi
    else
        log_info "No users found or failed to fetch users"
    fi

    log_success "All data cleared"
}

# Populate database with sample data via API
populate_data() {
    log_info "Populating database with sample data via API..."

    load_json_data

    # Clear existing data first
    clear_data

    # Create users from JSON
    log_info "Creating users..."
    local user_count=$(jq '.users | length' "$SAMPLE_DATA_FILE")
    local created_users=()

    for i in $(seq 0 $((user_count - 1))); do
        local user_data=$(jq -r ".users[$i] | {name, email, phoneNumber: .phone, department}" "$SAMPLE_DATA_FILE")

        local response=$(api_call "POST" "/api/users" "$user_data")
        if [ $? -eq 0 ]; then
            local user_id=$(echo "$response" | jq -r '.id')
            local user_name=$(echo "$response" | jq -r '.name')
            created_users+=("$user_id")
            log_info "Created user: $user_name (ID: $user_id)"
        else
            log_error "Failed to create user $i"
        fi
    done

    log_success "Created ${#created_users[@]} users"

    # Create categories from JSON
    log_info "Creating categories..."
    local category_count=$(jq '.categories | length' "$SAMPLE_DATA_FILE")
    local created_categories=()

    for i in $(seq 0 $((category_count - 1))); do
        local category_data=$(jq -r ".categories[$i]" "$SAMPLE_DATA_FILE")

        local response=$(api_call "POST" "/api/categories" "$category_data")
        if [ $? -eq 0 ]; then
            local category_id=$(echo "$response" | jq -r '.id')
            local category_name=$(echo "$response" | jq -r '.name')
            created_categories+=("$category_id")
            log_info "Created category: $category_name (ID: $category_id)"
        else
            log_error "Failed to create category $i"
        fi
    done

    log_success "Created ${#created_categories[@]} categories"

    # Create tasks from JSON
    log_info "Creating tasks..."
    local task_count=$(jq '.tasks | length' "$SAMPLE_DATA_FILE")
    local created_tasks=()

    for i in $(seq 0 $((task_count - 1))); do
        local task=$(jq -r ".tasks[$i]" "$SAMPLE_DATA_FILE")
        local user_index=$(echo "$task" | jq -r '.userIndex')
        local category_index=$(echo "$task" | jq -r '.categoryIndex')

        # Map indices to actual IDs
        local user_id=${created_users[$user_index]}
        local category_id=${created_categories[$category_index]}

        if [ -n "$user_id" ] && [ -n "$category_id" ]; then
            local task_data=$(echo "$task" | jq -r \
                --arg userId "$user_id" \
                --arg categoryId "$category_id" \
                --arg title "$(echo "$task" | jq -r '.title')" \
                --arg description "$(echo "$task" | jq -r '.description')" \
                --arg status "$(echo "$task" | jq -r '.status')" \
                --arg priority "$(echo "$task" | jq -r '.priority')" \
                --arg dueDate "$(echo "$task" | jq -r '.dueDate')" \
                '{
                    title: $title,
                    description: $description,
                    status: ($status | tonumber),
                    priority: ($priority | tonumber),
                    dueDate: $dueDate,
                    userId: ($userId | tonumber),
                    categoryId: ($categoryId | tonumber)
                }')
        else
            local task_data=$(echo "$task" | jq -r \
                --arg title "$(echo "$task" | jq -r '.title')" \
                --arg description "$(echo "$task" | jq -r '.description')" \
                --arg status "$(echo "$task" | jq -r '.status')" \
                --arg priority "$(echo "$task" | jq -r '.priority')" \
                '{
                    title: $title,
                    description: $description,
                    status: ($status | tonumber),
                    priority: ($priority | tonumber),
                    userId: ($userId | tonumber),
                    categoryId: ($categoryId | tonumber)
                }')
        fi

        local response=$(api_call "POST" "/api/tasks" "$task_data")
        if [ $? -eq 0 ]; then
            local task_id=$(echo "$response" | jq -r '.id')
            local task_title=$(echo "$response" | jq -r '.title')
            created_tasks+=("$task_id")
            log_info "Created task: $task_title (ID: $task_id)"
        else
            log_error "Failed to create task $i"
        fi
    done

    log_success "Created ${#created_tasks[@]} tasks"
    log_success "Sample data populated successfully"
}

# Show status of the application
show_status() {
    print_header "KUBERNETES TASKFLOW STATUS"

    log_info "Namespace: $NAMESPACE"
    log_info "Service: $SERVICE_NAME"
    log_info "Sample Data File: $SAMPLE_DATA_FILE"
    echo

    # Check namespace
    if kubectl get namespace "$NAMESPACE" &> /dev/null; then
        log_success "✓ Namespace '$NAMESPACE' exists"
    else
        log_error "✗ Namespace '$NAMESPACE' does not exist"
        return 1
    fi

    # Check API service
    if kubectl get service "$SERVICE_NAME" -n "$NAMESPACE" &> /dev/null; then
        log_success "✓ API service '$SERVICE_NAME' exists"

        # Get service details
        local service_type=$(kubectl get service "$SERVICE_NAME" -n "$NAMESPACE" -o jsonpath='{.spec.type}')
        local service_port=$(kubectl get service "$SERVICE_NAME" -n "$NAMESPACE" -o jsonpath='{.spec.ports[0].port}')
        echo "     Service Type: $service_type"
        echo "     Service Port: $service_port"
    else
        log_error "✗ API service '$SERVICE_NAME' not found"
        return 1
    fi

    # Check API pods
    local api_pods=$(kubectl get pods -n "$NAMESPACE" -l app=taskmanagement-api --no-headers 2>/dev/null | wc -l)
    local ready_pods=$(kubectl get pods -n "$NAMESPACE" -l app=taskmanagement-api --field-selector=status.phase=Running -o jsonpath='{.items[*].status.containerStatuses[0].ready}' 2>/dev/null | grep -o true | wc -l)

    if [ "$api_pods" -gt 0 ]; then
        log_success "✓ Found $api_pods API pod(s), $ready_pods ready"
    else
        log_error "✗ No API pods found"
        return 1
    fi

    # Try to get data counts via port forward
    setup_port_forward

    log_info "Fetching data counts..."
    local users_count=$(get_all_records "/api/users" 2>/dev/null | jq '. | length' 2>/dev/null || echo "0")
    local categories_count=$(get_all_records "/api/categories" 2>/dev/null | jq '. | length' 2>/dev/null || echo "0")
    local tasks_count=$(get_all_records "/api/tasks" 2>/dev/null | jq '. | length' 2>/dev/null || echo "0")

    echo "  📊 Data Summary:"
    printf "     Users: %-8s\n" "$users_count"
    printf "     Categories: %-8s\n" "$categories_count"
    printf "     Tasks: %-8s\n" "$tasks_count"

    cleanup_port_forward

    echo
    log_success "✅ Application is running and accessible"
}

# Show usage information
show_usage() {
    echo "Usage: $0 [OPTIONS] COMMAND"
    echo ""
    echo "Commands:"
    echo "  status         - Show Kubernetes deployment and data status"
    echo "  populate       - Populate database with sample data via API"
    echo "  clear          - Clear all data via API"
    echo "  reset-populate - Clear all data and populate with sample data"
    echo ""
    echo "Options:"
    echo "  --namespace NAME    - Kubernetes namespace (default: taskmanagement)"
    echo "  --service NAME      - API service name (default: taskmanagement-api-service)"
    echo "  --port PORT         - Local port for port forwarding (default: 8080)"
    echo "  --kubeconfig FILE   - Path to kubeconfig file"
    echo "  --force             - Skip confirmation prompts"
    echo "  --help              - Show this help message"
    echo ""
    echo "Environment Variables:"
    echo "  NAMESPACE           - Kubernetes namespace (default: taskmanagement)"
    echo "  SERVICE_NAME        - API service name (default: taskmanagement-api-service)"
    echo "  SERVICE_PORT        - Service port (default: 80)"
    echo "  LOCAL_PORT          - Local port for port forwarding (default: 8080)"
    echo "  SAMPLE_DATA_FILE    - Sample data JSON file (default: scripts/sample-data.json)"
    echo ""
    echo "Examples:"
    echo "  $0 status"
    echo "  $0 populate"
    echo "  $0 --namespace production --service api-service populate"
    echo "  $0 --force clear"
}

# Parse command line arguments
FORCE=false
COMMAND=""

while [[ $# -gt 0 ]]; do
    case $1 in
        --namespace)
            NAMESPACE="$2"
            shift 2
            ;;
        --service)
            SERVICE_NAME="$2"
            shift 2
            ;;
        --port)
            LOCAL_PORT="$2"
            shift 2
            ;;
        --kubeconfig)
            KUBECONFIG_FILE="$2"
            shift 2
            ;;
        --force)
            FORCE=true
            shift
            ;;
        --help|-h)
            show_usage
            exit 0
            ;;
        status|populate|clear|reset-populate)
            COMMAND="$1"
            shift
            ;;
        *)
            log_error "Unknown option: $1"
            show_usage
            exit 1
            ;;
    esac
done

# Check if command is provided
if [ -z "$COMMAND" ]; then
    log_error "No command specified"
    show_usage
    exit 1
fi

# Check prerequisites
check_prerequisites

# Check namespace and service
check_namespace
check_api_service

# Execute command
case $COMMAND in
    status)
        show_status
        ;;
    populate)
        if [ "$FORCE" = false ]; then
            echo
            log_warning "This will clear all existing data and populate with sample data!"
            read -p "Are you sure you want to continue? (y/N): " -n 1 -r
            echo
            if [[ ! $REPLY =~ ^[Yy]$ ]]; then
                log_info "Operation cancelled"
                exit 0
            fi
        fi
        setup_port_forward
        populate_data
        ;;
    clear)
        if [ "$FORCE" = false ]; then
            echo
            log_warning "This will permanently delete ALL data from the database!"
            read -p "Are you sure you want to continue? (y/N): " -n 1 -r
            echo
            if [[ ! $REPLY =~ ^[Yy]$ ]]; then
                log_info "Operation cancelled"
                exit 0
            fi
        fi
        setup_port_forward
        clear_data
        ;;
    reset-populate)
        if [ "$FORCE" = false ]; then
            echo
            log_warning "This will clear all existing data and populate with sample data!"
            read -p "Are you sure you want to continue? (y/N): " -n 1 -r
            echo
            if [[ ! $REPLY =~ ^[Yy]$ ]]; then
                log_info "Operation cancelled"
                exit 0
            fi
        fi
        setup_port_forward
        clear_data
        populate_data
        ;;
    *)
        log_error "Unknown command: $COMMAND"
        show_usage
        exit 1
        ;;
esac

log_success "✅ Operation completed successfully"
