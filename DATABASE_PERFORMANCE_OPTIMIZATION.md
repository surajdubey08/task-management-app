# Database Performance Optimization Guide for TaskFlow Application

## Overview

This document provides guidelines and best practices for optimizing database performance in the TaskFlow application. It covers indexing strategies, query optimization, connection management, and monitoring techniques.

## Indexing Strategy

### Current Indexes

The application currently has basic indexes defined in the `OnModelCreating` method:

```csharp
// User email index
entity.HasIndex(e => e.Email).IsUnique();

// AuditLog indexes
entity.HasIndex(e => new { e.EntityType, e.EntityId });
entity.HasIndex(e => e.UserId);
entity.HasIndex(e => e.Action);
entity.HasIndex(e => e.CreatedAt);
```

### Recommended Additional Indexes

#### 1. TaskItem Indexes
```csharp
// In TaskManagementContext.cs > OnModelCreating
modelBuilder.Entity<TaskItem>(entity =>
{
    // Existing configuration...
    
    // Performance indexes
    entity.HasIndex(e => e.Status);
    entity.HasIndex(e => e.Priority);
    entity.HasIndex(e => e.DueDate);
    entity.HasIndex(e => new { e.UserId, e.Status });
    entity.HasIndex(e => new { e.CategoryId, e.Status });
    entity.HasIndex(e => e.CreatedAt);
});
```

#### 2. User Indexes
```csharp
modelBuilder.Entity<User>(entity =>
{
    // Existing configuration...
    
    // Performance indexes
    entity.HasIndex(e => e.Status);
    entity.HasIndex(e => e.Role);
    entity.HasIndex(e => new { e.Status, e.Role });
    entity.HasIndex(e => e.Department);
    entity.HasIndex(e => e.CreatedAt);
});
```

#### 3. Category Indexes
```csharp
modelBuilder.Entity<Category>(entity =>
{
    // Existing configuration...
    
    // Performance indexes
    entity.HasIndex(e => e.IsActive);
    entity.HasIndex(e => e.CreatedAt);
});
```

### Index Maintenance

#### Monitoring Index Usage
```sql
-- PostgreSQL: Check index usage
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_tup_read,
    idx_tup_fetch
FROM pg_stat_user_indexes
WHERE tablename = 'tasks';

-- SQL Server: Check index usage
SELECT 
    OBJECT_NAME(s.object_id) AS table_name,
    i.name AS index_name,
    user_seeks,
    user_scans,
    user_lookups,
    user_updates
FROM sys.dm_db_index_usage_stats s
INNER JOIN sys.indexes i ON s.object_id = i.object_id AND s.index_id = i.index_id
WHERE OBJECT_NAME(s.object_id) = 'Tasks';
```

#### Removing Unused Indexes
Regularly review and remove unused indexes to reduce write overhead:

```sql
-- PostgreSQL: Find unused indexes
SELECT 
    schemaname,
    tablename,
    indexname,
    pg_size_pretty(pg_relation_size(indexrelid)) AS index_size
FROM pg_stat_user_indexes
WHERE idx_scan = 0 AND idx_tup_read = 0 AND idx_tup_fetch = 0;
```

## Query Optimization

### 1. Eager Loading vs Lazy Loading

#### Current Implementation
The application uses lazy loading proxies:
```csharp
options.UseLazyLoadingProxies();
```

#### Optimized Approach
Use explicit eager loading for known query patterns:

```csharp
// Instead of lazy loading, use Include for related data
var tasks = await context.Tasks
    .Include(t => t.User)
    .Include(t => t.Category)
    .Where(t => t.Status == TaskStatus.Pending)
    .ToListAsync();

// For complex queries, use projection to avoid loading unnecessary data
var taskSummaries = await context.Tasks
    .Where(t => t.Status == TaskStatus.Pending)
    .Select(t => new TaskSummaryDto
    {
        Id = t.Id,
        Title = t.Title,
        UserName = t.User.Name,
        CategoryName = t.Category.Name,
        DueDate = t.DueDate
    })
    .ToListAsync();
```

