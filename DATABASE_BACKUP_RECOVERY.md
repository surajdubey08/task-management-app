# Database Backup and Recovery Procedures for TaskFlow Application

## Overview

This document outlines the backup and recovery procedures for the TaskFlow application database. It covers backup strategies, recovery procedures, and best practices for different database providers supported by the application.

## Backup Strategies

### 1. SQLite Database Backup

#### Automated Backup Script
Create a shell script for automated SQLite backups:

```bash
#!/bin/bash
# backup_sqlite.sh

# Configuration
DB_PATH="/path/to/taskmanagement.db"
BACKUP_DIR="/path/to/backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="taskmanagement_backup_$DATE.db"

# Create backup directory if it doesn't exist
mkdir -p $BACKUP_DIR

# Create backup
cp $DB_PATH $BACKUP_DIR/$BACKUP_NAME

# Verify backup
if [ -f "$BACKUP_DIR/$BACKUP_NAME" ]; then
    echo "Backup successful: $BACKUP_DIR/$BACKUP_NAME"
    # Remove backups older than 30 days
    find $BACKUP_DIR -name "taskmanagement_backup_*.db" -mtime +30 -delete
else
    echo "Backup failed"
    exit 1
fi
```

#### Manual Backup Command
```bash
# Simple copy backup
cp taskmanagement.db taskmanagement_backup_$(date +%Y%m%d).db

# Using SQLite .backup command (more reliable)
sqlite3 taskmanagement.db ".backup taskmanagement_backup_$(date +%Y%m%d).db"
```

### 2. PostgreSQL Database Backup

#### Automated Backup Script
```bash
#!/bin/bash
# backup_postgres.sh

# Configuration
DB_HOST="localhost"
DB_PORT="5432"
DB_NAME="taskmanagement"
DB_USER="postgres"
DB_PASSWORD="password"
BACKUP_DIR="/path/to/backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="taskmanagement_backup_$DATE.sql"

# Set password environment variable
export PGPASSWORD=$DB_PASSWORD

# Create backup directory if it doesn't exist
mkdir -p $BACKUP_DIR

# Create backup
pg_dump -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME > $BACKUP_DIR/$BACKUP_NAME

# Verify backup
if [ -f "$BACKUP_DIR/$BACKUP_NAME" ]; then
    echo "Backup successful: $BACKUP_DIR/$BACKUP_NAME"
    # Compress backup
    gzip $BACKUP_DIR/$BACKUP_NAME
    # Remove backups older than 30 days
    find $BACKUP_DIR -name "taskmanagement_backup_*.sql.gz" -mtime +30 -delete
else
    echo "Backup failed"
    exit 1
fi

# Unset password environment variable
unset PGPASSWORD
```

#### Manual Backup Commands
```bash
# Plain SQL backup
pg_dump -h localhost -U postgres taskmanagement > taskmanagement_backup_$(date +%Y%m%d).sql

# Custom format backup (more flexible for restore)
pg_dump -h localhost -U postgres -Fc taskmanagement > taskmanagement_backup_$(date +%Y%m%d).dump

# Compressed backup
pg_dump -h localhost -U postgres -Z9 taskmanagement > taskmanagement_backup_$(date +%Y%m%d).sql.gz
```

### 3. SQL Server Database Backup

#### Automated Backup Script (PowerShell)
```powershell
# backup_sqlserver.ps1

# Configuration
$ServerInstance = "localhost"
$DatabaseName = "TaskManagement"
$BackupPath = "C:\backups"
$Date = Get-Date -Format "yyyyMMdd_HHmmss"
$BackupName = "TaskManagement_Backup_$Date.bak"

# Create backup directory if it doesn't exist
if (!(Test-Path $BackupPath)) {
    New-Item -ItemType Directory -Path $BackupPath
}

# Create backup
$BackupQuery = "BACKUP DATABASE [$DatabaseName] TO DISK = '$BackupPath\$BackupName' WITH FORMAT"
Invoke-Sqlcmd -ServerInstance $ServerInstance -Query $BackupQuery

# Verify backup
if (Test-Path "$BackupPath\$BackupName") {
    Write-Host "Backup successful: $BackupPath\$BackupName"
    # Remove backups older than 30 days
    Get-ChildItem $BackupPath -Filter "TaskManagement_Backup_*.bak" | Where-Object { $_.CreationTime -lt (Get-Date).AddDays(-30) } | Remove-Item
} else {
    Write-Host "Backup failed"
    exit 1
}
```

