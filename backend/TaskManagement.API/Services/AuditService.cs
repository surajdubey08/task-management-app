using System.Text.Json;
using AutoMapper;
using Microsoft.EntityFrameworkCore;
using TaskManagement.API.Data;
using TaskManagement.API.Models;

namespace TaskManagement.API.Services
{
    /// <summary>
    /// Interface for audit service
    /// </summary>
    public interface IAuditService
    {
        Task<AuditLogDto> CreateAuditLogAsync(CreateAuditLogDto auditLogDto, CancellationToken cancellationToken = default);
        Task<IEnumerable<AuditLogDto>> GetAuditLogsAsync(AuditSearchDto searchDto, CancellationToken cancellationToken = default);
        Task<AuditLogDto?> GetAuditLogByIdAsync(int id, CancellationToken cancellationToken = default);
        Task<IEnumerable<AuditLogDto>> GetAuditTrailAsync(string entityType, string entityId, CancellationToken cancellationToken = default);
        Task<UserActivityDto> GetUserActivityAsync(int userId, DateTime? startDate = null, DateTime? endDate = null, CancellationToken cancellationToken = default);
        Task<AuditStatisticsDto> GetStatisticsAsync(DateTime? startDate = null, DateTime? endDate = null, CancellationToken cancellationToken = default);
        Task<IEnumerable<AuditLogDto>> GetRecentActivitiesAsync(int count = 50, CancellationToken cancellationToken = default);
        Task<string> ExportAuditLogsAsync(AuditSearchDto searchDto, CancellationToken cancellationToken = default);
        Task DeleteOldAuditLogsAsync(DateTime cutoffDate, CancellationToken cancellationToken = default);
        
        // Helper methods for common audit scenarios
        Task LogAsync(string entityType, object entityId, string action, int? userId, string summary, object? oldValues = null, object? newValues = null, CancellationToken cancellationToken = default);
        Task LogEntityCreatedAsync(string entityType, string entityId, int? userId, object? details = null, CancellationToken cancellationToken = default);
        Task LogEntityUpdatedAsync(string entityType, string entityId, int? userId, object? oldValues = null, object? newValues = null, CancellationToken cancellationToken = default);
        Task LogEntityDeletedAsync(string entityType, string entityId, int? userId, object? details = null, CancellationToken cancellationToken = default);
        Task LogUserActionAsync(string action, int? userId, string? details = null, CancellationToken cancellationToken = default);
    }

    /// <summary>
    /// Audit service implementation
    /// </summary>
    public class AuditService : IAuditService
    {
        private readonly TaskManagementContext _context;
        private readonly IMapper _mapper;
        private readonly ILogger<AuditService> _logger;
        private readonly ICacheService _cacheService;

        public AuditService(
            TaskManagementContext context,
            IMapper mapper,
            ILogger<AuditService> logger,
            ICacheService cacheService)
        {
            _context = context;
            _mapper = mapper;
            _logger = logger;
            _cacheService = cacheService;
        }

        public async Task<AuditLogDto> CreateAuditLogAsync(CreateAuditLogDto auditLogDto, CancellationToken cancellationToken = default)
        {
            try
            {
                var auditLog = _mapper.Map<AuditLog>(auditLogDto);
                auditLog.CreatedAt = DateTime.UtcNow;

                _context.AuditLogs.Add(auditLog);
                await _context.SaveChangesAsync(cancellationToken);

                var result = _mapper.Map<AuditLogDto>(auditLog);
                
                // Include user information if available
                if (auditLog.UserId.HasValue)
                {
                    var user = await _context.Users
                        .FirstOrDefaultAsync(u => u.Id == auditLog.UserId.Value, cancellationToken);
                    if (user != null)
                    {
                        result.UserName = user.Name;
                        result.UserEmail = user.Email;
                    }
                }

                _logger.LogDebug("Audit log created: {EntityType}:{EntityId} - {Action} by User {UserId}",
                    auditLog.EntityType, auditLog.EntityId, auditLog.Action, auditLog.UserId);

                // Invalidate cache
                await _cacheService.RemoveByPatternAsync("audit:*", cancellationToken);

                return result;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating audit log for {EntityType}:{EntityId}",
                    auditLogDto.EntityType, auditLogDto.EntityId);
                throw;
            }
        }

