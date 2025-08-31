using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using TaskManagement.API.Services;
using TaskManagement.API.Models;

namespace TaskManagement.API.Controllers
{
    [ApiController]
    [Route(\"api/[controller]\")]
    [Authorize(Roles = \"Admin,Manager\")]
    public class AuditController : ControllerBase
    {
        private readonly IAuditService _auditService;
        private readonly ILogger<AuditController> _logger;

        public AuditController(IAuditService auditService, ILogger<AuditController> logger)
        {
            _auditService = auditService;
            _logger = logger;
        }

        /// <summary>
        /// Get audit trail for a specific entity
        /// </summary>
        [HttpGet(\"entity/{entityType}/{entityId}\")]
        public async Task<ActionResult<IEnumerable<AuditLog>>> GetEntityAuditTrail(
            string entityType,
            int entityId,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 20)
        {
            try
            {
                if (pageSize > 100) pageSize = 100;
                
                var auditLogs = await _auditService.GetEntityAuditTrailAsync(
                    entityType, entityId, page, pageSize);
                
                return Ok(auditLogs);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, \"Error getting audit trail for {EntityType}:{EntityId}\", 
                    entityType, entityId);
                return StatusCode(500, \"An error occurred while retrieving audit logs.\");
            }
        }

        /// <summary>
        /// Get user activity logs
        /// </summary>
        [HttpGet(\"user/{userId}/activity\")]
        public async Task<ActionResult<IEnumerable<AuditLog>>> GetUserActivity(
            int userId,
            [FromQuery] DateTime? from = null,
            [FromQuery] DateTime? to = null,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 50)
        {
            try
            {
                if (pageSize > 100) pageSize = 100;
                
                var auditLogs = await _auditService.GetUserActivityAsync(
                    userId, from, to, page, pageSize);
                
                return Ok(auditLogs);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, \"Error getting user activity for UserId:{UserId}\", userId);
                return StatusCode(500, \"An error occurred while retrieving user activity.\");
            }
        }

        /// <summary>
        /// Search audit logs with various filters
        /// </summary>
        [HttpGet(\"search\")]
        public async Task<ActionResult<IEnumerable<AuditLog>>> SearchAuditLogs(
            [FromQuery] string? action = null,
            [FromQuery] string? entityType = null,
            [FromQuery] int? userId = null,
            [FromQuery] DateTime? from = null,
            [FromQuery] DateTime? to = null,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 50)
        {
            try
            {
                if (pageSize > 100) pageSize = 100;
                
                var auditLogs = await _auditService.SearchAuditLogsAsync(
                    action, entityType, userId, from, to, page, pageSize);
                
                return Ok(auditLogs);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, \"Error searching audit logs\");
                return StatusCode(500, \"An error occurred while searching audit logs.\");
            }
        }

        /// <summary>
        /// Get audit log statistics
        /// </summary>
        [HttpGet(\"statistics\")]
        public async Task<ActionResult<object>> GetAuditStatistics(
            [FromQuery] DateTime? from = null,
            [FromQuery] DateTime? to = null)
        {
            try
            {
                // Default to last 30 days if no date range provided
                from ??= DateTime.UtcNow.AddDays(-30);
                to ??= DateTime.UtcNow;

                var allLogs = await _auditService.SearchAuditLogsAsync(
                    from: from, to: to, pageSize: 10000);

                var statistics = new
                {
                    TotalLogs = allLogs.Count(),
                    DateRange = new { From = from, To = to },
                    ActionBreakdown = allLogs.GroupBy(a => a.Action)
                        .ToDictionary(g => g.Key, g => g.Count()),
                    EntityBreakdown = allLogs.GroupBy(a => a.EntityType)
                        .ToDictionary(g => g.Key, g => g.Count()),
                    UserBreakdown = allLogs.GroupBy(a => a.User.Name)
                        .OrderByDescending(g => g.Count())
                        .Take(10)
                        .ToDictionary(g => g.Key, g => g.Count()),
                    DailyActivity = allLogs.GroupBy(a => a.CreatedAt.Date)
                        .OrderBy(g => g.Key)
                        .ToDictionary(g => g.Key.ToString(\"yyyy-MM-dd\"), g => g.Count()),
                    AvgExecutionTime = allLogs.Where(a => a.ExecutionTimeMs.HasValue)
                        .Average(a => a.ExecutionTimeMs ?? 0),
                    ErrorRate = allLogs.Count(a => a.ResponseStatusCode >= 400) * 100.0 / allLogs.Count()
                };

                return Ok(statistics);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, \"Error getting audit statistics\");
                return StatusCode(500, \"An error occurred while retrieving audit statistics.\");
            }
        }

        /// <summary>
        /// Get recent audit activities (dashboard widget)
        /// </summary>
        [HttpGet(\"recent\")]
        public async Task<ActionResult<IEnumerable<object>>> GetRecentActivities(
            [FromQuery] int count = 10)
        {
            try
            {
                if (count > 50) count = 50;

                var recentLogs = await _auditService.SearchAuditLogsAsync(
                    pageSize: count);

                var activities = recentLogs.Select(log => new
                {
                    log.Id,
                    log.Action,
                    log.EntityType,
                    log.EntityId,
                    log.Summary,
                    User = new
                    {
                        log.User.Id,
                        log.User.Name,
                        log.User.Email
                    },
                    log.CreatedAt,
                    log.IpAddress,
                    log.ResponseStatusCode
                });

                return Ok(activities);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, \"Error getting recent audit activities\");
                return StatusCode(500, \"An error occurred while retrieving recent activities.\");
            }
        }

        /// <summary>
        /// Export audit logs to CSV
        /// </summary>
        [HttpGet(\"export\")]
        public async Task<ActionResult> ExportAuditLogs(
            [FromQuery] string? action = null,
            [FromQuery] string? entityType = null,
            [FromQuery] int? userId = null,
            [FromQuery] DateTime? from = null,
            [FromQuery] DateTime? to = null)
        {
            try
            {
                var auditLogs = await _auditService.SearchAuditLogsAsync(
                    action, entityType, userId, from, to, pageSize: 10000);

                var csv = GenerateCsv(auditLogs);
                var fileName = $\"audit_logs_{DateTime.UtcNow:yyyyMMdd_HHmmss}.csv\";

                return File(
                    System.Text.Encoding.UTF8.GetBytes(csv),
                    \"text/csv\",
                    fileName);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, \"Error exporting audit logs\");
                return StatusCode(500, \"An error occurred while exporting audit logs.\");
            }
        }

        private string GenerateCsv(IEnumerable<AuditLog> auditLogs)
        {
            var csv = new System.Text.StringBuilder();
            
            // CSV Header
            csv.AppendLine(\"Id,EntityType,EntityId,Action,UserId,UserName,UserEmail,Summary,IpAddress,RequestPath,HttpMethod,ResponseStatusCode,ExecutionTimeMs,CreatedAt\");
            
            // CSV Data
            foreach (var log in auditLogs)
            {
                csv.AppendLine($\"{log.Id},\" +
                    $\"{EscapeCsv(log.EntityType)},\" +
                    $\"{log.EntityId},\" +
                    $\"{EscapeCsv(log.Action)},\" +
                    $\"{log.UserId},\" +
                    $\"{EscapeCsv(log.User.Name)},\" +
                    $\"{EscapeCsv(log.User.Email)},\" +
                    $\"{EscapeCsv(log.Summary)},\" +
                    $\"{EscapeCsv(log.IpAddress)},\" +
                    $\"{EscapeCsv(log.RequestPath)},\" +
                    $\"{EscapeCsv(log.HttpMethod)},\" +
                    $\"{log.ResponseStatusCode},\" +
                    $\"{log.ExecutionTimeMs},\" +
                    $\"{log.CreatedAt:yyyy-MM-dd HH:mm:ss}\");
            }
            
            return csv.ToString();
        }

        private string EscapeCsv(string? value)
        {
            if (string.IsNullOrEmpty(value)) return \"\";
            
            if (value.Contains(',') || value.Contains('\"') || value.Contains('\n'))
            {
                return $\"\\\"{value.Replace(\"\\\"\", \"\\\"\\\"\")}\\\"\";
            }
            
            return value;
        }
    }
}"