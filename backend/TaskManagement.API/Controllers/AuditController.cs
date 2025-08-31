using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TaskManagement.API.Models;
using TaskManagement.API.Services;

namespace TaskManagement.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Admin,Manager")]
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
        /// Gets audit trail for a specific entity
        /// </summary>
        /// <param name="entityType">Type of entity (e.g., "Task", "User")</param>
        /// <param name="entityId">ID of the entity</param>
        /// <returns>List of audit logs for the entity</returns>
        [HttpGet("entity/{entityType}/{entityId}")]
        public async Task<ActionResult<IEnumerable<AuditLogDto>>> GetAuditTrail(
            string entityType, 
            string entityId,
            CancellationToken cancellationToken = default)
        {
            try
            {
                if (string.IsNullOrEmpty(entityType) || string.IsNullOrEmpty(entityId))
                {
                    return BadRequest("EntityType and EntityId are required");
                }

                var auditTrail = await _auditService.GetAuditTrailAsync(entityType, entityId, cancellationToken);
                return Ok(auditTrail);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting audit trail for {EntityType}:{EntityId}", 
                    entityType, entityId);
                return StatusCode(500, "An error occurred while retrieving audit logs.");
            }
        }

        /// <summary>
        /// Gets user activity summary
        /// </summary>
        /// <param name="userId">ID of the user</param>
        /// <param name="startDate">Start date for filtering (optional)</param>
        /// <param name="endDate">End date for filtering (optional)</param>
        /// <returns>User activity summary</returns>
        [HttpGet("user/{userId}/activity")]
        public async Task<ActionResult<UserActivityDto>> GetUserActivity(
            int userId,
            [FromQuery] DateTime? startDate = null,
            [FromQuery] DateTime? endDate = null,
            CancellationToken cancellationToken = default)
        {
            try
            {
                if (userId <= 0)
                {
                    return BadRequest("Valid UserId is required");
                }

                var activity = await _auditService.GetUserActivityAsync(userId, startDate, endDate, cancellationToken);
                return Ok(activity);
            }
            catch (ArgumentException ex)
            {
                return NotFound(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting user activity for UserId:{UserId}", userId);
                return StatusCode(500, "An error occurred while retrieving user activity.");
            }
        }

        /// <summary>
        /// Searches audit logs with filtering and pagination
        /// </summary>
        /// <param name="searchDto">Search criteria</param>
        /// <returns>Filtered list of audit logs</returns>
        [HttpGet("search")]
        public async Task<ActionResult<IEnumerable<AuditLogDto>>> SearchAuditLogs(
            [FromQuery] AuditSearchDto searchDto,
            CancellationToken cancellationToken = default)
        {
            try
            {
                if (searchDto == null)
                {
                    searchDto = new AuditSearchDto();
                }

                // Validate pagination parameters
                if (searchDto.Page <= 0) searchDto.Page = 1;
                if (searchDto.PageSize <= 0 || searchDto.PageSize > 100) searchDto.PageSize = 20;

                var auditLogs = await _auditService.GetAuditLogsAsync(searchDto, cancellationToken);
                return Ok(auditLogs);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error searching audit logs");
                return StatusCode(500, "An error occurred while searching audit logs.");
            }
        }

        /// <summary>
        /// Gets audit statistics and metrics
        /// </summary>
        /// <param name="startDate">Start date for statistics (optional)</param>
        /// <param name="endDate">End date for statistics (optional)</param>
        /// <returns>Audit statistics</returns>
        [HttpGet("statistics")]
        public async Task<ActionResult<AuditStatisticsDto>> GetAuditStatistics(
            [FromQuery] DateTime? startDate = null,
            [FromQuery] DateTime? endDate = null,
            CancellationToken cancellationToken = default)
        {
            try
            {
                var statistics = await _auditService.GetStatisticsAsync(startDate, endDate, cancellationToken);
                
                // Add additional computed metrics
                var response = new
                {
                    statistics.TotalLogs,
                    statistics.LogsToday,
                    statistics.LogsThisWeek,
                    statistics.LogsThisMonth,
                    statistics.ActionCounts,
                    statistics.EntityTypeCounts,
                    statistics.UserActivityCounts,
                    DailyActivity = statistics.DailyActivityCounts
                        .OrderBy(kvp => kvp.Key)
                        .ToDictionary(kvp => kvp.Key, kvp => kvp.Value),
                    TopActions = statistics.ActionCounts
                        .OrderByDescending(kvp => kvp.Value)
                        .Take(5)
                        .ToDictionary(kvp => kvp.Key, kvp => kvp.Value),
                    TopEntities = statistics.EntityTypeCounts
                        .OrderByDescending(kvp => kvp.Value)
                        .Take(5)
                        .ToDictionary(kvp => kvp.Key, kvp => kvp.Value)
                };

                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting audit statistics");
                return StatusCode(500, "An error occurred while retrieving audit statistics.");
            }
        }

        /// <summary>
        /// Gets recent audit activities
        /// </summary>
        /// <param name="count">Number of recent activities to retrieve (default: 50, max: 100)</param>
        /// <returns>List of recent audit logs</returns>
        [HttpGet("recent")]
        public async Task<ActionResult<IEnumerable<AuditLogDto>>> GetRecentActivities(
            [FromQuery] int count = 50,
            CancellationToken cancellationToken = default)
        {
            try
            {
                if (count <= 0 || count > 100)
                {
                    count = 50;
                }

                var recentActivities = await _auditService.GetRecentActivitiesAsync(count, cancellationToken);
                
                // Group by date for better presentation
                var groupedActivities = recentActivities
                    .GroupBy(a => a.CreatedAt.Date)
                    .OrderByDescending(g => g.Key)
                    .Select(g => new
                    {
                        Date = g.Key.ToString("yyyy-MM-dd"),
                        Activities = g.OrderByDescending(a => a.CreatedAt).ToList()
                    })
                    .ToList();

                return Ok(new
                {
                    TotalCount = recentActivities.Count(),
                    RequestedCount = count,
                    GroupedByDate = groupedActivities,
                    FlatList = recentActivities
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting recent audit activities");
                return StatusCode(500, "An error occurred while retrieving recent activities.");
            }
        }

        /// <summary>
        /// Exports audit logs to CSV format
        /// </summary>
        /// <param name="searchDto">Search criteria for export</param>
        /// <returns>CSV file with audit logs</returns>
        [HttpGet("export")]
        public async Task<IActionResult> ExportAuditLogs(
            [FromQuery] AuditSearchDto searchDto,
            CancellationToken cancellationToken = default)
        {
            try
            {
                if (searchDto == null)
                {
                    searchDto = new AuditSearchDto { PageSize = int.MaxValue }; // Export all
                }
                else
                {
                    searchDto.PageSize = int.MaxValue; // Override pagination for export
                }

                var csvContent = await _auditService.ExportAuditLogsAsync(searchDto, cancellationToken);
                var fileName = $"audit_logs_{DateTime.UtcNow:yyyyMMdd_HHmmss}.csv";

                return File(
                    System.Text.Encoding.UTF8.GetBytes(csvContent),
                    "text/csv",
                    fileName);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error exporting audit logs");
                return StatusCode(500, "An error occurred while exporting audit logs.");
            }
        }

        /// <summary>
        /// Gets a specific audit log by ID
        /// </summary>
        /// <param name="id">Audit log ID</param>
        /// <returns>Audit log details</returns>
        [HttpGet("{id}")]
        public async Task<ActionResult<AuditLogDto>> GetAuditLog(
            int id,
            CancellationToken cancellationToken = default)
        {
            try
            {
                if (id <= 0)
                {
                    return BadRequest("Valid audit log ID is required");
                }

                var auditLog = await _auditService.GetAuditLogByIdAsync(id, cancellationToken);
                if (auditLog == null)
                {
                    return NotFound($"Audit log with ID {id} not found");
                }

                return Ok(auditLog);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting audit log by ID: {Id}", id);
                return StatusCode(500, "An error occurred while retrieving the audit log.");
            }
        }

        /// <summary>
        /// Deletes old audit logs (Admin only)
        /// </summary>
        /// <param name="cutoffDate">Date before which logs should be deleted</param>
        /// <returns>Success response</returns>
        [HttpDelete("cleanup")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteOldAuditLogs(
            [FromQuery] DateTime cutoffDate,
            CancellationToken cancellationToken = default)
        {
            try
            {
                if (cutoffDate >= DateTime.UtcNow.AddDays(-1))
                {
                    return BadRequest("Cutoff date must be at least 1 day in the past");
                }

                await _auditService.DeleteOldAuditLogsAsync(cutoffDate, cancellationToken);
                
                return Ok(new
                {
                    Message = "Old audit logs deleted successfully",
                    CutoffDate = cutoffDate.ToString("yyyy-MM-dd HH:mm:ss")
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting old audit logs");
                return StatusCode(500, "An error occurred while deleting old audit logs.");
            }
        }

        /// <summary>
        /// Creates a manual audit log entry (Admin only)
        /// </summary>
        /// <param name="createDto">Audit log creation data</param>
        /// <returns>Created audit log</returns>
        [HttpPost]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<AuditLogDto>> CreateAuditLog(
            [FromBody] CreateAuditLogDto createDto,
            CancellationToken cancellationToken = default)
        {
            try
            {
                if (createDto == null)
                {
                    return BadRequest("Audit log data is required");
                }

                if (string.IsNullOrEmpty(createDto.EntityType) || 
                    string.IsNullOrEmpty(createDto.EntityId) || 
                    string.IsNullOrEmpty(createDto.Action))
                {
                    return BadRequest("EntityType, EntityId, and Action are required");
                }

                var auditLog = await _auditService.CreateAuditLogAsync(createDto, cancellationToken);
                
                return CreatedAtAction(
                    nameof(GetAuditLog),
                    new { id = auditLog.Id },
                    auditLog);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating audit log");
                return StatusCode(500, "An error occurred while creating the audit log.");
            }
        }

        /// <summary>
        /// Gets audit logs summary for dashboard
        /// </summary>
        /// <returns>Summary data for dashboard widgets</returns>
        [HttpGet("dashboard/summary")]
        public async Task<ActionResult> GetDashboardSummary(CancellationToken cancellationToken = default)
        {
            try
            {
                var now = DateTime.UtcNow;
                var startOfWeek = now.AddDays(-(int)now.DayOfWeek);
                var startOfMonth = new DateTime(now.Year, now.Month, 1);

                var weeklyStats = await _auditService.GetStatisticsAsync(startOfWeek, now, cancellationToken);
                var monthlyStats = await _auditService.GetStatisticsAsync(startOfMonth, now, cancellationToken);
                var recentActivities = await _auditService.GetRecentActivitiesAsync(10, cancellationToken);

                var summary = new
                {
                    Today = weeklyStats.LogsToday,
                    ThisWeek = weeklyStats.LogsThisWeek,
                    ThisMonth = monthlyStats.LogsThisMonth,
                    TopActionsThisWeek = weeklyStats.ActionCounts
                        .OrderByDescending(kvp => kvp.Value)
                        .Take(3)
                        .ToDictionary(kvp => kvp.Key, kvp => kvp.Value),
                    TopUsersThisWeek = weeklyStats.UserActivityCounts
                        .OrderByDescending(kvp => kvp.Value)
                        .Take(3)
                        .ToDictionary(kvp => kvp.Key, kvp => kvp.Value),
                    RecentActivities = recentActivities.Take(5),
                    TrendData = weeklyStats.DailyActivityCounts
                        .OrderBy(kvp => kvp.Key)
                        .Select(kvp => new
                        {
                            Date = kvp.Key,
                            Count = kvp.Value
                        })
                        .ToList()
                };

                return Ok(summary);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting audit dashboard summary");
                return StatusCode(500, "An error occurred while retrieving dashboard summary.");
            }
        }
    }
}