        public async Task<IEnumerable<AuditLogDto>> GetAuditLogsAsync(AuditSearchDto searchDto, CancellationToken cancellationToken = default)
        {
            try
            {
                var cacheKey = GenerateCacheKey("search", searchDto);
                var cached = await _cacheService.GetAsync<IEnumerable<AuditLogDto>>(cacheKey, cancellationToken);
                if (cached != null)
                    return cached;

                var query = _context.AuditLogs
                    .Include(a => a.User)
                    .AsQueryable();

                // Apply filters
                if (!string.IsNullOrEmpty(searchDto.EntityType))
                    query = query.Where(a => a.EntityType == searchDto.EntityType);

                if (!string.IsNullOrEmpty(searchDto.EntityId))
                    query = query.Where(a => a.EntityId == searchDto.EntityId);

                if (!string.IsNullOrEmpty(searchDto.Action))
                    query = query.Where(a => a.Action == searchDto.Action);

                if (searchDto.UserId.HasValue)
                    query = query.Where(a => a.UserId == searchDto.UserId.Value);

                if (!string.IsNullOrEmpty(searchDto.IpAddress))
                    query = query.Where(a => a.IpAddress == searchDto.IpAddress);

                if (searchDto.StartDate.HasValue)
                    query = query.Where(a => a.CreatedAt >= searchDto.StartDate.Value);

                if (searchDto.EndDate.HasValue)
                    query = query.Where(a => a.CreatedAt <= searchDto.EndDate.Value);

                if (!string.IsNullOrEmpty(searchDto.SearchTerm))
                {
                    var term = searchDto.SearchTerm.ToLower();
                    query = query.Where(a => 
                        a.Summary.ToLower().Contains(term) ||
                        a.Details != null && a.Details.ToLower().Contains(term) ||
                        a.User != null && (a.User.Name.ToLower().Contains(term) || a.User.Email.ToLower().Contains(term)));
                }

                // Apply sorting
                query = searchDto.SortDirection.ToLower() == "asc" ? 
                    ApplySortingAscending(query, searchDto.SortBy) :
                    ApplySortingDescending(query, searchDto.SortBy);

                // Apply pagination
                var result = await query
                    .Skip((searchDto.Page - 1) * searchDto.PageSize)
                    .Take(searchDto.PageSize)
                    .Select(a => new AuditLogDto
                    {
                        Id = a.Id,
                        EntityType = a.EntityType,
                        EntityId = a.EntityId,
                        Action = a.Action,
                        UserId = a.UserId,
                        UserName = a.User != null ? a.User.Name : null,
                        UserEmail = a.User != null ? a.User.Email : null,
                        Summary = a.Summary,
                        Details = a.Details,
                        IpAddress = a.IpAddress,
                        UserAgent = a.UserAgent,
                        RequestPath = a.RequestPath,
                        HttpMethod = a.HttpMethod,
                        ResponseStatusCode = a.ResponseStatusCode,
                        ExecutionTimeMs = a.ExecutionTimeMs,
                        CreatedAt = a.CreatedAt,
                        Metadata = a.Metadata
                    })
                    .ToListAsync(cancellationToken);

                await _cacheService.SetAsync(cacheKey, result, TimeSpan.FromMinutes(5), cancellationToken);
                return result;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting audit logs");
                throw;
            }
        }

        public async Task<AuditLogDto?> GetAuditLogByIdAsync(int id, CancellationToken cancellationToken = default)
        {
            try
            {
                var cacheKey = $"audit:log:{id}";
                var cached = await _cacheService.GetAsync<AuditLogDto>(cacheKey, cancellationToken);
                if (cached != null)
                    return cached;

                var auditLog = await _context.AuditLogs
                    .Include(a => a.User)
                    .FirstOrDefaultAsync(a => a.Id == id, cancellationToken);

                if (auditLog == null)
                    return null;

                var result = _mapper.Map<AuditLogDto>(auditLog);
                if (auditLog.User != null)
                {
                    result.UserName = auditLog.User.Name;
                    result.UserEmail = auditLog.User.Email;
                }

                await _cacheService.SetAsync(cacheKey, result, TimeSpan.FromHours(1), cancellationToken);
                return result;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting audit log by ID: {Id}", id);
                throw;
            }
        }

