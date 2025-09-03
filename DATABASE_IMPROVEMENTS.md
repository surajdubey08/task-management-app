# Database Improvements for TaskFlow Application

## Current State Analysis

### Database Providers Supported
1. **SQLite** - Default development database
2. **PostgreSQL** - Supported in production
3. **SQL Server** - Not currently supported but can be added

### Current Configuration
- **Development**: SQLite with file-based storage
- **Production**: PostgreSQL (as indicated in documentation)
- **Connection Management**: Basic connection handling without advanced pooling

### Identified Limitations
1. No support for SQL Server
2. Limited connection pooling configuration
3. No database migration strategy documented
4. No backup/restore procedures
5. No performance monitoring or optimization guidelines

## Proposed Database Improvements

### 1. Enhanced Database Provider Support

#### Add SQL Server Support
The application already has the infrastructure to support SQL Server. We've added the configuration in `Program.cs`.

To complete SQL Server support:
1. Add the NuGet package reference:
   ```xml
   <PackageReference Include="Microsoft.EntityFrameworkCore.SqlServer" Version="8.0.0" />
   ```

2. Update connection strings to support SQL Server:
   ```json
   {
     "ConnectionStrings": {
       "DefaultConnection": "Data Source=taskmanagement.db",
       "PostgreSQLConnection": "Host=localhost;Database=taskmanagement;Username=postgres;Password=password",
       "SQLServerConnection": "Server=localhost;Database=TaskManagement;Trusted_Connection=true;TrustServerCertificate=true;"
     }
   }
   ```

3. Add environment variable support in docker-compose.yml:
   ```yaml
   environment:
     - DatabaseProvider=SQLServer
     - ConnectionStrings__DefaultConnection=Server=sqlserver;Database=TaskManagement;User=sa;Password=YourStrong@Passw0rd;TrustServerCertificate=true;
   ```

### 2. Connection Pooling Optimization

#### Current Issues
- Basic connection handling
- No explicit pooling configuration
- No monitoring of connection usage

#### Improvements
1. **Explicit Connection Pooling Configuration**:
   ```csharp
   // For SQL Server
   options.UseSqlServer(connectionString, sqlOptions =>
   {
       sqlOptions.CommandTimeout(30);
       sqlOptions.UseQuerySplittingBehavior(QuerySplittingBehavior.SplitQuery);
       // Connection pooling settings
       sqlOptions.EnableRetryOnFailure(3);
   });
   
   // For PostgreSQL
   options.UseNpgsql(connectionString, npgsqlOptions =>
   {
       npgsqlOptions.CommandTimeout(30);
       // Connection pooling is enabled by default in Npgsql
       npgsqlOptions.EnableRetryOnFailure(3);
   });
   ```

2. **Connection Monitoring Middleware**:
   Add middleware to monitor connection pool usage and performance metrics.

### 3. Database Migration Strategy

#### Current State
- No formal migration strategy
- Database seeded on first run only

#### Proposed Improvements
1. **EF Core Migrations**:
   ```bash
   # Add migration
   dotnet ef migrations add InitialCreate
   
   # Update database
   dotnet ef database update
   ```

2. **Migration Scripts**:
   Create scripts for different environments:
   - Development: Auto-migration on startup
   - Production: Manual migration execution

3. **Version Control**:
   Include migration files in version control
   Document migration procedures

### 4. Backup and Recovery

#### Backup Strategy
1. **Automated Backups**:
   - Daily full backups
   - Hourly transaction log backups (for SQL Server/PostgreSQL)
   - Automated backup rotation

2. **Backup Scripts**:
   ```bash
   # SQLite backup
   sqlite3 taskmanagement.db ".backup taskmanagement_backup.db"
   
   # PostgreSQL backup
   pg_dump -h localhost -U postgres taskmanagement > taskmanagement_backup.sql
   
   # SQL Server backup
   sqlcmd -S localhost -Q "BACKUP DATABASE TaskManagement TO DISK = 'C:\backups\TaskManagement.bak'"
   ```

### 5. Performance Optimization

