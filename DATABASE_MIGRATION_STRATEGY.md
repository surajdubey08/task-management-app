# Database Migration Strategy for TaskFlow Application

## Overview

This document outlines the database migration strategy for the TaskFlow application. It covers the approach for handling database schema changes, version control, deployment procedures, and rollback mechanisms.

## Migration Approach

### EF Core Migrations

The TaskFlow application uses Entity Framework Core for data access, which provides built-in migration capabilities.

#### Creating Migrations

1. **Add a new migration**:
   ```bash
   cd backend/TaskManagement.API
   dotnet ef migrations add MigrationName
   ```

2. **Update the database** (for development):
   ```bash
   dotnet ef database update
   ```

3. **Generate SQL script** (for production):
   ```bash
   dotnet ef migrations script
   ```

### Migration Naming Convention

Migrations should follow a clear naming convention:
- `InitialCreate` - For the initial database schema
- `Add<Task/Feature>Description` - For adding new entities or features
- `Update<Entity>Description` - For modifying existing entities
- `Remove<Entity>Description` - For removing entities

Examples:
- `AddUserRefreshToken`
- `UpdateTaskItemAddPriority`
- `AddCategoryColorField`

## Version Control

### Migration Files

All migration files are stored in the `Migrations` folder and should be committed to version control:
```
backend/TaskManagement.API/Migrations/
├── 20231001000000_InitialCreate.cs
├── 20231001000000_InitialCreate.Designer.cs
├── 20231005000000_AddUserRefreshToken.cs
├── 20231005000000_AddUserRefreshToken.Designer.cs
└── TaskManagementContextModelSnapshot.cs
```

### Migration Dependencies

The `TaskManagementContextModelSnapshot.cs` file contains the current state of the database model and should be committed with each migration.

## Development Workflow

### Local Development

1. Make changes to entity models
2. Create migration:
   ```bash
   dotnet ef migrations add <MigrationName>
   ```
3. Update local database:
   ```bash
   dotnet ef database update
   ```
4. Test changes
5. Commit migration files

### Team Collaboration

1. Pull latest changes from repository
2. If there are new migrations:
   ```bash
   dotnet ef database update
   ```
3. Create your own migrations as needed
4. Push changes including migration files

## Production Deployment

### Migration Strategies

#### Strategy 1: Pre-deployment Migration (Recommended)

1. Generate SQL script:
   ```bash
   dotnet ef migrations script --output migration.sql
   ```
2. Review and test script in staging environment
3. Execute script on production database before deploying application

#### Strategy 2: Application-managed Migration

1. Application runs migrations on startup
2. Requires careful coordination in multi-instance deployments

### Rollback Procedures

#### Rolling Back Migrations

1. Generate rollback script:
   ```bash
   dotnet ef migrations script <TargetMigration> --output rollback.sql
   ```
2. Review and test rollback script
3. Execute rollback script on production database

#### Data Backup Before Migration

Always backup the database before applying migrations:
```bash
# SQLite
sqlite3 taskmanagement.db ".backup taskmanagement_backup_$(date +%Y%m%d).db"

# PostgreSQL
pg_dump -h localhost -U postgres taskmanagement > taskmanagement_backup_$(date +%Y%m%d).sql

# SQL Server
sqlcmd -S localhost -Q "BACKUP DATABASE TaskManagement TO DISK = 'TaskManagement_Backup_$(date +%Y%m%d).bak'"
```

## Multi-Environment Configuration

### Environment-specific Connection Strings

Different environments should use different connection strings:

#### Development (appsettings.Development.json)
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Data Source=taskmanagement.db"
  },
  "DatabaseSettings": {
    "Provider": "SQLite"
  }
}
```

#### Staging (appsettings.Staging.json)
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=staging-postgres;Database=taskmanagement;Username=postgres;Password=password"
  },
  "DatabaseSettings": {
    "Provider": "PostgreSQL"
  }
}
```

#### Production (appsettings.Production.json)
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=prod-postgres;Database=taskmanagement;Username=taskflow;Password=securepassword"
  },
  "DatabaseSettings": {
    "Provider": "PostgreSQL"
  }
}
```

## Docker Environment Configuration

### docker-compose.yml

```yaml
version: '3.8'
services:
  api:
    build: ./backend/TaskManagement.API
    environment:
      - ASPNETCORE_ENVIRONMENT=Development
      - DatabaseProvider=PostgreSQL
      - ConnectionStrings__DefaultConnection=Host=postgres;Database=taskmanagement;Username=postgres;Password=password
    depends_on:
      - postgres

  postgres:
    image: postgres:15
    environment:
      - POSTGRES_DB=taskmanagement
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