### 2. Query Splitting

For complex queries with multiple includes, use query splitting to avoid Cartesian product issues:

```csharp
// Use AsSplitQuery for complex includes
var tasks = await context.Tasks
    .Include(t => t.User)
    .Include(t => t.Category)
    .Include(t => t.Comments)
        .ThenInclude(c => c.User)
    .AsSplitQuery()
    .ToListAsync();
```

### 3. Compiled Queries

For frequently executed queries, use compiled queries for better performance:

```csharp
public class TaskRepository
{
    private static readonly Func<TaskManagementContext, int, Task<TaskItem>> GetTaskById =
        EF.CompileAsyncQuery((TaskManagementContext context, int id) =>
            context.Tasks
                .Include(t => t.User)
                .Include(t => t.Category)
                .FirstOrDefault(t => t.Id == id));

    public async Task<TaskItem?> GetByIdAsync(int id)
    {
        return await GetTaskById(_context, id);
    }
}
```

### 4. Pagination Optimization

Implement efficient pagination with proper indexing:

```csharp
public async Task<PagedResult<TaskItem>> GetTasksAsync(
    int page = 1, 
    int pageSize = 20, 
    TaskStatus? status = null)
{
    var query = _context.Tasks.AsQueryable();
    
    if (status.HasValue)
    {
        query = query.Where(t => t.Status == status.Value);
    }
    
    // Use keyset pagination for better performance on large datasets
    var tasks = await query
        .OrderByDescending(t => t.CreatedAt)
        .Skip((page - 1) * pageSize)
        .Take(pageSize)
        .ToListAsync();
        
    var totalCount = await query.CountAsync();
    
    return new PagedResult<TaskItem>
    {
        Items = tasks,
        TotalCount = totalCount,
        Page = page,
        PageSize = pageSize
    };
}
```

## Connection Management

### 1. Connection Pooling Configuration

#### PostgreSQL Connection Pooling
```csharp
// In Program.cs
if (databaseProvider.Equals("PostgreSQL", StringComparison.OrdinalIgnoreCase))
{
    options.UseNpgsql(connectionString, npgsqlOptions =>
    {
        npgsqlOptions.CommandTimeout(30);
        // Connection pooling settings
        npgsqlOptions.MinPoolSize(5);
        npgsqlOptions.MaxPoolSize(100);
        npgsqlOptions.ConnectionIdleLifetime(TimeSpan.FromMinutes(5));
        npgsqlOptions.EnableRetryOnFailure(3);
    });
}
```

#### SQL Server Connection Pooling
```csharp
else if (databaseProvider.Equals("SQLServer", StringComparison.OrdinalIgnoreCase))
{
    options.UseSqlServer(connectionString, sqlOptions =>
    {
        sqlOptions.CommandTimeout(30);
        sqlOptions.UseQuerySplittingBehavior(QuerySplittingBehavior.SplitQuery);
        // Connection pooling settings
        sqlOptions.MinPoolSize(5);
        sqlOptions.MaxPoolSize(100);
        sqlOptions.EnableRetryOnFailure(3);
    });
}
```

### 2. Connection Monitoring

Add middleware to monitor connection pool usage:

```csharp
public class DatabaseMetricsMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<DatabaseMetricsMiddleware> _logger;

    public DatabaseMetricsMiddleware(RequestDelegate next, ILogger<DatabaseMetricsMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context, TaskManagementContext dbContext)
    {
        // Log connection pool metrics
        var startTime = DateTime.UtcNow;
        
        await _next(context);
        
        var endTime = DateTime.UtcNow;
        _logger.LogInformation("Request completed in {Duration}ms", (endTime - startTime).TotalMilliseconds);
    }
}
```

## Caching Strategy

### 1. Redis Caching Integration

The application already has Redis caching configured. Optimize cache usage:

```csharp
public class CachedTaskRepository : ITaskRepository
{
    private readonly TaskRepository _baseRepository;
    private readonly ICacheService _cache;
    private readonly ILogger<CachedTaskRepository> _logger;

    public CachedTaskRepository(TaskRepository baseRepository, ICacheService cache, ILogger<CachedTaskRepository> logger)
    {
        _baseRepository = baseRepository;
        _cache = cache;
        _logger = logger;
    }

    public async Task<IEnumerable<TaskItem>> GetByUserIdAsync(int userId)
    {
        var cacheKey = $"tasks:user:{userId}";
        var cachedTasks = await _cache.GetAsync<IEnumerable<TaskItem>>(cacheKey);
        
        if (cachedTasks != null)
        {
            _logger.LogDebug("Cache hit for user tasks: {UserId}", userId);
            return cachedTasks;
        }

        var tasks = await _baseRepository.GetByUserIdAsync(userId);
        await _cache.SetAsync(cacheKey, tasks, TimeSpan.FromMinutes(10));
        
        return tasks;
    }
}
```

### 2. Cache Invalidation Strategy

Implement proper cache invalidation:

```csharp
public async Task<TaskItem> UpdateAsync(TaskItem task)
{
    // Update database
    var updatedTask = await _baseRepository.UpdateAsync(task);
    
    // Invalidate related caches
    var cacheKeys = new[]
    {
        $"tasks:user:{task.UserId}",
        $"tasks:category:{task.CategoryId}",
        $"task:{task.Id}"
    };
    
    foreach (var key in cacheKeys)
    {
        await _cache.RemoveAsync(key);
    }
    
    return updatedTask;
}
```

## Monitoring and Diagnostics

### 1. Query Performance Monitoring

Enable detailed query logging in development:

```csharp
// In Program.cs - Development environment
if (builder.Environment.IsDevelopment())
{
    options.EnableSensitiveDataLogging(true);
    options.EnableDetailedErrors(true);
    // Log all queries
    options.LogTo(Console.WriteLine, LogLevel.Information);
}
```

### 2. Custom Performance Metrics

Add performance tracking to repository methods:

```csharp
public async Task<IEnumerable<TaskItem>> GetPendingTasksAsync()
{
    using var activity = _metrics.StartActivity("GetPendingTasks");
    var startTime = Stopwatch.StartNew();
    
    try
    {
        var tasks = await _context.Tasks
            .Where(t => t.Status == TaskStatus.Pending)
            .ToListAsync();
            
        _metrics.RecordQueryDuration("GetPendingTasks", startTime.ElapsedMilliseconds);
        return tasks;
    }
    catch (Exception ex)
    {
        _metrics.RecordQueryError("GetPendingTasks", ex);
        throw;
    }
}
```

### 3. Health Checks

Add database-specific health checks:

```csharp
// In Program.cs
builder.Services.AddHealthChecks()
    .AddDbContextCheck<TaskManagementContext>(
        "Database",
        failureStatus: HealthStatus.Degraded,
        tags: new[] { "database", "ready" })
    .AddCheck<DatabasePerformanceHealthCheck>(
        "DatabasePerformance",
        failureStatus: HealthStatus.Degraded,
        tags: new[] { "database", "performance" });
```

Custom health check implementation:

```csharp
public class DatabasePerformanceHealthCheck : IHealthCheck
{
    private readonly TaskManagementContext _context;
    private readonly ILogger<DatabasePerformanceHealthCheck> _logger;

    public DatabasePerformanceHealthCheck(TaskManagementContext context, ILogger<DatabasePerformanceHealthCheck> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<HealthCheckResult> CheckHealthAsync(HealthCheckContext context, CancellationToken cancellationToken = default)
    {
        try
        {
            var startTime = Stopwatch.StartNew();
            await _context.Tasks.FirstOrDefaultAsync(cancellationToken);
            var responseTime = startTime.ElapsedMilliseconds;

            if (responseTime > 1000) // 1 second threshold
            {
                return HealthCheckResult.Degraded($"Database response time is {responseTime}ms");
            }

            return HealthCheckResult.Healthy($"Database response time is {responseTime}ms");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Database health check failed");
            return HealthCheckResult.Unhealthy("Database health check failed", ex);
        }
    }
}
```