#### Manual Backup Commands
```sql
-- Full database backup
BACKUP DATABASE TaskManagement 
TO DISK = 'C:\backups\TaskManagement_Backup_20231001.bak'
WITH FORMAT;

-- Differential backup
BACKUP DATABASE TaskManagement 
TO DISK = 'C:\backups\TaskManagement_Diff_20231001.bak'
WITH DIFFERENTIAL;

-- Transaction log backup
BACKUP LOG TaskManagement 
TO DISK = 'C:\backups\TaskManagement_Log_20231001.trn';
```

## Recovery Procedures

### 1. SQLite Database Recovery

#### Full Recovery
```bash
# Stop the application
# Replace the current database with the backup
cp taskmanagement_backup_20231001.db taskmanagement.db

# Start the application
```

#### Point-in-Time Recovery
SQLite doesn't support point-in-time recovery natively. You'll need to:
1. Restore from the most recent full backup
2. Reapply any changes made since the backup (if available)

### 2. PostgreSQL Database Recovery

#### Full Recovery from SQL Dump
```bash
# Drop and recreate database
dropdb -h localhost -U postgres taskmanagement
createdb -h localhost -U postgres taskmanagement

# Restore from backup
psql -h localhost -U postgres taskmanagement < taskmanagement_backup_20231001.sql
```

#### Full Recovery from Custom Format
```bash
# Drop and recreate database
dropdb -h localhost -U postgres taskmanagement
createdb -h localhost -U postgres taskmanagement

# Restore from custom format backup
pg_restore -h localhost -U postgres -d taskmanagement taskmanagement_backup_20231001.dump
```

#### Point-in-Time Recovery
For point-in-time recovery, you need:
1. Base backup
2. WAL (Write-Ahead Log) archives

```bash
# Recovery using PITR
# 1. Stop PostgreSQL server
# 2. Restore base backup to data directory
# 3. Create recovery.conf with recovery target
# 4. Start PostgreSQL server in recovery mode
```

### 3. SQL Server Database Recovery

#### Full Recovery
```sql
-- Restore full backup
RESTORE DATABASE TaskManagement 
FROM DISK = 'C:\backups\TaskManagement_Backup_20231001.bak'
WITH REPLACE;
```

#### Recovery with Transaction Logs
```sql
-- Restore full backup with NORECOVERY
RESTORE DATABASE TaskManagement 
FROM DISK = 'C:\backups\TaskManagement_Backup_20231001.bak'
WITH NORECOVERY;

-- Restore transaction log
RESTORE LOG TaskManagement 
FROM DISK = 'C:\backups\TaskManagement_Log_20231001.trn'
WITH RECOVERY;
```

#### Point-in-Time Recovery
```sql
-- Restore to specific point in time
RESTORE DATABASE TaskManagement 
FROM DISK = 'C:\backups\TaskManagement_Backup_20231001.bak'
WITH NORECOVERY;

RESTORE LOG TaskManagement 
FROM DISK = 'C:\backups\TaskManagement_Log_20231001.trn'
WITH STOPAT = '2023-10-01 14:30:00',
RECOVERY;
```

## Automated Backup Scheduling

### Linux (Cron)
```bash
# Edit crontab
crontab -e

# Add daily backup at 2 AM
0 2 * * * /path/to/backup_script.sh

# Add weekly full backup on Sundays at 1 AM
0 1 * * 0 /path/to/weekly_backup_script.sh
```

