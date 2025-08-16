#!/bin/bash

# Database Manager Script
# Manages database operations for the task management application via API

set -e

# Configuration
API_URL="${API_URL:-http://localhost:5000}"
SAMPLE_DATA_FILE="${SAMPLE_DATA_FILE:-scripts/sample-data.json}"
DB_FILE="${DB_FILE:-backend/TaskManagement.API/taskmanagement.db}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
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

# Check if required tools are available
check_prerequisites() {
    local missing_tools=()

    if ! command -v curl &> /dev/null; then
        missing_tools+=("curl")
    fi

    if ! command -v jq &> /dev/null; then
        missing_tools+=("jq")
    fi

    if [ ${#missing_tools[@]} -gt 0 ]; then
        log_error "Missing required tools: ${missing_tools[*]}"
        log_info "Please install the missing tools:"
        log_info "  Ubuntu/Debian: sudo apt install ${missing_tools[*]}"
        log_info "  macOS: brew install ${missing_tools[*]}"
        exit 1
    fi

    log_success "Prerequisites available (curl, jq)"
}

# Check if API is running
check_api() {
    if curl -s -f "$API_URL/health" > /dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

# Wait for API to be ready
wait_for_api() {
    local max_attempts=30
    local attempt=0

    log_info "Waiting for API to be ready at $API_URL..."

    while [ $attempt -lt $max_attempts ]; do
        if check_api; then
            log_success "API is ready"
            return 0
        fi

        sleep 2
        attempt=$((attempt + 1))
        echo -n "."
    done

    echo ""
    log_error "API is not ready after $max_attempts attempts"
    return 1
}

# Start the .NET application
start_api() {
    if check_api; then
        log_success "API is already running"
        return 0
    fi

    log_info "Starting .NET application..."

    if [ ! -d "backend/TaskManagement.API" ]; then
        log_error "Backend directory not found. Please run this script from the project root."
        exit 1
    fi

    cd backend/TaskManagement.API

    # Start the application in background
    nohup dotnet run > /dev/null 2>&1 &
    local api_pid=$!

    cd - > /dev/null

    # Wait for API to be ready
    if wait_for_api; then
        log_success "API started successfully (PID: $api_pid)"
        return 0
    else
        log_error "Failed to start API"
        kill $api_pid 2>/dev/null || true
        exit 1
    fi
}

# Check if database file exists
database_exists() {
    [ -f "$DB_FILE" ]
}

# Make API call
api_call() {
    local method="$1"
    local endpoint="$2"
    local data="$3"

    local response
    local http_code

    if [ -n "$data" ]; then
        response=$(curl -s -w "\n%{http_code}" -X "$method" \
                       -H "Content-Type: application/json" \
                       -d "$data" \
                       "$API_URL$endpoint")
    else
        response=$(curl -s -w "\n%{http_code}" -X "$method" "$API_URL$endpoint")
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

# Delete all records via API
clear_data() {
    log_info "Clearing all data via API..."

    if ! check_api; then
        log_error "API is not accessible"
        exit 1
    fi

    # Delete tasks first (due to foreign key constraints)
    log_info "Deleting tasks..."
    local tasks=$(get_all_records "/api/tasks")
    if [ $? -eq 0 ] && [ -n "$tasks" ]; then
        local task_count=$(echo "$tasks" | jq '. | length' 2>/dev/null || echo "0")

        if [ "$task_count" -gt 0 ]; then
            echo "$tasks" | jq -r '.[].id' | while read -r task_id; do
                if ! api_call "DELETE" "/api/tasks/$task_id" > /dev/null; then
                    log_warning "Failed to delete task $task_id"
                fi
            done
            log_success "Deleted $task_count tasks"
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
            echo "$categories" | jq -r '.[].id' | while read -r category_id; do
                if ! api_call "DELETE" "/api/categories/$category_id" > /dev/null; then
                    log_warning "Failed to delete category $category_id"
                fi
            done
            log_success "Deleted $category_count categories"
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
            echo "$users" | jq -r '.[].id' | while read -r user_id; do
                if ! api_call "DELETE" "/api/users/$user_id" > /dev/null; then
                    log_warning "Failed to delete user $user_id"
                fi
            done
            log_success "Deleted $user_count users"
        else
            log_info "No users to delete"
        fi
    else
        log_info "No users found or failed to fetch users"
    fi

    log_success "All data cleared"
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

# Populate database with sample data via API
populate_data() {
    log_info "Populating database with sample data via API..."

    if ! check_api; then
        log_error "API is not accessible"
        exit 1
    fi

    load_json_data

    # Clear existing data first
    clear_data

    # Create users from JSON
    log_info "Creating users..."
    local user_count=$(jq '.users | length' "$SAMPLE_DATA_FILE")
    local created_users=()

    for ((i=0; i<user_count; i++)); do
        local name=$(jq -r ".users[$i].name" "$SAMPLE_DATA_FILE")
        local email=$(jq -r ".users[$i].email" "$SAMPLE_DATA_FILE")
        local phone=$(jq -r ".users[$i].phone" "$SAMPLE_DATA_FILE")
        local department=$(jq -r ".users[$i].department" "$SAMPLE_DATA_FILE")

        # Handle null values
        if [ "$phone" = "null" ]; then phone=""; fi
        if [ "$department" = "null" ]; then department=""; fi

        # Create user JSON payload
        local user_data=$(jq -n \
            --arg name "$name" \
            --arg email "$email" \
            --arg phoneNumber "$phone" \
            --arg department "$department" \
            '{
                name: $name,
                email: $email,
                phoneNumber: $phoneNumber,
                department: $department
            }')

        local response=$(api_call "POST" "/api/users" "$user_data")
        if [ $? -eq 0 ]; then
            local user_id=$(echo "$response" | jq -r '.id' 2>/dev/null)
            if [ "$user_id" != "null" ] && [ -n "$user_id" ]; then
                created_users+=("$user_id")
                log_info "Created user: $name (ID: $user_id)"
            else
                log_error "Failed to get user ID for: $name"
                exit 1
            fi
        else
            log_error "Failed to create user: $name"
            exit 1
        fi
    done
    log_success "Created $user_count users"

    # Create categories from JSON
    log_info "Creating categories..."
    local category_count=$(jq '.categories | length' "$SAMPLE_DATA_FILE")
    local created_categories=()

    for ((i=0; i<category_count; i++)); do
        local name=$(jq -r ".categories[$i].name" "$SAMPLE_DATA_FILE")
        local color=$(jq -r ".categories[$i].color" "$SAMPLE_DATA_FILE")
        local description=$(jq -r ".categories[$i].description" "$SAMPLE_DATA_FILE")

        # Handle null values
        if [ "$description" = "null" ]; then description=""; fi

        # Create category JSON payload
        local category_data=$(jq -n \
            --arg name "$name" \
            --arg color "$color" \
            --arg description "$description" \
            '{
                name: $name,
                color: $color,
                description: $description,
                isActive: true
            }')

        local response=$(api_call "POST" "/api/categories" "$category_data")
        if [ $? -eq 0 ]; then
            local category_id=$(echo "$response" | jq -r '.id' 2>/dev/null)
            if [ "$category_id" != "null" ] && [ -n "$category_id" ]; then
                created_categories+=("$category_id")
                log_info "Created category: $name (ID: $category_id)"
            else
                log_error "Failed to get category ID for: $name"
                exit 1
            fi
        else
            log_error "Failed to create category: $name"
            exit 1
        fi
    done
    log_success "Created $category_count categories"

    # Create tasks from JSON
    log_info "Creating tasks..."
    local task_count=$(jq '.tasks | length' "$SAMPLE_DATA_FILE")

    for ((i=0; i<task_count; i++)); do
        local title=$(jq -r ".tasks[$i].title" "$SAMPLE_DATA_FILE")
        local description=$(jq -r ".tasks[$i].description" "$SAMPLE_DATA_FILE")
        local status=$(jq -r ".tasks[$i].status" "$SAMPLE_DATA_FILE")
        local priority=$(jq -r ".tasks[$i].priority" "$SAMPLE_DATA_FILE")
        local due_date=$(jq -r ".tasks[$i].dueDate" "$SAMPLE_DATA_FILE")
        local user_index=$(jq -r ".tasks[$i].userIndex" "$SAMPLE_DATA_FILE")
        local category_index=$(jq -r ".tasks[$i].categoryIndex" "$SAMPLE_DATA_FILE")

        # Get actual IDs from created arrays
        local user_id="${created_users[$user_index]}"
        local category_id="${created_categories[$category_index]}"

        # Handle null values
        if [ "$description" = "null" ]; then description=""; fi
        if [ "$due_date" = "null" ]; then due_date=""; fi

        # Create task JSON payload
        local task_data
        if [ -n "$due_date" ] && [ "$due_date" != "null" ]; then
            task_data=$(jq -n \
                --arg title "$title" \
                --arg description "$description" \
                --arg status "$status" \
                --arg priority "$priority" \
                --arg dueDate "$due_date" \
                --arg userId "$user_id" \
                --arg categoryId "$category_id" \
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
            task_data=$(jq -n \
                --arg title "$title" \
                --arg description "$description" \
                --arg status "$status" \
                --arg priority "$priority" \
                --arg userId "$user_id" \
                --arg categoryId "$category_id" \
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
            local task_id=$(echo "$response" | jq -r '.id' 2>/dev/null)
            if [ "$task_id" != "null" ] && [ -n "$task_id" ]; then
                log_info "Created task: $title (ID: $task_id)"
            else
                log_error "Failed to get task ID for: $title"
                exit 1
            fi
        else
            log_error "Failed to create task: $title"
            exit 1
        fi
    done
    log_success "Created $task_count tasks"

    log_success "Sample data populated successfully"
}

# Show usage information
show_usage() {
    echo "Usage: $0 [OPTIONS] COMMAND"
    echo ""
    echo "Commands:"
    echo "  start     - Start the .NET API application"
    echo "  status    - Show database and API status"
    echo "  populate  - Populate database with sample data via API"
    echo "  clear     - Clear all data via API"
    echo "  remove    - Remove database file"
    echo ""
    echo "Options:"
    echo "  --force   - Skip confirmation prompts"
    echo "  --help    - Show this help message"
    echo ""
    echo "Environment Variables:"
    echo "  API_URL           - API base URL (default: http://localhost:5000)"
    echo "  DB_FILE           - SQLite database file path (default: backend/TaskManagement.API/taskmanagement.db)"
    echo "  SAMPLE_DATA_FILE  - Sample data JSON file path (default: scripts/sample-data.json)"
    echo ""
    echo "Examples:"
    echo "  $0 start                    # Start the API application"
    echo "  $0 status                   # Check system status"
    echo "  $0 populate                 # Load sample data"
    echo "  $0 clear --force            # Clear all data without confirmation"
}

# Show database and API status
show_status() {
    log_info "Task Management System Status"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "  API URL: $API_URL"
    echo "  Database File: $DB_FILE"
    echo "  Sample Data File: $SAMPLE_DATA_FILE"
    echo ""

    # Check API status
    if check_api; then
        log_success "✓ API is running and accessible"

        # Get record counts via API
        log_info "Fetching data counts..."

        local users=$(get_all_records "/api/users" 2>/dev/null)
        local user_count=0
        if [ $? -eq 0 ] && [ -n "$users" ]; then
            user_count=$(echo "$users" | jq '. | length' 2>/dev/null || echo "0")
        fi

        local categories=$(get_all_records "/api/categories" 2>/dev/null)
        local category_count=0
        if [ $? -eq 0 ] && [ -n "$categories" ]; then
            category_count=$(echo "$categories" | jq '. | length' 2>/dev/null || echo "0")
        fi

        local tasks=$(get_all_records "/api/tasks" 2>/dev/null)
        local task_count=0
        if [ $? -eq 0 ] && [ -n "$tasks" ]; then
            task_count=$(echo "$tasks" | jq '. | length' 2>/dev/null || echo "0")
        fi

        echo "  📊 Data Summary:"
        echo "     Users: $user_count"
        echo "     Categories: $category_count"
        echo "     Tasks: $task_count"

        # Show database file info
        if [ -f "$DB_FILE" ]; then
            local file_size=$(du -h "$DB_FILE" 2>/dev/null | cut -f1 || echo "unknown")
            echo "     Database Size: $file_size"
            log_success "✓ Database file exists"
        else
            log_warning "⚠ Database file does not exist: $DB_FILE"
        fi
    else
        log_warning "✗ API is not accessible at $API_URL"

        if [ -f "$DB_FILE" ]; then
            local file_size=$(du -h "$DB_FILE" 2>/dev/null | cut -f1 || echo "unknown")
            echo "  Database Size: $file_size"
            log_info "Database file exists but API is not running"
        else
            log_warning "Database file does not exist: $DB_FILE"
        fi

        echo ""
        log_info "To start the API:"
        echo "  $0 start"
        echo "  or manually: cd backend/TaskManagement.API && dotnet run"
    fi
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
}

# Remove database file
remove_database() {
    if database_exists; then
        log_info "Removing database file: $DB_FILE"
        rm -f "$DB_FILE"
        log_success "Database file removed"
    else
        log_warning "Database file does not exist: $DB_FILE"
    fi
}

# Parse command line arguments
FORCE=false
COMMAND=""

while [[ $# -gt 0 ]]; do
    case $1 in
        --force)
            FORCE=true
            shift
            ;;
        --help|-h)
            show_usage
            exit 0
            ;;
        start|status|populate|clear|remove)
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

# Execute command
case $COMMAND in
    start)
        start_api
        ;;
    status)
        show_status
        ;;
    populate)
        if ! check_api; then
            log_info "API is not running. Starting API first..."
            start_api
        fi
        populate_data
        ;;
    clear)
        if ! check_api; then
            log_error "API is not running. Please start the API first with: $0 start"
            exit 1
        fi

        if [ "$FORCE" = false ]; then
            echo ""
            log_warning "This will permanently delete ALL data from the database!"
            echo -n "Are you sure you want to continue? (y/N): "
            read -r response
            if [[ ! "$response" =~ ^[Yy]$ ]]; then
                log_info "Operation cancelled"
                exit 0
            fi
        fi
        clear_data
        ;;
    remove)
        if [ "$FORCE" = false ]; then
            echo ""
            log_warning "This will permanently delete the database file!"
            echo -n "Are you sure you want to continue? (y/N): "
            read -r response
            if [[ ! "$response" =~ ^[Yy]$ ]]; then
                log_info "Operation cancelled"
                exit 0
            fi
        fi
        remove_database
        ;;
esac

log_success "✅ Operation completed successfully"