## Database-Specific Optimizations

### 1. SQLite Optimizations

For development environments using SQLite:

```csharp
// In Program.cs
else
{
    options.UseSqlite(connectionString, sqliteOptions =>
    {
        sqliteOptions.CommandTimeout(30);
        // SQLite-specific optimizations
        sqliteOptions.UseQuerySplittingBehavior(QuerySplittingBehavior.SplitQuery);
    });
    
    // SQLite connection string optimizations
    // Add to connection string: "Cache=Shared;Synchronous=Normal;Journal Mode=Wal;"
}
```

### 2. PostgreSQL Optimizations

```sql
-- Create partial indexes for common queries
CREATE INDEX idx_tasks_status_pending ON tasks (created_at) WHERE status = 'Pending';
CREATE INDEX idx_tasks_user_status ON tasks (user_id) WHERE status IN ('Pending', 'InProgress');

-- Analyze table statistics regularly
ANALYZE tasks;
ANALYZE users;
ANALYZE categories;
```

### 3. SQL Server Optimizations

```sql
-- Create filtered indexes
CREATE NONCLUSTERED INDEX IX_Tasks_Status_Pending 
ON Tasks (CreatedDate) 
WHERE Status = 1; -- Assuming 1 = Pending

-- Update statistics regularly
UPDATE STATISTICS Tasks;
UPDATE STATISTICS Users;
UPDATE STATISTICS Categories;
```

## Performance Testing

### 1. Load Testing Script

Create a simple load testing script:

```csharp
public class DatabaseLoadTest
{
    public async Task RunLoadTest(TaskManagementContext context, int numberOfRequests = 1000)
    {
        var tasks = new List<Task>();
        var stopwatch = Stopwatch.StartNew();

        for (int i = 0; i < numberOfRequests; i++)
        {
            tasks.Add(ExecuteTestQuery(context, i));
        }

        await Task.WhenAll(tasks);
        stopwatch.Stop();

        Console.WriteLine($"Executed {numberOfRequests} requests in {stopwatch.ElapsedMilliseconds}ms");
        Console.WriteLine($"Average: {stopwatch.ElapsedMilliseconds / (double)numberOfRequests}ms per request");
    }

    private async Task ExecuteTestQuery(TaskManagementContext context, int requestId)
    {
        // Simulate common query patterns
        var random = new Random(requestId);
        var userId = random.Next(1, 100);
        
        await context.Tasks
            .Where(t => t.UserId == userId && t.Status == TaskStatus.Pending)
            .Include(t => t.Category)
            .ToListAsync();
    }
}
```

## Best Practices Summary

### 1. Indexing
- Create indexes on frequently queried columns
- Use composite indexes for multi-column queries
- Regularly review and remove unused indexes
- Consider partial/filtered indexes for specific query patterns

### 2. Query Optimization
- Use eager loading instead of lazy loading when possible
- Implement query splitting for complex includes
- Use compiled queries for frequently executed queries
- Implement proper pagination for large datasets

### 3. Connection Management
- Configure appropriate connection pool sizes
- Implement retry logic for transient failures
- Monitor connection pool usage
- Use connection timeouts appropriately

### 4. Caching
- Implement multi-level caching (Redis + in-memory)
- Use appropriate cache expiration policies
- Implement cache invalidation strategies
- Monitor cache hit ratios

### 5. Monitoring
- Enable query logging in development
- Implement custom performance metrics
- Add database health checks
- Monitor query response times

## Conclusion

By implementing these database performance optimization strategies, the TaskFlow application can achieve better response times, handle higher loads, and provide a smoother user experience. Regular monitoring and performance testing should be part of the ongoing maintenance process to ensure optimal database performance.