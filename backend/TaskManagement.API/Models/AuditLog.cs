using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json;

namespace TaskManagement.API.Models
{
    public class AuditLog
    {
        [Key]
        public int Id { get; set; }
        
        [Required]
        [MaxLength(100)]
        public string EntityType { get; set; } = string.Empty;
        
        [Required]
        public int EntityId { get; set; }
        
        [Required]
        [MaxLength(50)]
        public string Action { get; set; } = string.Empty; // CREATE, UPDATE, DELETE, VIEW
        
        [Required]
        public int UserId { get; set; }
        
        [ForeignKey(nameof(UserId))]
        public virtual User User { get; set; } = null!;
        
        [MaxLength(500)]
        public string? Summary { get; set; }
        
        [Column(TypeName = \"TEXT\")]
        public string? OldValues { get; set; }
        
        [Column(TypeName = \"TEXT\")]
        public string? NewValues { get; set; }
        
        [Column(TypeName = \"TEXT\")]
        public string? Changes { get; set; }
        
        [MaxLength(45)]
        public string? IpAddress { get; set; }
        
        [MaxLength(500)]
        public string? UserAgent { get; set; }
        
        [MaxLength(200)]
        public string? RequestPath { get; set; }
        
        [MaxLength(10)]
        public string? HttpMethod { get; set; }
        
        public int? ResponseStatusCode { get; set; }
        
        public long? ExecutionTimeMs { get; set; }
        
        [Column(TypeName = \"TEXT\")]
        public string? AdditionalData { get; set; }
        
        [Required]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        
        // Helper methods for JSON serialization
        public void SetOldValues(object? oldValues)
        {
            OldValues = oldValues != null ? JsonSerializer.Serialize(oldValues) : null;
        }
        
        public void SetNewValues(object? newValues)
        {
            NewValues = newValues != null ? JsonSerializer.Serialize(newValues) : null;
        }
        
        public void SetChanges(object? changes)
        {
            Changes = changes != null ? JsonSerializer.Serialize(changes) : null;
        }
        
        public void SetAdditionalData(object? data)
        {
            AdditionalData = data != null ? JsonSerializer.Serialize(data) : null;
        }
        
        public T? GetOldValues<T>() where T : class
        {
            return string.IsNullOrEmpty(OldValues) ? null : JsonSerializer.Deserialize<T>(OldValues);
        }
        
        public T? GetNewValues<T>() where T : class
        {
            return string.IsNullOrEmpty(NewValues) ? null : JsonSerializer.Deserialize<T>(NewValues);
        }
        
        public T? GetChanges<T>() where T : class
        {
            return string.IsNullOrEmpty(Changes) ? null : JsonSerializer.Deserialize<T>(Changes);
        }
        
        public T? GetAdditionalData<T>() where T : class
        {
            return string.IsNullOrEmpty(AdditionalData) ? null : JsonSerializer.Deserialize<T>(AdditionalData);
        }
    }
    
    public static class AuditActions
    {
        public const string CREATE = \"CREATE\";
        public const string UPDATE = \"UPDATE\";
        public const string DELETE = \"DELETE\";
        public const string VIEW = \"VIEW\";
        public const string LOGIN = \"LOGIN\";
        public const string LOGOUT = \"LOGOUT\";
        public const string PASSWORD_CHANGE = \"PASSWORD_CHANGE\";
        public const string BULK_UPDATE = \"BULK_UPDATE\";
        public const string EXPORT = \"EXPORT\";
        public const string IMPORT = \"IMPORT\";
    }
    
    public static class AuditEntities
    {
        public const string TASK = \"Task\";
        public const string USER = \"User\";
        public const string CATEGORY = \"Category\";
        public const string TASK_COMMENT = \"TaskComment\";
        public const string AUTH = \"Authentication\";
    }
}