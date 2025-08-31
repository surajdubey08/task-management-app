using Microsoft.EntityFrameworkCore;
using System.Text.Json;
using TaskManagement.API.Data;
using TaskManagement.API.Models;
using System.Reflection;

namespace TaskManagement.API.Services
{
    public class AuditService : IAuditService
    {
        private readonly TaskManagementContext _context;
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly ILogger<AuditService> _logger;
        private readonly JsonSerializerOptions _jsonOptions;

        public AuditService(
            TaskManagementContext context,
            IHttpContextAccessor httpContextAccessor,
            ILogger<AuditService> logger)
        {
            _context = context;
            _httpContextAccessor = httpContextAccessor;
            _logger = logger;
            
            _jsonOptions = new JsonSerializerOptions
            {
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
                WriteIndented = false,
                DefaultIgnoreCondition = System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull
            };
        }

        public async Task LogAsync(
            string entityType,
            int entityId,
            string action,
            int userId,
            string? summary = null,
            object? oldValues = null,
            object? newValues = null,
            object? changes = null,
            object? additionalData = null)
        {
            try
            {
                var httpContext = _httpContextAccessor.HttpContext;
                
                var auditLog = new AuditLog
                {
                    EntityType = entityType,
                    EntityId = entityId,
                    Action = action,
                    UserId = userId,
                    Summary = summary ?? GenerateSummary(entityType, action),
                    IpAddress = GetClientIpAddress(),
                    UserAgent = httpContext?.Request.Headers[\"User-Agent\"].FirstOrDefault(),
                    RequestPath = httpContext?.Request.Path,
                    HttpMethod = httpContext?.Request.Method,
                    CreatedAt = DateTime.UtcNow
                };
                
                auditLog.SetOldValues(oldValues);
                auditLog.SetNewValues(newValues);
                auditLog.SetChanges(changes);
                auditLog.SetAdditionalData(additionalData);
                
                _context.AuditLogs.Add(auditLog);
                await _context.SaveChangesAsync();
                
                _logger.LogInformation(
                    \"Audit log created: {EntityType}:{EntityId} {Action} by User:{UserId}\",
                    entityType, entityId, action, userId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, \"Failed to create audit log for {EntityType}:{EntityId}\", entityType, entityId);
                // Don't throw - audit logging shouldn't break the main operation
            }
        }

        public async Task LogEntityChangeAsync<T>(
            T oldEntity,
            T newEntity,
            string action,
            int userId,
            string? summary = null) where T : class
        {
            var entityType = typeof(T).Name;
            var entityId = GetEntityId(newEntity ?? oldEntity!);
            
            if (entityId == 0)
            {
                _logger.LogWarning(\"Unable to determine entity ID for audit logging\");
                return;
            }
            
            var changes = action == AuditActions.UPDATE && oldEntity != null && newEntity != null
                ? GetEntityChanges(oldEntity, newEntity)
                : null;
            
            await LogAsync(
                entityType,
                entityId,
                action,
                userId,
                summary,
                oldEntity,
                newEntity,
                changes);
        }

        public async Task LogAuthenticationAsync(
            int userId,
            string action,
            bool success,
            string? failureReason = null)
        {
            var additionalData = new
            {
                Success = success,
                FailureReason = failureReason,
                Timestamp = DateTime.UtcNow
            };
            
            await LogAsync(
                AuditEntities.AUTH,
                userId,
                action,
                userId,
                $\"{action} {(success ? \"successful\" : \"failed\")}\",
                additionalData: additionalData);
        }

        public async Task LogBulkOperationAsync(
            string entityType,
            IEnumerable<int> entityIds,
            string action,
            int userId,
            string? summary = null,
            object? additionalData = null)
        {
            var entityIdsList = entityIds.ToList();
            
            var bulkData = new
            {
                EntityIds = entityIdsList,
                Count = entityIdsList.Count,
                BatchId = Guid.NewGuid().ToString(),
                AdditionalData = additionalData
            };
            
            // Log the bulk operation with the first entity ID as reference
            var primaryEntityId = entityIdsList.FirstOrDefault();
            
            await LogAsync(
                entityType,
                primaryEntityId,
                AuditActions.BULK_UPDATE,
                userId,
                summary ?? $\"Bulk {action.ToLower()} operation on {entityIdsList.Count} {entityType.ToLower()}(s)\",
                additionalData: bulkData);
        }

        public async Task<IEnumerable<AuditLog>> GetEntityAuditTrailAsync(
            string entityType,
            int entityId,
            int pageNumber = 1,
            int pageSize = 20)
        {
            return await _context.AuditLogs
                .Include(a => a.User)
                .Where(a => a.EntityType == entityType && a.EntityId == entityId)
                .OrderByDescending(a => a.CreatedAt)
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .AsNoTracking()
                .ToListAsync();
        }

        public async Task<IEnumerable<AuditLog>> GetUserActivityAsync(
            int userId,
            DateTime? from = null,
            DateTime? to = null,
            int pageNumber = 1,
            int pageSize = 50)
        {
            var query = _context.AuditLogs
                .Include(a => a.User)
                .Where(a => a.UserId == userId);
            
            if (from.HasValue)
                query = query.Where(a => a.CreatedAt >= from.Value);
                
            if (to.HasValue)
                query = query.Where(a => a.CreatedAt <= to.Value);
            
            return await query
                .OrderByDescending(a => a.CreatedAt)
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .AsNoTracking()
                .ToListAsync();
        }

        public async Task<IEnumerable<AuditLog>> SearchAuditLogsAsync(
            string? action = null,
            string? entityType = null,
            int? userId = null,
            DateTime? from = null,
            DateTime? to = null,
            int pageNumber = 1,
            int pageSize = 50)
        {
            var query = _context.AuditLogs
                .Include(a => a.User)
                .AsQueryable();
            
            if (!string.IsNullOrEmpty(action))
                query = query.Where(a => a.Action == action);
                
            if (!string.IsNullOrEmpty(entityType))
                query = query.Where(a => a.EntityType == entityType);
                
            if (userId.HasValue)
                query = query.Where(a => a.UserId == userId.Value);
                
            if (from.HasValue)
                query = query.Where(a => a.CreatedAt >= from.Value);
                
            if (to.HasValue)
                query = query.Where(a => a.CreatedAt <= to.Value);
            
            return await query
                .OrderByDescending(a => a.CreatedAt)
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .AsNoTracking()
                .ToListAsync();
        }

        private string GenerateSummary(string entityType, string action)
        {
            return action switch
            {
                AuditActions.CREATE => $\"Created new {entityType.ToLower()}\",
                AuditActions.UPDATE => $\"Updated {entityType.ToLower()}\",
                AuditActions.DELETE => $\"Deleted {entityType.ToLower()}\",
                AuditActions.VIEW => $\"Viewed {entityType.ToLower()}\",
                _ => $\"{action} performed on {entityType.ToLower()}\"
            };
        }

        private int GetEntityId(object entity)
        {
            var idProperty = entity.GetType().GetProperty(\"Id\");
            if (idProperty != null && idProperty.PropertyType == typeof(int))
            {
                return (int)(idProperty.GetValue(entity) ?? 0);
            }
            return 0;
        }

        private object GetEntityChanges(object oldEntity, object newEntity)
        {
            var changes = new Dictionary<string, object>();
            var type = oldEntity.GetType();
            
            var properties = type.GetProperties(BindingFlags.Public | BindingFlags.Instance)
                .Where(p => p.CanRead && !IsComplexType(p.PropertyType));
            
            foreach (var property in properties)
            {
                var oldValue = property.GetValue(oldEntity);
                var newValue = property.GetValue(newEntity);
                
                if (!Equals(oldValue, newValue))
                {
                    changes[property.Name] = new
                    {
                        Old = oldValue,
                        New = newValue
                    };
                }
            }
            
            return changes;
        }

        private static bool IsComplexType(Type type)
        {
            return type.IsClass && 
                   type != typeof(string) && 
                   !type.IsPrimitive && 
                   !type.IsEnum &&
                   type != typeof(DateTime) &&
                   type != typeof(DateTime?) &&
                   type != typeof(decimal) &&
                   type != typeof(decimal?);
        }

        private string? GetClientIpAddress()
        {
            var httpContext = _httpContextAccessor.HttpContext;
            if (httpContext == null) return null;
            
            var ipAddress = httpContext.Request.Headers[\"X-Forwarded-For\"].FirstOrDefault();
            if (!string.IsNullOrEmpty(ipAddress))
            {
                ipAddress = ipAddress.Split(',')[0].Trim();
            }
            
            ipAddress ??= httpContext.Request.Headers[\"X-Real-IP\"].FirstOrDefault();
            ipAddress ??= httpContext.Connection.RemoteIpAddress?.ToString();
            
            return ipAddress;
        }
    }
}