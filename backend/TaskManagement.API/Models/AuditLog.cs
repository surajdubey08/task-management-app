using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TaskManagement.API.Models
{
    /// <summary>
    /// Audit log entity for tracking user activities and system changes
    /// </summary>
    public class AuditLog
    {
        [Key]
        public int Id { get; set; }

        /// <summary>
        /// Type of entity being audited (e.g., "Task", "User", "Category")
        /// </summary>
        [Required]
        [StringLength(100)]
        public string EntityType { get; set; } = string.Empty;

        /// <summary>
        /// ID of the entity being audited
        /// </summary>
        [Required]
        public string EntityId { get; set; } = string.Empty;

        /// <summary>
        /// Action performed (e.g., "Create", "Update", "Delete", "Login", "Logout")
        /// </summary>
        [Required]
        [StringLength(50)]
        public string Action { get; set; } = string.Empty;

        /// <summary>
        /// ID of the user who performed the action
        /// </summary>
        public int? UserId { get; set; }

        /// <summary>
        /// Navigation property to the user
        /// </summary>
        [ForeignKey("UserId")]
        public virtual User? User { get; set; }

        /// <summary>
        /// Summary description of the action
        /// </summary>
        [StringLength(500)]
        public string Summary { get; set; } = string.Empty;

        /// <summary>
        /// Detailed changes in JSON format
        /// </summary>
        [Column(TypeName = "ntext")]
        public string? Details { get; set; }

        /// <summary>
        /// IP address of the user performing the action
        /// </summary>
        [StringLength(45)] // IPv6 support
        public string? IpAddress { get; set; }

        /// <summary>
        /// User agent string from the request
        /// </summary>
        [StringLength(500)]
        public string? UserAgent { get; set; }

        /// <summary>
        /// Request path that triggered the audit
        /// </summary>
        [StringLength(200)]
        public string? RequestPath { get; set; }

        /// <summary>
        /// HTTP method used (GET, POST, PUT, DELETE, etc.)
        /// </summary>
        [StringLength(10)]
        public string? HttpMethod { get; set; }

        /// <summary>
        /// HTTP response status code
        /// </summary>
        public int? ResponseStatusCode { get; set; }

        /// <summary>
        /// Request execution time in milliseconds
        /// </summary>
        public long? ExecutionTimeMs { get; set; }

        /// <summary>
        /// Timestamp when the action was performed
        /// </summary>
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        /// <summary>
        /// Additional metadata in JSON format
        /// </summary>
        [Column(TypeName = "ntext")]
        public string? Metadata { get; set; }
    }

    /// <summary>
    /// DTO for audit log creation
    /// </summary>
    public class CreateAuditLogDto
    {
        public string EntityType { get; set; } = string.Empty;
        public string EntityId { get; set; } = string.Empty;
        public string Action { get; set; } = string.Empty;
        public int? UserId { get; set; }
        public string Summary { get; set; } = string.Empty;
        public string? Details { get; set; }
        public string? IpAddress { get; set; }
        public string? UserAgent { get; set; }
        public string? RequestPath { get; set; }
        public string? HttpMethod { get; set; }
        public int? ResponseStatusCode { get; set; }
        public long? ExecutionTimeMs { get; set; }
        public string? Metadata { get; set; }
    }

    /// <summary>
    /// DTO for audit log responses
    /// </summary>
    public class AuditLogDto
    {
        public int Id { get; set; }
        public string EntityType { get; set; } = string.Empty;
        public string EntityId { get; set; } = string.Empty;
        public string Action { get; set; } = string.Empty;
        public int? UserId { get; set; }
        public string? UserName { get; set; }
        public string? UserEmail { get; set; }
        public string Summary { get; set; } = string.Empty;
        public string? Details { get; set; }
        public string? IpAddress { get; set; }
        public string? UserAgent { get; set; }
        public string? RequestPath { get; set; }
        public string? HttpMethod { get; set; }
        public int? ResponseStatusCode { get; set; }
        public long? ExecutionTimeMs { get; set; }
        public DateTime CreatedAt { get; set; }
        public string? Metadata { get; set; }
    }

    /// <summary>
    /// DTO for audit search queries
    /// </summary>
    public class AuditSearchDto
    {
        public string? EntityType { get; set; }
        public string? EntityId { get; set; }
        public string? Action { get; set; }
        public int? UserId { get; set; }
        public string? IpAddress { get; set; }
        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public string? SearchTerm { get; set; }
        public int Page { get; set; } = 1;
        public int PageSize { get; set; } = 20;
        public string SortBy { get; set; } = "CreatedAt";
        public string SortDirection { get; set; } = "desc";
    }

    /// <summary>
    /// DTO for audit statistics
    /// </summary>
    public class AuditStatisticsDto
    {
        public int TotalLogs { get; set; }
        public int LogsToday { get; set; }
        public int LogsThisWeek { get; set; }
        public int LogsThisMonth { get; set; }
        public Dictionary<string, int> ActionCounts { get; set; } = new();
        public Dictionary<string, int> EntityTypeCounts { get; set; } = new();
        public Dictionary<string, int> UserActivityCounts { get; set; } = new();
        public Dictionary<string, int> DailyActivityCounts { get; set; } = new();
    }

    /// <summary>
    /// DTO for user activity summary
    /// </summary>
    public class UserActivityDto
    {
        public int UserId { get; set; }
        public string UserName { get; set; } = string.Empty;
        public string UserEmail { get; set; } = string.Empty;
        public int TotalActions { get; set; }
        public DateTime? LastActivity { get; set; }
        public Dictionary<string, int> ActionBreakdown { get; set; } = new();
        public List<AuditLogDto> RecentActions { get; set; } = new();
    }
}