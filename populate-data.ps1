#!/usr/bin/env pwsh

# Task Management App - Data Population Script
# This script clears all existing data and populates the app with high-quality sample data

Write-Host "🚀 Task Management App - Data Population Script" -ForegroundColor Cyan
Write-Host "=================================================" -ForegroundColor Cyan

# Configuration
$API_BASE_URL = "http://localhost:5000/api"
$HEADERS = @{
    "Content-Type" = "application/json"
    "Accept" = "application/json"
}

# Function to make API calls with error handling
function Invoke-ApiCall {
    param(
        [string]$Method,
        [string]$Url,
        [object]$Body = $null,
        [bool]$SuppressErrors = $false
    )

    try {
        $params = @{
            Method = $Method
            Uri = $Url
            Headers = $HEADERS
        }

        if ($Body) {
            $params.Body = ($Body | ConvertTo-Json -Depth 10)
        }

        $response = Invoke-RestMethod @params
        return $response
    }
    catch {
        if (-not $SuppressErrors) {
            Write-Host "❌ Error calling $Method $Url : $($_.Exception.Message)" -ForegroundColor Red
        }
        return $null
    }
}

# Function to clear all existing data
function Clear-AllData {
    Write-Host "🗑️  Clearing all existing data..." -ForegroundColor Yellow

    # Get all data first
    $tasks = Invoke-ApiCall -Method "GET" -Url "$API_BASE_URL/tasks" -SuppressErrors $true
    $users = Invoke-ApiCall -Method "GET" -Url "$API_BASE_URL/users" -SuppressErrors $true
    $categories = Invoke-ApiCall -Method "GET" -Url "$API_BASE_URL/categories" -SuppressErrors $true

    $deletedTasks = 0
    $deletedUsers = 0
    $deletedCategories = 0

    # Step 1: Try to delete all tasks first (this should cascade delete comments and activities)
    if ($tasks) {
        foreach ($task in $tasks) {
            $result = Invoke-ApiCall -Method "DELETE" -Url "$API_BASE_URL/tasks/$($task.id)" -SuppressErrors $true
            if ($result -ne $null) {
                $deletedTasks++
            }
        }
        Write-Host "   ✅ Deleted $deletedTasks tasks" -ForegroundColor Green
    }

    # Step 2: Delete all users (should work now that tasks are gone)
    if ($users) {
        foreach ($user in $users) {
            $result = Invoke-ApiCall -Method "DELETE" -Url "$API_BASE_URL/users/$($user.id)" -SuppressErrors $true
            if ($result -ne $null) {
                $deletedUsers++
            }
        }
        Write-Host "   ✅ Deleted $deletedUsers users" -ForegroundColor Green
    }

    # Step 3: Delete all categories
    if ($categories) {
        foreach ($category in $categories) {
            $result = Invoke-ApiCall -Method "DELETE" -Url "$API_BASE_URL/categories/$($category.id)" -SuppressErrors $true
            if ($result -ne $null) {
                $deletedCategories++
            }
        }
        Write-Host "   ✅ Deleted $deletedCategories categories" -ForegroundColor Green
    }

    # Show summary of what was found vs deleted
    if ($tasks -and $deletedTasks -lt $tasks.Count) {
        Write-Host "   ⚠️  Some tasks may have had foreign key constraints ($deletedTasks/$($tasks.Count) deleted)" -ForegroundColor Yellow
    }
    if ($users -and $deletedUsers -lt $users.Count) {
        Write-Host "   ⚠️  Some users may have had foreign key constraints ($deletedUsers/$($users.Count) deleted)" -ForegroundColor Yellow
    }
    if ($categories -and $deletedCategories -lt $categories.Count) {
        Write-Host "   ⚠️  Some categories may have had foreign key constraints ($deletedCategories/$($categories.Count) deleted)" -ForegroundColor Yellow
    }

    # Verify cleanup - check if any data remains
    Start-Sleep -Seconds 1  # Give database a moment to process
    $remainingTasks = Invoke-ApiCall -Method "GET" -Url "$API_BASE_URL/tasks" -SuppressErrors $true
    $remainingUsers = Invoke-ApiCall -Method "GET" -Url "$API_BASE_URL/users" -SuppressErrors $true
    $remainingCategories = Invoke-ApiCall -Method "GET" -Url "$API_BASE_URL/categories" -SuppressErrors $true

    if ($remainingTasks -and $remainingTasks.Count -gt 0) {
        Write-Host "   ⚠️  $($remainingTasks.Count) tasks still remain (may have constraints)" -ForegroundColor Yellow
    }
    if ($remainingUsers -and $remainingUsers.Count -gt 0) {
        Write-Host "   ⚠️  $($remainingUsers.Count) users still remain (may have constraints)" -ForegroundColor Yellow
    }
    if ($remainingCategories -and $remainingCategories.Count -gt 0) {
        Write-Host "   ⚠️  $($remainingCategories.Count) categories still remain (may have constraints)" -ForegroundColor Yellow
    }

    Write-Host "🧹 Data clearing completed!" -ForegroundColor Green
}

