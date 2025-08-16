#!/bin/bash

# TaskFlow Database Management Script
# Comprehensive script for managing TaskFlow database operations
# Supports reset, populate, backup, and restore operations

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
API_BASE_URL="http://localhost:5000/api"
ACTION=""
POPULATE_DATA=false
BACKUP_FILE=""
RESTORE_FILE=""
FORCE=false

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
TaskFlow Database Management Script

USAGE:
    $0 [OPTIONS] ACTION

ACTIONS:
    reset               Reset database (clear all data)
    populate            Populate database with sample data
    reset-populate      Reset and populate database
    backup              Backup database to file
    restore             Restore database from file
    status              Show database status and statistics

OPTIONS:
    --api-url URL       API base URL (default: http://localhost:5000/api)
    --backup-file FILE  Backup file path for backup/restore operations
    --force             Force operation without confirmation
    --help              Show this help message

EXAMPLES:
    # Reset database only
    $0 reset

    # Reset and populate with sample data
    $0 reset-populate

    # Populate existing database
    $0 populate

    # Backup database
    $0 --backup-file backup.json backup

    # Restore database
    $0 --backup-file backup.json restore

    # Check database status
    $0 status

    # Force reset without confirmation
    $0 --force reset

PREREQUISITES:
    - TaskFlow API must be running
    - curl command available
    - jq command available (for JSON processing)

EOF
}

# Function to check prerequisites
check_prerequisites() {
    print_header "CHECKING PREREQUISITES"
    
    # Check curl
    if ! command -v curl &> /dev/null; then
        print_color $RED "❌ curl is not installed or not in PATH"
        exit 1
    fi
    print_color $GREEN "✅ curl found"
    
    # Check jq
    if ! command -v jq &> /dev/null; then
        print_color $YELLOW "⚠️ jq not found - JSON processing will be limited"
        print_color $YELLOW "💡 Install jq for better JSON handling: apt-get install jq"
    else
        print_color $GREEN "✅ jq found"
    fi
    
    # Check API connectivity
    print_color $BLUE "🔍 Checking API connectivity..."
    if curl -s -f "$API_BASE_URL/../health" > /dev/null; then
        print_color $GREEN "✅ API is accessible at $API_BASE_URL"
    else
        print_color $RED "❌ Cannot connect to API at $API_BASE_URL"
        print_color $YELLOW "💡 Make sure TaskFlow backend is running"
        exit 1
    fi
}

# Function to make API calls
api_call() {
    local method=$1
    local endpoint=$2
    local data=$3
    local suppress_errors=${4:-false}
    
    local curl_args="-s"
    if [ "$suppress_errors" = false ]; then
        curl_args="$curl_args -f"
    fi
    
    if [ -n "$data" ]; then
        curl $curl_args -X "$method" \
             -H "Content-Type: application/json" \
             -d "$data" \
             "$API_BASE_URL/$endpoint"
    else
        curl $curl_args -X "$method" "$API_BASE_URL/$endpoint"
    fi
}

# Function to get database statistics
get_database_stats() {
    local tasks_response=$(api_call "GET" "tasks" "" true)
    local users_response=$(api_call "GET" "users" "" true)
    local categories_response=$(api_call "GET" "categories" "" true)

    local tasks_count=0
    local users_count=0
    local categories_count=0

    if command -v jq &> /dev/null; then
        # Use jq if available
        tasks_count=$(echo "$tasks_response" | jq '. | length' 2>/dev/null || echo "0")
        users_count=$(echo "$users_response" | jq '. | length' 2>/dev/null || echo "0")
        categories_count=$(echo "$categories_response" | jq '. | length' 2>/dev/null || echo "0")
    else
        # Fallback: count occurrences of "id" field
        if [ "$tasks_response" != "[]" ] && [ -n "$tasks_response" ]; then
            tasks_count=$(echo "$tasks_response" | grep -o '"id":' | wc -l 2>/dev/null || echo "0")
        fi
        if [ "$users_response" != "[]" ] && [ -n "$users_response" ]; then
            users_count=$(echo "$users_response" | grep -o '"id":' | wc -l 2>/dev/null || echo "0")
        fi
        if [ "$categories_response" != "[]" ] && [ -n "$categories_response" ]; then
            categories_count=$(echo "$categories_response" | grep -o '"id":' | wc -l 2>/dev/null || echo "0")
        fi
    fi

    echo "$tasks_count,$users_count,$categories_count"
}