        public async Task<IEnumerable<AuditLogDto>> GetAuditTrailAsync(string entityType, string entityId, CancellationToken cancellationToken = default)
        {
            try
            {
                var cacheKey = $"audit:trail:{entityType}:{entityId}";
                var cached = await _cacheService.GetAsync<IEnumerable<AuditLogDto>>(cacheKey, cancellationToken);
                if (cached != null)
                    return cached;

                var auditLogs = await _context.AuditLogs
                    .Include(a => a.User)
                    .Where(a => a.EntityType == entityType && a.EntityId == entityId)
                    .OrderByDescending(a => a.CreatedAt)
                    .Select(a => new AuditLogDto
                    {
                        Id = a.Id,
                        EntityType = a.EntityType,
                        EntityId = a.EntityId,
                        Action = a.Action,
                        UserId = a.UserId,
                        UserName = a.User != null ? a.User.Name : null,
                        UserEmail = a.User != null ? a.User.Email : null,
                        Summary = a.Summary,
                        Details = a.Details,
                        IpAddress = a.IpAddress,
                        UserAgent = a.UserAgent,
                        RequestPath = a.RequestPath,
                        HttpMethod = a.HttpMethod,
                        ResponseStatusCode = a.ResponseStatusCode,
                        ExecutionTimeMs = a.ExecutionTimeMs,
                        CreatedAt = a.CreatedAt,
                        Metadata = a.Metadata
                    })
                    .ToListAsync(cancellationToken);

                await _cacheService.SetAsync(cacheKey, auditLogs, TimeSpan.FromMinutes(15), cancellationToken);
                return auditLogs;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting audit trail for {EntityType}:{EntityId}", entityType, entityId);
                throw;
            }
        }