# Function to create users
function Create-Users {
    Write-Host "👥 Creating users..." -ForegroundColor Yellow
    
    $users = @(
        @{
            name = "Sarah Johnson"
            email = "sarah.johnson@company.com"
            phoneNumber = "+1-555-0101"
            department = "Engineering"
        },
        @{
            name = "Michael Chen"
            email = "michael.chen@company.com"
            phoneNumber = "+1-555-0102"
            department = "Product Management"
        },
        @{
            name = "Emily Rodriguez"
            email = "emily.rodriguez@company.com"
            phoneNumber = "+1-555-0103"
            department = "Design"
        },
        @{
            name = "David Kim"
            email = "david.kim@company.com"
            phoneNumber = "+1-555-0104"
            department = "Marketing"
        },
        @{
            name = "Jessica Thompson"
            email = "jessica.thompson@company.com"
            phoneNumber = "+1-555-0105"
            department = "Quality Assurance"
        },
        @{
            name = "Alex Morgan"
            email = "alex.morgan@company.com"
            phoneNumber = "+1-555-0106"
            department = "DevOps"
        },
        @{
            name = "Lisa Wang"
            email = "lisa.wang@company.com"
            phoneNumber = "+1-555-0107"
            department = "Data Science"
        }
    )
    
    $createdUsers = @()
    foreach ($user in $users) {
        $result = Invoke-ApiCall -Method "POST" -Url "$API_BASE_URL/users" -Body $user
        if ($result) {
            $createdUsers += $result
            Write-Host "   ✅ Created user: $($user.name)" -ForegroundColor Green
        }
    }
    
    return $createdUsers
}

# Function to create categories
function Create-Categories {
    Write-Host "📁 Creating categories..." -ForegroundColor Yellow
    
    $categories = @(
        @{
            name = "Frontend Development"
            description = "User interface and user experience development tasks"
            color = "#3B82F6"
            isActive = $true
        },
        @{
            name = "Backend Development"
            description = "Server-side development and API tasks"
            color = "#10B981"
            isActive = $true
        },
        @{
            name = "Quality Assurance"
            description = "Testing, bug fixes, and quality control tasks"
            color = "#F59E0B"
            isActive = $true
        },
        @{
            name = "DevOps & Infrastructure"
            description = "Deployment, monitoring, and infrastructure tasks"
            color = "#8B5CF6"
            isActive = $true
        },
        @{
            name = "Product & Design"
            description = "Product planning, design, and user research tasks"
            color = "#EF4444"
            isActive = $true
        }
    )
    
    $createdCategories = @()
    foreach ($category in $categories) {
        $result = Invoke-ApiCall -Method "POST" -Url "$API_BASE_URL/categories" -Body $category
        if ($result) {
            $createdCategories += $result
            Write-Host "   ✅ Created category: $($category.name)" -ForegroundColor Green
        }
    }
    
    return $createdCategories
}

