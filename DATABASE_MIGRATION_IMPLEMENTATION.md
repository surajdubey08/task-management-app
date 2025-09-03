# Database Migration Implementation for TaskFlow

## Overview

This document outlines the implementation of a robust database migration system for the TaskFlow application using Entity Framework Core Migrations.

## Current State

The TaskFlow application currently:
- Supports multiple database providers (SQLite, PostgreSQL, SQL Server)
- Lacks automated migration capabilities
- Requires manual database schema management
- Has no version control for database schema changes

## Implementation Plan

### 1. Add EF Core Tools Package

First, we need to ensure the EF Core Tools package is available for creating and running migrations.

### 2. Create Initial Migration

Generate an initial migration based on the current `TaskManagementContext` model.

### 3. Implement Migration Automation

Set up automatic migration execution during application startup.

### 4. Environment-Specific Migrations

Configure different migration strategies for development, staging, and production environments.

## Step-by-Step Implementation

### Step 1: Verify EF Core Tools Installation

Check that the necessary packages are included in `TaskManagement.API.csproj`:

```xml
<PackageReference Include="Microsoft.EntityFrameworkCore.Tools" Version="8.0.0" />
<PackageReference Include="Microsoft.EntityFrameworkCore.Design" Version="8.0.0" />
```

These packages are already present in the project.

### Step 2: Create Initial Migration

Run the following command from the `backend/TaskManagement.API` directory:

```bash
dotnet ef migrations add InitialCreate
```

This will:
- Generate a migration file in the `Migrations` folder
- Create snapshot of the current model
- Generate SQL scripts for creating the database schema

### Step 3: Update Program.cs for Automatic Migrations

Modify the application startup to automatically apply pending migrations:

```csharp
// After building the app, before app.Run()
using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<TaskManagementContext>();
    try
    {
        // Apply any pending migrations
        await context.Database.MigrateAsync();
        Log.Information("Database migration completed successfully");
    }
    catch (Exception ex)
    {
        Log.Error(ex, "An error occurred while migrating the database");
        throw;
    }
}
```

### Step 4: Create Environment-Specific Migration Scripts

Generate SQL scripts for each supported database provider:

```bash
# For SQLite
dotnet ef migrations script -o ./Migrations/SQLite.sql

# For PostgreSQL
dotnet ef migrations script -o ./Migrations/PostgreSQL.sql

# For SQL Server
dotnet ef migrations script -o ./Migrations/SQLServer.sql
```

### Step 5: Update Docker Configuration

Modify `docker-compose.yml` to support migration execution:

```yaml
# Add a migration service
migration:
  build:
    context: ./backend/TaskManagement.API
    dockerfile: Dockerfile
  environment:
    - ASPNETCORE_ENVIRONMENT=Development
    - ConnectionStrings__DefaultConnection=Data Source=/app/data/taskmanagement.db
  volumes:
    - taskmanagement_data:/app/data
  command: ["dotnet", "ef", "database", "update"]
  depends_on:
    - db
```

## Migration Best Practices

### 1. Version Control
- Commit all migration files to source control
- Include migration files in code reviews
- Never modify existing migration files

### 2. Data Safety
- Always backup database before running migrations in production
- Test migrations in staging environment first
- Use transactions where possible

### 3. Performance Considerations
- Avoid long-running operations in migrations
- Consider using `MigrationBuilder.Sql()` for complex operations
- Test migration performance with production-like data volumes

### 4. Rollback Strategy
- Design migrations to be reversible when possible
- Document manual rollback procedures for irreversible changes
- Test rollback procedures in staging environment

## Migration File Structure

After running the initial migration, the project structure will include:

```
TaskManagement.API/
├── Migrations/
│   ├── TaskManagementContextModelSnapshot.cs
│   └── 20250903120000_InitialCreate.cs
├── Data/
│   ├── TaskManagementContext.cs
│   └── DbSeeder.cs
└── Program.cs
```

## Handling Different Database Providers

Since TaskFlow supports multiple database providers, we need to ensure migrations work correctly for each:

### 1. Provider-Specific Considerations

- **SQLite**: Limited data types, no schema modification during transactions
- **PostgreSQL**: Rich data types, advanced indexing options
- **SQL Server**: Enterprise features, different SQL dialect

### 2. Conditional Migration Logic

For provider-specific operations, use:

```csharp
protected override void Up(MigrationBuilder migrationBuilder)
{
    if (migrationBuilder.IsNpgsql())
    {
        // PostgreSQL-specific migration
    }
    else if (migrationBuilder.IsSqlServer())
    {
        // SQL Server-specific migration
    }
    else
    {
        // SQLite or default migration
    }
}
```

## Testing Migrations

### 1. Unit Testing
- Test migration logic with in-memory databases
- Verify data integrity after migration

### 2. Integration Testing
- Test full migration process in isolated environments
- Validate application functionality after migration

### 3. Performance Testing
- Test migration time with large datasets
- Monitor resource usage during migration

## Monitoring and Logging

### 1. Migration Logging
- Log migration start and completion
- Log any errors or warnings
- Track migration execution time

### 2. Health Checks
- Verify database schema version matches expected version
- Check for unapplied migrations
- Monitor migration-related metrics

## Rollback Procedures

### 1. Automatic Rollback
- Use `dotnet ef database update <previous-migration>` to rollback
- Ensure migrations are designed to be reversible

### 2. Manual Rollback
- Maintain backup of database before migration
- Document manual steps for each migration
- Test rollback procedures regularly

## Security Considerations

### 1. Connection Strings
- Store connection strings securely
- Use environment variables or secret management
- Rotate credentials regularly

### 2. Migration Scripts
- Review migration scripts for security issues
- Avoid hardcoding sensitive data in migrations
- Use parameterized queries

## Implementation Timeline

### Week 1: Foundation
- Create initial migration
- Implement automatic migration execution
- Test in development environment

### Week 2: Environment Setup
- Generate provider-specific migration scripts
- Update Docker configuration
- Test in containerized environment

### Week 3: Testing and Validation
- Test migration process in staging environment
- Validate data integrity
- Document rollback procedures

### Week 4: Monitoring and Security
- Implement migration logging
- Add health checks
- Review security considerations

## Success Criteria

1. Migrations execute successfully in all environments
2. Database schema is version-controlled
3. Application functions correctly after migration
4. Rollback procedures are documented and tested
5. Migration process is automated and reliable