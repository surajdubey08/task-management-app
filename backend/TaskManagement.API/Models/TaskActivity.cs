using System.ComponentModel.DataAnnotations;

namespace TaskManagement.API.Models
{
    public enum ActivityType
    {
        Created = 0,
        StatusChanged = 1,
        PriorityChanged = 2,
        AssigneeChanged = 3,
        DueDateChanged = 4,
        CategoryChanged = 5,
        TitleChanged = 6,
        DescriptionChanged = 7,
        Commented = 8
    }

    public class TaskActivity
    {
        public int Id { get; set; }
        
        public ActivityType ActivityType { get; set; }
        
        [StringLength(500)]
        public string? Description { get; set; }
        
        [StringLength(100)]
        public string? OldValue { get; set; }
        
        [StringLength(100)]
        public string? NewValue { get; set; }
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        
        // Foreign keys
        public int TaskId { get; set; }
        public int UserId { get; set; }
        
        // Navigation properties
        public virtual TaskItem Task { get; set; } = null!;
        public virtual User User { get; set; } = null!;
    }
}
