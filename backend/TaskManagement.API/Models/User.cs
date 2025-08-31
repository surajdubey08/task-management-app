using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace TaskManagement.API.Models
{
    public enum UserRole
    {
        Admin = 0,
        Manager = 1,
        Member = 2,
        Viewer = 3
    }

    public enum AccountStatus
    {
        Active = 0,
        Inactive = 1,
        Suspended = 2,
        PendingVerification = 3
    }

    public class User
    {
        public int Id { get; set; }
        
        [Required]
        [StringLength(100)]
        public string Name { get; set; } = string.Empty;
        
        [Required]
        [EmailAddress]
        [StringLength(255)]
        public string Email { get; set; } = string.Empty;
        
        [JsonIgnore]
        [Required]
        [StringLength(255)]
        public string PasswordHash { get; set; } = string.Empty;
        
        [StringLength(20)]
        public string? PhoneNumber { get; set; }
        
        [StringLength(100)]
        public string? Department { get; set; }
        
        public UserRole Role { get; set; } = UserRole.Member;
        
        public AccountStatus Status { get; set; } = AccountStatus.Active;
        
        public DateTime? LastLoginAt { get; set; }
        
        [JsonIgnore]
        public string? RefreshToken { get; set; }
        
        [JsonIgnore]
        public DateTime? RefreshTokenExpiryTime { get; set; }
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
        
        // Navigation properties
        public virtual ICollection<TaskItem> Tasks { get; set; } = new List<TaskItem>();
        public virtual ICollection<TaskComment> Comments { get; set; } = new List<TaskComment>();
        public virtual ICollection<TaskActivity> Activities { get; set; } = new List<TaskActivity>();
    }
}