        public async Task<UserActivityDto> GetUserActivityAsync(int userId, DateTime? startDate = null, DateTime? endDate = null, CancellationToken cancellationToken = default)
        {
            try
            {
                var cacheKey = $"audit:user:{userId}:activity:{startDate?.ToString("yyyyMMdd")}:{endDate?.ToString("yyyyMMdd")}";
                var cached = await _cacheService.GetAsync<UserActivityDto>(cacheKey, cancellationToken);
                if (cached != null)
                    return cached;

                var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId, cancellationToken);
                if (user == null)
                    throw new ArgumentException($"User with ID {userId} not found");

                var query = _context.AuditLogs.Where(a => a.UserId == userId);

                if (startDate.HasValue)
                    query = query.Where(a => a.CreatedAt >= startDate.Value);

                if (endDate.HasValue)
                    query = query.Where(a => a.CreatedAt <= endDate.Value);

                var auditLogs = await query
                    .OrderByDescending(a => a.CreatedAt)
                    .ToListAsync(cancellationToken);

                var result = new UserActivityDto
                {
                    UserId = userId,
                    UserName = user.Name,
                    UserEmail = user.Email,
                    TotalActions = auditLogs.Count,
                    LastActivity = auditLogs.FirstOrDefault()?.CreatedAt,
                    ActionBreakdown = auditLogs
                        .GroupBy(a => a.Action)
                        .ToDictionary(g => g.Key, g => g.Count()),
                    RecentActions = auditLogs
                        .Take(10)
                        .Select(a => _mapper.Map<AuditLogDto>(a))
                        .ToList()
                };

                await _cacheService.SetAsync(cacheKey, result, TimeSpan.FromMinutes(30), cancellationToken);
                return result;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting user activity for UserId:{UserId}", userId);
                throw;
            }
        }

        public async Task<AuditStatisticsDto> GetStatisticsAsync(DateTime? startDate = null, DateTime? endDate = null, CancellationToken cancellationToken = default)
        {
            try
            {
                var cacheKey = $"audit:stats:{startDate?.ToString("yyyyMMdd")}:{endDate?.ToString("yyyyMMdd")}";
                var cached = await _cacheService.GetAsync<AuditStatisticsDto>(cacheKey, cancellationToken);
                if (cached != null)
                    return cached;

                var query = _context.AuditLogs.AsQueryable();

                if (startDate.HasValue)
                    query = query.Where(a => a.CreatedAt >= startDate.Value);

                if (endDate.HasValue)
                    query = query.Where(a => a.CreatedAt <= endDate.Value);

                var logs = await query.ToListAsync(cancellationToken);
                var now = DateTime.UtcNow;

                var result = new AuditStatisticsDto
                {
                    TotalLogs = logs.Count,
                    LogsToday = logs.Count(a => a.CreatedAt.Date == now.Date),
                    LogsThisWeek = logs.Count(a => a.CreatedAt >= now.AddDays(-7)),
                    LogsThisMonth = logs.Count(a => a.CreatedAt >= now.AddDays(-30)),
                    ActionCounts = logs
                        .GroupBy(a => a.Action)
                        .ToDictionary(g => g.Key, g => g.Count()),
                    EntityTypeCounts = logs
                        .GroupBy(a => a.EntityType)
                        .ToDictionary(g => g.Key, g => g.Count()),
                    UserActivityCounts = logs
                        .Where(a => a.UserId.HasValue)
                        .GroupBy(a => a.UserId!.Value)
                        .ToDictionary(g => g.Key.ToString(), g => g.Count()),
                    DailyActivityCounts = logs
                        .GroupBy(a => a.CreatedAt.Date)
                        .OrderBy(g => g.Key)
                        .ToDictionary(g => g.Key.ToString("yyyy-MM-dd"), g => g.Count())
                };

                await _cacheService.SetAsync(cacheKey, result, TimeSpan.FromMinutes(15), cancellationToken);
                return result;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting audit statistics");
                throw;
            }
        }

        public async Task<IEnumerable<AuditLogDto>> GetRecentActivitiesAsync(int count = 50, CancellationToken cancellationToken = default)
        {
            try
            {
                var cacheKey = $"audit:recent:{count}";
                var cached = await _cacheService.GetAsync<IEnumerable<AuditLogDto>>(cacheKey, cancellationToken);
                if (cached != null)
                    return cached;

                var auditLogs = await _context.AuditLogs
                    .Include(a => a.User)
                    .OrderByDescending(a => a.CreatedAt)
                    .Take(count)
                    .Select(a => new AuditLogDto
                    {
                        Id = a.Id,
                        EntityType = a.EntityType,
                        EntityId = a.EntityId,
                        Action = a.Action,
                        UserId = a.UserId,
                        UserName = a.User != null ? a.User.Name : null,
                        UserEmail = a.User != null ? a.User.Email : null,
                        Summary = a.Summary,
                        Details = a.Details,
                        IpAddress = a.IpAddress,
                        CreatedAt = a.CreatedAt
                    })
                    .ToListAsync(cancellationToken);

                await _cacheService.SetAsync(cacheKey, auditLogs, TimeSpan.FromMinutes(5), cancellationToken);
                return auditLogs;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting recent audit activities");
                throw;
            }
        }

        public async Task<string> ExportAuditLogsAsync(AuditSearchDto searchDto, CancellationToken cancellationToken = default)
        {
            try
            {
                var auditLogs = await GetAuditLogsAsync(searchDto, cancellationToken);
                return GenerateCsvContent(auditLogs);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error exporting audit logs");
                throw;
            }
        }

        public async Task DeleteOldAuditLogsAsync(DateTime cutoffDate, CancellationToken cancellationToken = default)
        {
            try
            {
                var oldLogs = await _context.AuditLogs
                    .Where(a => a.CreatedAt < cutoffDate)
                    .ToListAsync(cancellationToken);

                _context.AuditLogs.RemoveRange(oldLogs);
                await _context.SaveChangesAsync(cancellationToken);

                _logger.LogInformation("Deleted {Count} old audit logs before {CutoffDate}", 
                    oldLogs.Count, cutoffDate);

                // Clear cache
                await _cacheService.RemoveByPatternAsync("audit:*", cancellationToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting old audit logs");
                throw;
            }
        }

        #region Helper Methods

        public async Task LogEntityCreatedAsync(string entityType, string entityId, int? userId, object? details = null, CancellationToken cancellationToken = default)
        {
            await CreateAuditLogAsync(new CreateAuditLogDto
            {
                EntityType = entityType,
                EntityId = entityId,
                Action = "Create",
                UserId = userId,
                Summary = $"{entityType} created",
                Details = details != null ? JsonSerializer.Serialize(details) : null
            }, cancellationToken);
        }

        public async Task LogEntityUpdatedAsync(string entityType, string entityId, int? userId, object? oldValues = null, object? newValues = null, CancellationToken cancellationToken = default)
        {
            var details = new { OldValues = oldValues, NewValues = newValues };
            await CreateAuditLogAsync(new CreateAuditLogDto
            {
                EntityType = entityType,
                EntityId = entityId,
                Action = "Update",
                UserId = userId,
                Summary = $"{entityType} updated",
                Details = JsonSerializer.Serialize(details)
            }, cancellationToken);
        }

        public async Task LogEntityDeletedAsync(string entityType, string entityId, int? userId, object? details = null, CancellationToken cancellationToken = default)
        {
            await CreateAuditLogAsync(new CreateAuditLogDto
            {
                EntityType = entityType,
                EntityId = entityId,
                Action = "Delete",
                UserId = userId,
                Summary = $"{entityType} deleted",
                Details = details != null ? JsonSerializer.Serialize(details) : null
            }, cancellationToken);
        }

        public async Task LogUserActionAsync(string action, int? userId, string? details = null, CancellationToken cancellationToken = default)
        {
            await CreateAuditLogAsync(new CreateAuditLogDto
            {
                EntityType = "User",
                EntityId = userId?.ToString() ?? "Anonymous",
                Action = action,
                UserId = userId,
                Summary = $"User {action}",
                Details = details
            }, cancellationToken);
        }

        private IQueryable<AuditLog> ApplySortingAscending(IQueryable<AuditLog> query, string sortBy)
        {
            return sortBy.ToLower() switch
            {
                "entitytype" => query.OrderBy(a => a.EntityType),
                "action" => query.OrderBy(a => a.Action),
                "userid" => query.OrderBy(a => a.UserId),
                "createdat" => query.OrderBy(a => a.CreatedAt),
                _ => query.OrderBy(a => a.CreatedAt)
            };
        }

        private IQueryable<AuditLog> ApplySortingDescending(IQueryable<AuditLog> query, string sortBy)
        {
            return sortBy.ToLower() switch
            {
                "entitytype" => query.OrderByDescending(a => a.EntityType),
                "action" => query.OrderByDescending(a => a.Action),
                "userid" => query.OrderByDescending(a => a.UserId),
                "createdat" => query.OrderByDescending(a => a.CreatedAt),
                _ => query.OrderByDescending(a => a.CreatedAt)
            };
        }

        private string GenerateCacheKey(string operation, object parameters)
        {
            var serialized = JsonSerializer.Serialize(parameters);
            var hash = serialized.GetHashCode();
            return $"audit:{operation}:{hash}";
        }

        private string GenerateCsvContent(IEnumerable<AuditLogDto> auditLogs)
        {
            var csv = new System.Text.StringBuilder();
            csv.AppendLine("Id,EntityType,EntityId,Action,UserId,UserName,UserEmail,Summary,IpAddress,RequestPath,HttpMethod,ResponseStatusCode,ExecutionTimeMs,CreatedAt");

            foreach (var log in auditLogs)
            {
                csv.AppendLine($"{log.Id}," +
                    $"{EscapeCsv(log.EntityType)}," +
                    $"{log.EntityId}," +
                    $"{EscapeCsv(log.Action)}," +
                    $"{log.UserId}," +
                    $"{EscapeCsv(log.UserName)}," +
                    $"{EscapeCsv(log.UserEmail)}," +
                    $"{EscapeCsv(log.Summary)}," +
                    $"{EscapeCsv(log.IpAddress)}," +
                    $"{EscapeCsv(log.RequestPath)}," +
                    $"{EscapeCsv(log.HttpMethod)}," +
                    $"{log.ResponseStatusCode}," +
                    $"{log.ExecutionTimeMs}," +
                    $"{log.CreatedAt:yyyy-MM-dd HH:mm:ss}");
            }

            return csv.ToString();
        }

        private string EscapeCsv(string? value)
        {
            if (string.IsNullOrEmpty(value)) 
                return "";

            if (value.Contains(',') || value.Contains('"') || value.Contains('\n'))
            {
                return $"\"{value.Replace("\"", "\"\"")}\"";
            }

            return value;
        }

        #endregion
        
        public async Task LogAsync(string entityType, object entityId, string action, int? userId, string summary, object? oldValues = null, object? newValues = null, CancellationToken cancellationToken = default)
        {
            try
            {
                var auditLogDto = new CreateAuditLogDto
                {
                    EntityType = entityType,
                    EntityId = entityId?.ToString() ?? "",
                    Action = action,
                    UserId = userId,
                    Summary = summary,
                    Details = JsonSerializer.Serialize(new 
                    {
                        OldValues = oldValues,
                        NewValues = newValues
                    }, new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase })
                };

                await CreateAuditLogAsync(auditLogDto, cancellationToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error logging audit entry for {EntityType}:{EntityId}", entityType, entityId);
                // Don't throw - audit logging shouldn't break the main flow
            }
        }
    }
}