### Windows (Task Scheduler)
```powershell
# Create scheduled task for daily backups
$action = New-ScheduledTaskAction -Execute "PowerShell.exe" -Argument "-File C:\scripts\backup_sqlserver.ps1"
$trigger = New-ScheduledTaskTrigger -Daily -At 2am
Register-ScheduledTask -TaskName "TaskFlow Daily Backup" -Action $action -Trigger $trigger -User "SYSTEM"
```

### Docker Environment
```yaml
version: '3.8'
services:
  backup:
    image: postgres:15
    volumes:
      - ./backups:/backups
      - ./scripts:/scripts
    environment:
      - PGPASSWORD=password
    command: |
      bash -c "
        sleep 10 &&
        /scripts/backup_postgres.sh
      "
    depends_on:
      - postgres
```

## Monitoring and Alerts

### Backup Verification
Create a script to verify backup integrity:

```bash
#!/bin/bash
# verify_backup.sh

BACKUP_FILE=$1

if [ -z "$BACKUP_FILE" ]; then
    echo "Usage: $0 <backup_file>"
    exit 1
fi

# For SQLite
if [[ $BACKUP_FILE == *.db ]]; then
    sqlite3 $BACKUP_FILE "PRAGMA integrity_check;" | grep -q "ok"
    if [ $? -eq 0 ]; then
        echo "SQLite backup integrity check passed"
    else
        echo "SQLite backup integrity check failed"
        exit 1
    fi
fi

# For PostgreSQL SQL dump
if [[ $BACKUP_FILE == *.sql ]]; then
    head -n 20 $BACKUP_FILE | grep -q "PostgreSQL database dump"
    if [ $? -eq 0 ]; then
        echo "PostgreSQL backup file format verified"
    else
        echo "PostgreSQL backup file format check failed"
        exit 1
    fi
fi
```

### Monitoring Script
```bash
#!/bin/bash
# monitor_backups.sh

BACKUP_DIR="/path/to/backups"
DAYS_SINCE_LAST_BACKUP=$(find $BACKUP_DIR -name "taskmanagement_backup_*" -type f -mtime -1 | wc -l)

if [ $DAYS_SINCE_LAST_BACKUP -eq 0 ]; then
    echo "ALERT: No backup found in the last 24 hours"
    # Send alert (email, Slack, etc.)
else
    echo "Backup status: OK"
fi
```

## Best Practices

### 1. Backup Frequency
- **Development**: Daily backups
- **Staging**: Daily backups
- **Production**: 
  - Full backups: Daily
  - Transaction log backups: Every 15 minutes
  - Differential backups: Weekly

### 2. Backup Storage
- Store backups in multiple locations (local + cloud)
- Encrypt sensitive backup files
- Test backup restoration regularly

### 3. Backup Retention
- Daily backups: Keep for 30 days
- Weekly backups: Keep for 90 days
- Monthly backups: Keep for 1 year
- Yearly backups: Keep for 7 years

### 4. Security Considerations
- Restrict access to backup files
- Encrypt backups containing sensitive data
- Use secure connections for remote backups
- Regularly audit backup access logs

### 5. Testing and Validation
- Test backup restoration monthly
- Document restoration procedures
- Train team members on recovery procedures
- Include backup testing in disaster recovery drills

## Disaster Recovery Plan

### 1. Incident Response
1. Identify the cause of data loss
2. Stop further data modification
3. Assess the scope of data loss
4. Determine the most recent good backup

### 2. Recovery Process
1. Isolate the affected system
2. Restore from the most recent backup
3. Apply incremental backups if available
4. Validate data integrity
5. Resume normal operations

### 3. Communication Plan
- Notify stakeholders of the incident
- Provide regular updates on recovery progress
- Document the incident and lessons learned
- Update disaster recovery procedures based on findings

## Conclusion

This backup and recovery procedure document provides a comprehensive framework for protecting the TaskFlow application database. By implementing these procedures, you can ensure data availability, minimize downtime, and maintain business continuity in case of data loss events.