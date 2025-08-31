using TaskManagement.API.Models;
using Microsoft.AspNetCore.Http;

namespace TaskManagement.API.Services
{
    public interface IAuditService
    {
        Task LogAsync(
            string entityType,
            int entityId,
            string action,
            int userId,
            string? summary = null,
            object? oldValues = null,
            object? newValues = null,
            object? changes = null,
            object? additionalData = null);
            
        Task LogEntityChangeAsync<T>(
            T oldEntity,
            T newEntity,
            string action,
            int userId,
            string? summary = null) where T : class;
            
        Task LogAuthenticationAsync(
            int userId,
            string action,
            bool success,
            string? failureReason = null);
            
        Task LogBulkOperationAsync(
            string entityType,
            IEnumerable<int> entityIds,
            string action,
            int userId,
            string? summary = null,
            object? additionalData = null);
            
        Task<IEnumerable<AuditLog>> GetEntityAuditTrailAsync(
            string entityType,
            int entityId,
            int pageNumber = 1,
            int pageSize = 20);
            
        Task<IEnumerable<AuditLog>> GetUserActivityAsync(
            int userId,
            DateTime? from = null,
            DateTime? to = null,
            int pageNumber = 1,
            int pageSize = 50);
            
        Task<IEnumerable<AuditLog>> SearchAuditLogsAsync(
            string? action = null,
            string? entityType = null,
            int? userId = null,
            DateTime? from = null,
            DateTime? to = null,
            int pageNumber = 1,
            int pageSize = 50);
    }
}