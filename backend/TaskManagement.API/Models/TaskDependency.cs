using System.ComponentModel.DataAnnotations;

namespace TaskManagement.API.Models
{
    public enum DependencyType
    {
        BlockedBy = 0,  // This task is blocked by another task
        Blocks = 1      // This task blocks another task
    }

    public class TaskDependency
    {
        public int Id { get; set; }
        
        public int TaskId { get; set; }
        public int DependentTaskId { get; set; }
        
        public DependencyType DependencyType { get; set; }
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public int CreatedByUserId { get; set; }
        
        // Navigation properties
        public virtual TaskItem Task { get; set; } = null!;
        public virtual TaskItem DependentTask { get; set; } = null!;
        public virtual User CreatedByUser { get; set; } = null!;
    }
}