#### Query Optimization
1. **Indexing Strategy**:
   ```csharp
   // Add indexes in OnModelCreating
   entity.HasIndex(e => e.Email).IsUnique();
   entity.HasIndex(e => e.CreatedAt);
   entity.HasIndex(e => new { e.Status, e.Priority });
   ```

2. **Query Splitting**:
   ```csharp
   // Use split queries for complex joins
   var tasks = await context.Tasks
       .Include(t => t.User)
       .Include(t => t.Category)
       .AsSplitQuery()
       .ToListAsync();
   ```

3. **Compiled Queries**:
   ```csharp
   private static readonly Func<TaskManagementContext, int, Task<TaskItem>> GetTaskById =
       EF.CompileAsyncQuery((TaskManagementContext context, int id) =>
           context.Tasks.FirstOrDefault(t => t.Id == id));
   ```

### 6. Monitoring and Diagnostics

#### Performance Monitoring
1. **Database Metrics**:
   - Query execution times
   - Connection pool usage
   - Memory consumption

2. **Health Checks**:
   ```csharp
   builder.Services.AddHealthChecks()
       .AddDbContextCheck<TaskManagementContext>();
   ```

3. **Logging**:
   Enhanced database query logging for performance analysis

### 7. High Availability and Scalability

#### Read Replicas
For production environments:
1. **Read-Only Replicas**:
   - Configure read replicas for reporting queries
   - Use read-write connection for transactional operations

2. **Connection Routing**:
   ```csharp
   // Use different connection strings for read/write operations
   public class ReadWriteDbContext : DbContext
   {
       private readonly string _writeConnectionString;
       private readonly string _readConnectionString;
       
       public ReadWriteDbContext(string writeConnectionString, string readConnectionString)
       {
           _writeConnectionString = writeConnectionString;
           _readConnectionString = readConnectionString;
       }
       
       // Implementation for routing read/write operations
   }
   ```

## Implementation Plan

### Phase 1: Immediate Improvements (1-2 weeks)
1. Add SQL Server support
2. Implement connection pooling optimizations
3. Add database health checks
4. Create backup scripts

### Phase 2: Migration and Performance (2-3 weeks)
1. Implement EF Core migrations
2. Add performance monitoring
3. Optimize queries with indexing
4. Implement compiled queries

### Phase 3: Advanced Features (3-4 weeks)
1. Implement read replicas for production
2. Add automated backup solutions
3. Create comprehensive monitoring dashboard
4. Document all procedures

## Configuration Examples

### appsettings.json
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Data Source=taskmanagement.db",
    "PostgreSQLConnection": "Host=localhost;Database=taskmanagement;Username=postgres;Password=password",
    "SQLServerConnection": "Server=localhost;Database=TaskManagement;Trusted_Connection=true;TrustServerCertificate=true;"
  },
  "DatabaseSettings": {
    "Provider": "SQLite",
    "EnableRetryOnFailure": true,
    "MaxRetryCount": 3,
    "CommandTimeoutSeconds": 30,
    "EnableDetailedErrors": false,
    "EnableSensitiveDataLogging": false
  }
}
```

### docker-compose.yml
```yaml
version: '3.8'
services:
  api:
    # ... existing configuration ...
    environment:
      - DatabaseProvider=PostgreSQL
      - ConnectionStrings__DefaultConnection=Host=postgres;Database=taskmanagement;Username=postgres;Password=password
      - DatabaseSettings__EnableRetryOnFailure=true
      - DatabaseSettings__MaxRetryCount=3
      
  postgres:
    image: postgres:15
    environment:
      - POSTGRES_DB=taskmanagement
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
      
volumes:
  postgres_data:
```

## Benefits of Proposed Improvements

1. **Flexibility**: Support for multiple database providers
2. **Performance**: Optimized connection handling and query execution
3. **Reliability**: Better error handling and retry mechanisms
4. **Maintainability**: Formal migration strategy
5. **Scalability**: Support for high-availability configurations
6. **Observability**: Enhanced monitoring and diagnostics

## Next Steps

1. Implement SQL Server support
2. Create database migration strategy
3. Develop backup and recovery procedures
4. Implement performance monitoring
5. Document all database-related procedures