# Function to show database status
show_database_status() {
    print_header "DATABASE STATUS"
    
    local stats=$(get_database_stats)
    local tasks_count=$(echo "$stats" | cut -d',' -f1)
    local users_count=$(echo "$stats" | cut -d',' -f2)
    local categories_count=$(echo "$stats" | cut -d',' -f3)
    
    print_color $CYAN "📊 Database Statistics:"
    print_color $BLUE "   👥 Users: $users_count"
    print_color $BLUE "   📋 Tasks: $tasks_count"
    print_color $BLUE "   🏷️ Categories: $categories_count"
    
    if [ "$tasks_count" -eq 0 ] && [ "$users_count" -eq 0 ] && [ "$categories_count" -eq 0 ]; then
        print_color $YELLOW "⚠️ Database appears to be empty"
    else
        print_color $GREEN "✅ Database contains data"
    fi
}

# Function to reset database
reset_database() {
    print_header "RESETTING DATABASE"
    
    if [ "$FORCE" = false ]; then
        print_color $YELLOW "⚠️ This will delete ALL data in the database!"
        print_color $CYAN "💡 Use --force flag to skip this confirmation"
        echo -n "Are you sure you want to continue? (y/N): "
        read -r REPLY
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            print_color $BLUE "Operation cancelled"
            exit 0
        fi
    fi
    
    print_color $BLUE "🗑️ Clearing database..."
    
    # Delete in order to handle foreign key constraints
    print_color $CYAN "   Deleting tasks..."
    local tasks=$(api_call "GET" "tasks" "" true)
    if [ "$tasks" != "null" ] && [ -n "$tasks" ] && [ "$tasks" != "[]" ]; then
        if command -v jq &> /dev/null; then
            # Use jq if available
            echo "$tasks" | jq -r '.[].id' | while read -r task_id; do
                if [ -n "$task_id" ] && [ "$task_id" != "null" ]; then
                    api_call "DELETE" "tasks/$task_id" "" true > /dev/null || true
                fi
            done
        else
            # Fallback: extract IDs using grep and sed
            echo "$tasks" | grep -o '"id":[0-9]*' | sed 's/"id"://' | while read -r task_id; do
                if [ -n "$task_id" ]; then
                    print_color $BLUE "     Deleting task ID: $task_id"
                    api_call "DELETE" "tasks/$task_id" "" true > /dev/null || true
                fi
            done
        fi
    fi

    print_color $CYAN "   Deleting users..."
    local users=$(api_call "GET" "users" "" true)
    if [ "$users" != "null" ] && [ -n "$users" ] && [ "$users" != "[]" ]; then
        if command -v jq &> /dev/null; then
            # Use jq if available
            echo "$users" | jq -r '.[].id' | while read -r user_id; do
                if [ -n "$user_id" ] && [ "$user_id" != "null" ]; then
                    api_call "DELETE" "users/$user_id" "" true > /dev/null || true
                fi
            done
        else
            # Fallback: extract IDs using grep and sed
            echo "$users" | grep -o '"id":[0-9]*' | sed 's/"id"://' | while read -r user_id; do
                if [ -n "$user_id" ]; then
                    print_color $BLUE "     Deleting user ID: $user_id"
                    api_call "DELETE" "users/$user_id" "" true > /dev/null || true
                fi
            done
        fi
    fi

    print_color $CYAN "   Deleting categories..."
    local categories=$(api_call "GET" "categories" "" true)
    if [ "$categories" != "null" ] && [ -n "$categories" ] && [ "$categories" != "[]" ]; then
        if command -v jq &> /dev/null; then
            # Use jq if available
            echo "$categories" | jq -r '.[].id' | while read -r category_id; do
                if [ -n "$category_id" ] && [ "$category_id" != "null" ]; then
                    api_call "DELETE" "categories/$category_id" "" true > /dev/null || true
                fi
            done
        else
            # Fallback: extract IDs using grep and sed
            echo "$categories" | grep -o '"id":[0-9]*' | sed 's/"id"://' | while read -r category_id; do
                if [ -n "$category_id" ]; then
                    print_color $BLUE "     Deleting category ID: $category_id"
                    api_call "DELETE" "categories/$category_id" "" true > /dev/null || true
                fi
            done
        fi
    fi
    
    print_color $GREEN "✅ Database reset completed"
}

