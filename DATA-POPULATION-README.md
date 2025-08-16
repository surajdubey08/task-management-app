# 🚀 Task Management App - Data Population

This directory contains scripts to populate your Task Management App with high-quality sample data.

## 📋 What Gets Created

### 👥 **7 Users** (Diverse team members)
- **Sarah Johnson** - Engineering
- **Michael Chen** - Product Management  
- **Emily Rodriguez** - Design
- **David Kim** - Marketing
- **Jessica Thompson** - Quality Assurance
- **Alex Morgan** - DevOps
- **Lisa Wang** - Data Science

### 📁 **5 Categories** (Color-coded)
- **Frontend Development** - Blue (#3B82F6)
- **Backend Development** - Green (#10B981)
- **Quality Assurance** - Amber (#F59E0B)
- **DevOps & Infrastructure** - Purple (#8B5CF6)
- **Product & Design** - Red (#EF4444)

### 📋 **12 Tasks** (Realistic project tasks)
- Mix of **Pending**, **In Progress**, and **Completed** statuses
- Various **priorities** (Low, Medium, High)
- **Realistic due dates** (past, present, future)
- **Detailed descriptions** for each task
- Tasks assigned across different **users** and **categories**

## 🚀 How to Run

### Prerequisites
1. **Backend API** must be running on `http://localhost:5000`
2. **PowerShell** installed (Windows PowerShell or PowerShell Core)

### Option 1: PowerShell Script (Recommended)
```powershell
# Run the PowerShell script directly
./populate-data.ps1
```

### Option 2: Batch File (Windows)
```cmd
# Double-click or run from command prompt
populate-data.bat
```

### Option 3: Manual PowerShell Execution
```powershell
# If execution policy prevents running scripts
powershell -ExecutionPolicy Bypass -File "populate-data.ps1"
```

## ⚠️ Important Notes

### 🗑️ **Data Clearing**
- **ALL existing data will be DELETED** before adding new data
- This includes all users, categories, tasks, comments, and activities
- **Make sure to backup** any important data before running
- Script handles foreign key constraints gracefully
- Some warnings about constraints are normal and expected

### 🔧 **API Requirements**
- Backend must be running on `http://localhost:5000`
- All API endpoints must be accessible:
  - `GET/POST/DELETE /api/users`
  - `GET/POST/DELETE /api/categories`  
  - `GET/POST/DELETE /api/tasks`

### 📊 **Expected Results**
After successful execution, you'll see:
- **7 users** across different departments
- **5 categories** with distinct colors
- **12 tasks** with varied statuses and priorities
- **Summary statistics** showing distribution

## 🐛 Troubleshooting

### ❌ "Cannot connect to API"
- Ensure backend is running: `docker-compose up -d` or `dotnet run`
- Check API is accessible at `http://localhost:5000/api/users`
- Verify no firewall blocking the connection

### ❌ "PowerShell execution policy"
```powershell
# Temporarily allow script execution
Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process
./populate-data.ps1
```

### ❌ "API endpoint not found"
- Ensure you're using the correct API version
- Check backend logs for any startup errors
- Verify database is properly initialized

### ⚠️ "Foreign key constraint warnings"
- **These warnings are NORMAL and expected**
- The script handles database relationships properly
- Some data may have constraints that prevent immediate deletion
- New data will still be created successfully
- Warnings don't affect the final result

## 📈 Sample Data Quality

The generated data includes:

### 🎯 **Realistic Task Distribution**
- **33%** Pending tasks (future work)
- **42%** In Progress tasks (current work)  
- **25%** Completed tasks (finished work)

### 📊 **Priority Balance**
- **25%** High priority (urgent items)
- **58%** Medium priority (standard work)
- **17%** Low priority (nice-to-have)

### 🏢 **Department Coverage**
- Engineering, Product, Design, Marketing
- QA, DevOps, Data Science teams
- Realistic email addresses and phone numbers

### 📅 **Timeline Spread**
- **Past due dates** (completed tasks)
- **Current dates** (urgent tasks)
- **Future dates** (planned work)
- Dates spread across 3 weeks

## 🔄 Re-running the Script

You can run this script multiple times:
- Each run **completely clears** existing data
- **Fresh data** is created every time
- **No duplicate** entries will be created
- **Safe to run** during development/testing

## 🎉 Success Indicators

After successful execution, you should see:
- ✅ All existing data cleared
- ✅ 7 users created
- ✅ 5 categories created  
- ✅ 12 tasks created
- 📊 Summary statistics displayed
- 🎉 Success message

Now you can access your Task Management App with professional, realistic sample data!