# Function to create tasks
function Create-Tasks {
    param(
        [array]$Users,
        [array]$Categories
    )

    Write-Host "📋 Creating tasks..." -ForegroundColor Yellow

    # Helper function to get random user ID
    function Get-RandomUserId { return ($Users | Get-Random).id }

    # Helper function to get category ID by name
    function Get-CategoryId($name) {
        return ($Categories | Where-Object { $_.name -eq $name }).id
    }

    # Helper function to get date relative to today
    function Get-RelativeDate($days) {
        return (Get-Date).AddDays($days).ToString("yyyy-MM-dd")
    }

    $tasks = @(
        @{
            title = "Implement user authentication system"
            description = "Design and implement JWT-based authentication with login, logout, and token refresh functionality. Include password hashing and security best practices."
            status = 1  # In Progress
            priority = 2  # High
            dueDate = Get-RelativeDate 5
            userId = Get-RandomUserId
            categoryId = Get-CategoryId "Backend Development"
        },
        @{
            title = "Design responsive dashboard layout"
            description = "Create a modern, responsive dashboard layout that works across desktop, tablet, and mobile devices. Include dark mode support and accessibility features."
            status = 0  # Pending
            priority = 1  # Medium
            dueDate = Get-RelativeDate 8
            userId = Get-RandomUserId
            categoryId = Get-CategoryId "Frontend Development"
        },
        @{
            title = "Set up CI/CD pipeline"
            description = "Configure automated build, test, and deployment pipeline using GitHub Actions. Include staging and production environments with proper security measures."
            status = 2  # Completed
            priority = 2  # High
            dueDate = Get-RelativeDate -3
            userId = Get-RandomUserId
            categoryId = Get-CategoryId "DevOps & Infrastructure"
        },
        @{
            title = "Conduct user research interviews"
            description = "Interview 10-15 target users to understand their pain points and requirements. Create user personas and journey maps based on findings."
            status = 1  # In Progress
            priority = 1  # Medium
            dueDate = Get-RelativeDate 12
            userId = Get-RandomUserId
            categoryId = Get-CategoryId "Product & Design"
        },
        @{
            title = "Write comprehensive API documentation"
            description = "Document all API endpoints with examples, request/response schemas, and error handling. Use OpenAPI/Swagger for interactive documentation."
            status = 0  # Pending
            priority = 1  # Medium
            dueDate = Get-RelativeDate 15
            userId = Get-RandomUserId
            categoryId = Get-CategoryId "Backend Development"
        },
        @{
            title = "Implement automated testing suite"
            description = "Create unit tests, integration tests, and end-to-end tests. Achieve 80%+ code coverage and integrate with CI pipeline."
            status = 1  # In Progress
            priority = 2  # High
            dueDate = Get-RelativeDate 10
            userId = Get-RandomUserId
            categoryId = Get-CategoryId "Quality Assurance"
        },
        @{
            title = "Optimize database performance"
            description = "Analyze slow queries, add appropriate indexes, and optimize database schema. Implement connection pooling and query caching."
            status = 0  # Pending
            priority = 2  # High
            dueDate = Get-RelativeDate 7
            userId = Get-RandomUserId
            categoryId = Get-CategoryId "Backend Development"
        },
        @{
            title = "Create component library"
            description = "Build a reusable component library with consistent styling, proper TypeScript types, and comprehensive Storybook documentation."
            status = 1  # In Progress
            priority = 1  # Medium
            dueDate = Get-RelativeDate 20
            userId = Get-RandomUserId
            categoryId = Get-CategoryId "Frontend Development"
        },
        @{
            title = "Security audit and penetration testing"
            description = "Conduct comprehensive security audit including OWASP top 10 vulnerabilities. Perform penetration testing and fix identified issues."
            status = 0  # Pending
            priority = 2  # High
            dueDate = Get-RelativeDate 14
            userId = Get-RandomUserId
            categoryId = Get-CategoryId "Quality Assurance"
        },
        @{
            title = "Mobile app wireframes and prototypes"
            description = "Design wireframes and interactive prototypes for mobile application. Include user flow diagrams and design system specifications."
            status = 2  # Completed
            priority = 1  # Medium
            dueDate = Get-RelativeDate -5
            userId = Get-RandomUserId
            categoryId = Get-CategoryId "Product & Design"
        },
        @{
            title = "Implement real-time notifications"
            description = "Add WebSocket-based real-time notifications for task updates, comments, and system alerts. Include browser notification support."
            status = 0  # Pending
            priority = 1  # Medium
            dueDate = Get-RelativeDate 18
            userId = Get-RandomUserId
            categoryId = Get-CategoryId "Frontend Development"
        },
        @{
            title = "Set up monitoring and alerting"
            description = "Configure application monitoring with metrics, logs, and alerts. Set up dashboards for system health and performance tracking."
            status = 1  # In Progress
            priority = 2  # High
            dueDate = Get-RelativeDate 6
            userId = Get-RandomUserId
            categoryId = Get-CategoryId "DevOps & Infrastructure"
        }
    )

    $createdTasks = @()
    foreach ($task in $tasks) {
        $result = Invoke-ApiCall -Method "POST" -Url "$API_BASE_URL/tasks" -Body $task
        if ($result) {
            $createdTasks += $result
            Write-Host "   ✅ Created task: $($task.title)" -ForegroundColor Green
        }
    }

    return $createdTasks
}

