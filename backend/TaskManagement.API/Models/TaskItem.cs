using System.ComponentModel.DataAnnotations;

namespace TaskManagement.API.Models
{
    public enum TaskStatus
    {
        Pending = 0,
        InProgress = 1,
        Completed = 2,
        Cancelled = 3
    }

    public enum TaskPriority
    {
        Low = 0,
        Medium = 1,
        High = 2,
        Critical = 3
    }

    public class TaskItem
    {
        public int Id { get; set; }
        
        [Required]
        [StringLength(200)]
        public string Title { get; set; } = string.Empty;
        
        [StringLength(1000)]
        public string? Description { get; set; }
        
        public TaskStatus Status { get; set; } = TaskStatus.Pending;
        
        public TaskPriority Priority { get; set; } = TaskPriority.Medium;
        
        public DateTime? DueDate { get; set; }
        
        public DateTime? CompletedAt { get; set; }
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
        
        // Foreign keys
        public int UserId { get; set; }
        public int? CategoryId { get; set; }
        public int? AssignedUserId { get; set; }
        
        // Navigation properties
        public virtual User User { get; set; } = null!;
        public virtual Category? Category { get; set; }
        public virtual User? AssignedUser { get; set; }
        public virtual ICollection<TaskComment> Comments { get; set; } = new List<TaskComment>();
        public virtual ICollection<TaskActivity> Activities { get; set; } = new List<TaskActivity>();


    }
}