# Function to load sample data from JSON file
load_sample_data() {
    local sample_file="scripts/sample-data.json"

    if [ ! -f "$sample_file" ]; then
        print_color $RED "❌ Sample data file not found: $sample_file"
        return 1
    fi

    if ! cat "$sample_file" > /dev/null 2>&1; then
        print_color $RED "❌ Cannot read sample data file: $sample_file"
        return 1
    fi

    print_color $GREEN "✅ Sample data file loaded successfully"
    return 0
}

# Function to extract data from JSON (fallback without jq)
extract_json_array() {
    local json_content="$1"
    local array_name="$2"

    # Extract the array content between "array_name": [ and ]
    echo "$json_content" | sed -n "s/.*\"$array_name\":\s*\[\(.*\)\].*/\1/p" | head -1
}

# Function to populate database with sample data
populate_database() {
    print_header "POPULATING DATABASE WITH SAMPLE DATA"

    # Load sample data from JSON file
    if ! load_sample_data; then
        print_color $RED "❌ Failed to load sample data"
        return 1
    fi

    local sample_data=$(cat "scripts/sample-data.json")

    print_color $BLUE "👥 Creating users from sample data..."

    # Create users (simplified approach)
    local user_count=0

    # Fallback: create users manually (reliable approach)
    local users=(
        '{"name":"John Smith","email":"john.smith@company.com","phone":"(555) 123-4567","department":"Engineering"}'
        '{"name":"Sarah Johnson","email":"sarah.johnson@company.com","phone":"(555) 234-5678","department":"Product Management"}'
        '{"name":"Mike Chen","email":"mike.chen@company.com","phone":"(555) 345-6789","department":"Design"}'
        '{"name":"Emily Davis","email":"emily.davis@company.com","phone":"(555) 456-7890","department":"Marketing"}'
        '{"name":"Alex Rodriguez","email":"alex.rodriguez@company.com","phone":"(555) 567-8901","department":"QA"}'
        '{"name":"Lisa Wang","email":"lisa.wang@company.com","phone":"(555) 678-9012","department":"DevOps"}'
        '{"name":"David Brown","email":"david.brown@company.com","phone":"(555) 789-0123","department":"Data Science"}'
    )

    for user_data in "${users[@]}"; do
        local response=$(api_call "POST" "users" "$user_data")
        if [ $? -eq 0 ]; then
            ((user_count++))
        fi
    done

    print_color $GREEN "   ✅ Created $user_count users"

    print_color $BLUE "🏷️ Creating categories from sample data..."

    # Create categories
    local category_count=0

    if command -v jq &> /dev/null; then
        # Use jq if available
        echo "$sample_data" | jq -r '.categories[] | @json' | while read -r category_json; do
            local response=$(api_call "POST" "categories" "$category_json")
            local category_id=$(echo "$response" | jq -r '.id' 2>/dev/null)
            if [ -n "$category_id" ] && [ "$category_id" != "null" ]; then
                echo "$category_id" >> /tmp/category_ids.tmp
                ((category_count++))
            fi
        done
        category_count=$(wc -l < /tmp/category_ids.tmp 2>/dev/null || echo "0")
    else
        # Fallback: create categories manually
        local categories=(
            '{"name":"Frontend","color":"#3B82F6","description":"Frontend development tasks"}'
            '{"name":"Backend","color":"#10B981","description":"Backend development tasks"}'
            '{"name":"Design","color":"#F59E0B","description":"UI/UX design tasks"}'
            '{"name":"Testing","color":"#EF4444","description":"Quality assurance tasks"}'
            '{"name":"DevOps","color":"#8B5CF6","description":"Infrastructure and deployment"}'
        )

        for category_data in "${categories[@]}"; do
            local response=$(api_call "POST" "categories" "$category_data")
            local category_id=$(echo "$response" | grep -o '"id":[0-9]*' | sed 's/"id"://' | head -1)
            if [ -n "$category_id" ]; then
                echo "$category_id" >> /tmp/category_ids.tmp
                ((category_count++))
            fi
        done
    fi

    print_color $GREEN "   ✅ Created $category_count categories"
    
    print_color $BLUE "📋 Creating tasks from sample data..."

    # Get current user and category IDs
    local users_data=$(api_call "GET" "users" "" true)
    local categories_data=$(api_call "GET" "categories" "" true)

    # Extract all user and category IDs
    local user_ids_array=()
    local category_ids_array=()

    if [ -f "/tmp/user_ids.tmp" ]; then
        while read -r user_id; do
            user_ids_array+=("$user_id")
        done < /tmp/user_ids.tmp
    fi

    if [ -f "/tmp/category_ids.tmp" ]; then
        while read -r category_id; do
            category_ids_array+=("$category_id")
        done < /tmp/category_ids.tmp
    fi

    # Fallback: extract IDs from API response
    if [ ${#user_ids_array[@]} -eq 0 ]; then
        while read -r user_id; do
            if [ -n "$user_id" ]; then
                user_ids_array+=("$user_id")
            fi
        done < <(echo "$users_data" | grep -o '"id":[0-9]*' | sed 's/"id"://')
    fi

    if [ ${#category_ids_array[@]} -eq 0 ]; then
        while read -r category_id; do
            if [ -n "$category_id" ]; then
                category_ids_array+=("$category_id")
            fi
        done < <(echo "$categories_data" | grep -o '"id":[0-9]*' | sed 's/"id"://')
    fi

    if [ ${#user_ids_array[@]} -eq 0 ] || [ ${#category_ids_array[@]} -eq 0 ]; then
        print_color $YELLOW "   ⚠️ Could not extract user or category IDs for task creation"
        print_color $GREEN "   ✅ Created 0 tasks"
        return
    fi

    # Create tasks from JSON data
    local task_count=0

    if command -v jq &> /dev/null; then
        # Use jq if available
        echo "$sample_data" | jq -c '.tasks[]' | while read -r task_json; do
            local title=$(echo "$task_json" | jq -r '.title')
            local description=$(echo "$task_json" | jq -r '.description')
            local status=$(echo "$task_json" | jq -r '.status')
            local priority=$(echo "$task_json" | jq -r '.priority')
            local due_date=$(echo "$task_json" | jq -r '.dueDate')
            local user_index=$(echo "$task_json" | jq -r '.userIndex')
            local category_index=$(echo "$task_json" | jq -r '.categoryIndex')

            # Get actual IDs using indices
            local user_id=${user_ids_array[$user_index]}
            local category_id=${category_ids_array[$category_index]}

            if [ -n "$user_id" ] && [ -n "$category_id" ]; then
                local task_payload="{\"title\":\"$title\",\"description\":\"$description\",\"status\":$status,\"priority\":$priority,\"userId\":$user_id,\"categoryId\":$category_id,\"dueDate\":\"$due_date\"}"

                print_color $CYAN "   Creating task: $title"
                if api_call "POST" "tasks" "$task_payload" > /dev/null 2>&1; then
                    echo $((task_count + 1)) > /tmp/task_count.tmp
                    print_color $GREEN "   ✅ Task created successfully"
                else
                    print_color $YELLOW "   ⚠️ Failed to create task: $title"
                fi
            fi
        done
        task_count=$(cat /tmp/task_count.tmp 2>/dev/null || echo "0")
    else
        # Fallback: create a few sample tasks
        local sample_tasks=(
            "Implement user authentication|Add JWT-based authentication to the application|1|2|2025-01-15T10:00:00Z|0|1"
            "Design dashboard wireframes|Create wireframes for the main dashboard interface|2|1|2025-01-12T14:00:00Z|2|2"
            "Setup CI/CD pipeline|Configure automated deployment pipeline|0|2|2025-01-20T09:00:00Z|5|4"
            "Write unit tests|Add comprehensive unit tests for API endpoints|1|1|2025-01-18T16:00:00Z|4|3"
            "Dark mode implementation|Add dark mode support to the application|3|0|2025-01-08T16:00:00Z|2|0"
        )

        for task_template in "${sample_tasks[@]}"; do
            local title=$(echo "$task_template" | cut -d'|' -f1)
            local description=$(echo "$task_template" | cut -d'|' -f2)
            local status=$(echo "$task_template" | cut -d'|' -f3)
            local priority=$(echo "$task_template" | cut -d'|' -f4)
            local due_date=$(echo "$task_template" | cut -d'|' -f5)
            local user_index=$(echo "$task_template" | cut -d'|' -f6)
            local category_index=$(echo "$task_template" | cut -d'|' -f7)

            # Get actual IDs using indices (with bounds checking)
            local user_id=""
            local category_id=""

            if [ "$user_index" -lt "${#user_ids_array[@]}" ]; then
                user_id=${user_ids_array[$user_index]}
            else
                user_id=${user_ids_array[0]}
            fi

            if [ "$category_index" -lt "${#category_ids_array[@]}" ]; then
                category_id=${category_ids_array[$category_index]}
            else
                category_id=${category_ids_array[0]}
            fi

            if [ -n "$user_id" ] && [ -n "$category_id" ]; then
                local task_payload="{\"title\":\"$title\",\"description\":\"$description\",\"status\":$status,\"priority\":$priority,\"userId\":$user_id,\"categoryId\":$category_id,\"dueDate\":\"$due_date\"}"

                print_color $CYAN "   Creating task: $title"
                if api_call "POST" "tasks" "$task_payload" > /dev/null 2>&1; then
                    ((task_count++))
                    print_color $GREEN "   ✅ Task created successfully"
                else
                    print_color $YELLOW "   ⚠️ Failed to create task: $title"
                fi
            fi
        done
    fi
    
    print_color $GREEN "   ✅ Created $task_count tasks"

    # Cleanup temporary files
    rm -f /tmp/user_ids.tmp /tmp/category_ids.tmp /tmp/task_count.tmp 2>/dev/null

    print_color $GREEN "🎉 Database populated successfully!"

    # Show final statistics
    show_database_status
}

# Function to backup database
backup_database() {
    print_header "BACKING UP DATABASE"
    
    if [ -z "$BACKUP_FILE" ]; then
        BACKUP_FILE="taskflow_backup_$(date +%Y%m%d_%H%M%S).json"
    fi
    
    print_color $BLUE "💾 Creating backup: $BACKUP_FILE"
    
    # Create backup structure
    local backup_data='{"users":[],"categories":[],"tasks":[],"timestamp":"'$(date -u +%Y-%m-%dT%H:%M:%SZ)'"}'
    
    # Get all data
    local users=$(api_call "GET" "users" "" true)
    local categories=$(api_call "GET" "categories" "" true)
    local tasks=$(api_call "GET" "tasks" "" true)
    
    if command -v jq &> /dev/null; then
        echo "$backup_data" | jq \
            --argjson users "$users" \
            --argjson categories "$categories" \
            --argjson tasks "$tasks" \
            '.users = $users | .categories = $categories | .tasks = $tasks' > "$BACKUP_FILE"
    else
        # Fallback without jq
        echo "{\"users\":$users,\"categories\":$categories,\"tasks\":$tasks,\"timestamp\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"}" > "$BACKUP_FILE"
    fi
    
    print_color $GREEN "✅ Backup created successfully: $BACKUP_FILE"
}

# Function to restore database
restore_database() {
    print_header "RESTORING DATABASE"
    
    if [ -z "$RESTORE_FILE" ]; then
        print_color $RED "❌ Restore file not specified"
        print_color $YELLOW "💡 Use --backup-file FILE to specify restore file"
        exit 1
    fi
    
    if [ ! -f "$RESTORE_FILE" ]; then
        print_color $RED "❌ Restore file not found: $RESTORE_FILE"
        exit 1
    fi
    
    print_color $BLUE "📥 Restoring from: $RESTORE_FILE"
    
    if [ "$FORCE" = false ]; then
        print_color $YELLOW "⚠️ This will replace ALL current data!"
        read -p "Are you sure you want to continue? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            print_color $BLUE "Operation cancelled"
            exit 0
        fi
    fi
    
    # Reset database first
    reset_database
    
    # Restore data (implementation would depend on backup format)
    print_color $YELLOW "⚠️ Restore functionality requires custom implementation based on backup format"
    print_color $BLUE "💡 For now, use the populate command to add sample data"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --api-url)
            API_BASE_URL="$2"
            shift 2
            ;;
        --backup-file)
            BACKUP_FILE="$2"
            RESTORE_FILE="$2"
            shift 2
            ;;
        --force)
            FORCE=true
            shift
            ;;
        --help)
            show_usage
            exit 0
            ;;
        reset|populate|reset-populate|backup|restore|status)
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
print_header "TASKFLOW DATABASE MANAGEMENT SCRIPT"

# Check prerequisites
check_prerequisites

# Execute based on action
case $ACTION in
    reset)
        reset_database
        show_database_status
        ;;
    populate)
        populate_database
        ;;
    reset-populate)
        reset_database
        populate_database
        ;;
    backup)
        backup_database
        ;;
    restore)
        restore_database
        ;;
    status)
        show_database_status
        ;;
    *)
        print_color $RED "❌ Unknown action: $ACTION"
        show_usage
        exit 1
        ;;
esac

print_color $GREEN "🎉 Script completed successfully!"
