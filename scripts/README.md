# Database Management Script

This directory contains a script to manage the database for the Task Management application via API calls.

## Available Script

### database-manager.sh (Bash)
A comprehensive bash script that uses the .NET application's API endpoints to manage data. Works on Unix/Linux/WSL/macOS environments.

## Prerequisites

- **curl**: Required for API calls
- **jq**: Required for JSON parsing
- **Bash**: Available in Linux, macOS, or Windows WSL
- **.NET 8 SDK**: Required to run the API application

### Installing Prerequisites

**Ubuntu/WSL:**

```bash
sudo apt update
sudo apt install curl jq
```

**macOS:**

```bash
brew install curl jq
```

**Windows:**

Use WSL (Windows Subsystem for Linux) and follow Ubuntu instructions above.

## Key Features

### ✅ **No External Database Tools Required**
- Uses the .NET application's API endpoints instead of direct database access
- No need to install SQLite3 or other database tools
- Works through the application's existing business logic and validation

### 🔄 **API-Based Operations**
- All operations go through the REST API endpoints
- Respects application business rules and validation
- Maintains data integrity through the application layer

### 🚀 **Auto-Start Capability**
- Can automatically start the .NET application if not running
- Waits for API to be ready before proceeding
- Provides clear status information

## Usage

```bash
# Show help
bash scripts/database-manager.sh --help

# Start the API application
bash scripts/database-manager.sh start

# Show database and API status
bash scripts/database-manager.sh status

# Populate database with sample data via API
bash scripts/database-manager.sh populate

# Clear all data via API (with confirmation)
bash scripts/database-manager.sh clear

# Clear all data via API (skip confirmation)
bash scripts/database-manager.sh --force clear

# Remove database file
bash scripts/database-manager.sh remove
```

## Commands

### `start`
Starts the .NET API application:
- Launches the application in the background
- Waits for the API to be ready
- Returns when the health endpoint responds successfully

### `status`
Shows the current status of the system including:
- API URL and connection status
- Database file path and existence
- Sample data file path
- Record counts for each table (via API)
- Database file size

### `populate`
Populates the database with comprehensive sample data via API calls:
- **15 Users** with realistic names, emails, phone numbers, and departments across Engineering, Product Management, Design, Marketing, QA, DevOps, and Data Science
- **10 Categories** (Frontend, Backend, Design, Testing, DevOps, Mobile, Documentation, Research, Security, Analytics) with colors and descriptions
- **48 Tasks** across different statuses and priorities with realistic due dates, covering various aspects of software development lifecycle
- Uses the application's business logic and validation
- Automatically starts the API if not running

### `clear`
Clears all data from the database via API calls:
- Removes all records from Tasks, Categories, and Users
- Uses proper deletion order to respect foreign key constraints
- Goes through the application's business logic
- Requires confirmation unless `--force` flag is used

### `remove`
Completely removes the database file:
- Deletes the SQLite database file from the filesystem
- Requires confirmation unless `--force` flag is used
- Note: This bypasses the API and directly removes the file

## Sample Data Structure

The sample data is loaded from `scripts/sample-data.json` and includes:

### Users (15 records)
- **Engineering**: John Smith, Rachel Green, Kevin Lee
- **Product Management**: Sarah Johnson, James Wilson
- **Design**: Mike Chen, Maria Garcia
- **Marketing**: Emily Davis, Amanda Taylor
- **QA**: Alex Rodriguez, Robert Kim
- **DevOps**: Lisa Wang, Jennifer Martinez
- **Data Science**: David Brown, Thomas Anderson

### Categories (10 records)
- **Frontend** (#3B82F6) - React, Vue, Angular development
- **Backend** (#10B981) - APIs, databases, server logic
- **Design** (#F59E0B) - UI/UX, wireframes, prototypes
- **Testing** (#EF4444) - Unit tests, integration tests, QA
- **DevOps** (#8B5CF6) - Infrastructure, CI/CD, monitoring
- **Mobile** (#EC4899) - iOS and Android development
- **Documentation** (#6B7280) - Technical docs, API guides
- **Research** (#14B8A6) - Market research, technology evaluation
- **Security** (#DC2626) - Security audits, compliance
- **Analytics** (#7C3AED) - Data analysis, reporting

### Tasks (48 records)
Comprehensive tasks covering the entire software development lifecycle:

**Task Statuses:**
- **Status 0**: Pending (To Do)
- **Status 1**: In Progress
- **Status 2**: Completed
- **Status 3**: Cancelled

**Task Priorities:**
- **Priority 0**: Low
- **Priority 1**: Medium
- **Priority 2**: High
- **Priority 3**: Critical

**Task Categories Include:**
- Authentication & Security
- UI/UX Design & Accessibility
- Performance & Optimization
- Testing & Quality Assurance
- DevOps & Infrastructure
- Mobile Development
- Analytics & Reporting
- Documentation & Compliance
- Research & Innovation

## Environment Variables

You can customize the script behavior using environment variables:

### `DB_FILE`
Path to the SQLite database file.
- **Default**: `backend/TaskManagement.API/taskmanagement.db`
- **Example**: `export DB_FILE="/path/to/custom/database.db"`

### `SAMPLE_DATA_FILE`
Path to the sample data JSON file.
- **Default**: `scripts/sample-data.json`
- **Example**: `export SAMPLE_DATA_FILE="/path/to/custom/data.json"`

## Examples

### Complete Database Reset and Population
```bash
# Remove existing database
bash scripts/database-manager.sh --force remove

# Start the .NET application to create schema
cd backend/TaskManagement.API
dotnet run &
sleep 5
curl http://localhost:8080/health
kill %1
cd ../..

# Populate with sample data
bash scripts/database-manager.sh populate

# Check status
bash scripts/database-manager.sh status
```

### Using Custom Paths
```bash
# Use custom database file
export DB_FILE="./custom-database.db"
export SAMPLE_DATA_FILE="./custom-data.json"

bash scripts/database-manager.sh populate
```

## Troubleshooting

### "SQLite3 is not installed"
Install SQLite3 using your system's package manager or download from the official website.

### "jq is not installed" (Bash script only)
Install jq using your system's package manager: `sudo apt install jq` or `brew install jq`.

### "Database file does not exist"
Run the .NET application first to create the database schema:
```bash
cd backend/TaskManagement.API
dotnet run
```

### "Sample data file not found"
Ensure the `scripts/sample-data.json` file exists or set the `SAMPLE_DATA_FILE` environment variable to the correct path.

## Notes

- The scripts automatically handle data type conversions between JSON and SQLite
- User and category indices in the JSON file are converted to 1-based IDs for database insertion
- Date formats are automatically converted from ISO 8601 to SQLite datetime format
- Single quotes in data are properly escaped to prevent SQL injection
- The scripts include comprehensive error handling and colored output for better user experience