# Function to display summary
function Show-Summary {
    param(
        [array]$Users,
        [array]$Categories,
        [array]$Tasks
    )

    Write-Host ""
    Write-Host "📊 Data Population Summary" -ForegroundColor Cyan
    Write-Host "=========================" -ForegroundColor Cyan
    Write-Host "👥 Users created: $($Users.Count)" -ForegroundColor Green
    Write-Host "📁 Categories created: $($Categories.Count)" -ForegroundColor Green
    Write-Host "📋 Tasks created: $($Tasks.Count)" -ForegroundColor Green
    Write-Host ""

    Write-Host "📈 Task Status Distribution:" -ForegroundColor Yellow
    $statusCounts = $Tasks | Group-Object status
    foreach ($status in $statusCounts) {
        $statusName = switch ($status.Name) {
            "0" { "Pending" }
            "1" { "In Progress" }
            "2" { "Completed" }
            default { "Unknown" }
        }
        Write-Host "   ${statusName}: $($status.Count)" -ForegroundColor White
    }

    Write-Host ""
    Write-Host "🎯 Priority Distribution:" -ForegroundColor Yellow
    $priorityCounts = $Tasks | Group-Object priority
    foreach ($priority in $priorityCounts) {
        $priorityName = switch ($priority.Name) {
            "0" { "Low" }
            "1" { "Medium" }
            "2" { "High" }
            default { "Unknown" }
        }
        Write-Host "   ${priorityName}: $($priority.Count)" -ForegroundColor White
    }

    Write-Host ""
    Write-Host "🏢 Departments:" -ForegroundColor Yellow
    $departments = $Users | Group-Object department
    foreach ($dept in $departments) {
        Write-Host "   $($dept.Name): $($dept.Count) users" -ForegroundColor White
    }
}

# Main execution
function Main {
    Write-Host ""
    Write-Host "Starting data population process..." -ForegroundColor Cyan
    Write-Host ""

    # Check if API is accessible
    try {
        $null = Invoke-RestMethod -Uri "$API_BASE_URL/users" -Method GET -Headers $HEADERS
        Write-Host "✅ API is accessible at $API_BASE_URL" -ForegroundColor Green
    }
    catch {
        Write-Host "❌ Cannot connect to API at $API_BASE_URL" -ForegroundColor Red
        Write-Host "   Please ensure the backend is running on http://localhost:5000" -ForegroundColor Yellow
        exit 1
    }

    # Clear existing data
    Clear-AllData
    Write-Host ""

    # Create new data
    $users = Create-Users
    Write-Host ""

    $categories = Create-Categories
    Write-Host ""

    $tasks = Create-Tasks -Users $users -Categories $categories
    Write-Host ""

    # Show summary
    Show-Summary -Users $users -Categories $categories -Tasks $tasks

    Write-Host ""
    Write-Host "🎉 Data population completed successfully!" -ForegroundColor Green
    Write-Host "   You can now access the application with quality sample data." -ForegroundColor Cyan
    Write-Host ""
}

# Run the script
Main