## Kubernetes Deployment

### ConfigMap for Database Configuration

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: taskflow-db-config
data:
  DatabaseProvider: "PostgreSQL"
  ConnectionStrings__DefaultConnection: "Host=postgres-service;Database=taskmanagement;Username=taskflow;Password=$(DB_PASSWORD)"
```

### Secret for Database Password

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: taskflow-db-secret
type: Opaque
data:
  DB_PASSWORD: <base64-encoded-password>
```

## Monitoring and Diagnostics

### Migration Health Checks

Add health checks to monitor database migration status:

```csharp
builder.Services.AddHealthChecks()
    .AddDbContextCheck<TaskManagementContext>();
```

### Migration Logging

Configure detailed logging for migration operations:

```csharp
// In Program.cs
builder.Logging.AddFilter("Microsoft.EntityFrameworkCore.Migrations", LogLevel.Information);
```

## Best Practices

### 1. Always Backup Before Migrating
Ensure database backups are performed before applying any migrations in production.

### 2. Test Migrations in Staging
All migrations should be tested in a staging environment that mirrors production.

### 3. Use Transactions for Data Migrations
When migrating data (not just schema), wrap operations in transactions:

```csharp
protected override void Up(MigrationBuilder migrationBuilder)
{
    migrationBuilder.Sql(@"
        BEGIN TRANSACTION;
        -- Data migration operations
        COMMIT;
    ");
}
```

### 4. Avoid Destructive Changes in Production
- Don't drop columns or tables without careful consideration
- Consider deprecating fields instead of removing them
- Plan for data migration when restructuring entities

### 5. Monitor Migration Performance
- Large data migrations should be performed during maintenance windows
- Monitor database performance during and after migrations
- Have rollback plans ready for complex migrations

## Common Migration Scenarios

### Adding a New Column
```csharp
public partial class AddTaskPriority : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<int>(
            name: "Priority",
            table: "Tasks",
            type: "INTEGER",
            nullable: false,
            defaultValue: 0);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropColumn(
            name: "Priority",
            table: "Tasks");
    }
}
```

### Adding a New Table
```csharp
public partial class AddCategoryEntity : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.CreateTable(
            name: "Categories",
            columns: table => new
            {
                Id = table.Column<int>(type: "INTEGER", nullable: false)
                    .Annotation("Sqlite:Autoincrement", true),
                Name = table.Column<string>(type: "TEXT", maxLength: 100, nullable: false),
                Description = table.Column<string>(type: "TEXT", maxLength: 500, nullable: true),
                CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP")
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_Categories", x => x.Id);
            });
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropTable(
            name: "Categories");
    }
}
```

### Modifying Existing Data
```csharp
public partial class UpdateDefaultUserRoles : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql(@"
            UPDATE Users 
            SET Role = 2 
            WHERE Role = 0 AND Email LIKE '%@admin.%'
        ");
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql(@"
            UPDATE Users 
            SET Role = 0 
            WHERE Role = 2 AND Email LIKE '%@admin.%'
        ");
    }
}
```

## Troubleshooting

### Common Issues

1. **Migration Conflicts**
   - When multiple developers create migrations simultaneously
   - Solution: Rebase and regenerate conflicting migrations

2. **Failed Migrations**
   - Database in inconsistent state
   - Solution: Restore from backup and reapply migrations

3. **Performance Issues**
   - Long-running migrations blocking database
   - Solution: Schedule during maintenance windows, optimize queries

### Recovery Procedures

1. **Restore from Backup**
   ```bash
   # SQLite
   cp taskmanagement_backup.db taskmanagement.db
   
   # PostgreSQL
   psql -h localhost -U postgres taskmanagement < taskmanagement_backup.sql
   
   # SQL Server
   sqlcmd -S localhost -Q "RESTORE DATABASE TaskManagement FROM DISK = 'TaskManagement_Backup.bak'"
   ```

2. **Manual Migration Rollback**
   - Identify the last successful migration
   - Manually revert database changes
   - Update the `__EFMigrationsHistory` table

## Conclusion

This migration strategy provides a robust framework for managing database changes in the TaskFlow application. By following these practices, we can ensure reliable, traceable, and reversible database modifications across all environments.