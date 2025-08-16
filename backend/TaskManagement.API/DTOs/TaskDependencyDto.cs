using TaskManagement.API.Models;

namespace TaskManagement.API.DTOs
{
    public class TaskDependencyDto
    {
        public int Id { get; set; }
        public int TaskId { get; set; }
        public int DependentTaskId { get; set; }
        public DependencyType DependencyType { get; set; }
        public DateTime CreatedAt { get; set; }
        public int CreatedByUserId { get; set; }
        
        // Related task information
        public string TaskTitle { get; set; } = string.Empty;
        public string DependentTaskTitle { get; set; } = string.Empty;
        public string CreatedByUserName { get; set; } = string.Empty;
        
        // Task status information for dependency validation
        public Models.TaskStatus TaskStatus { get; set; }
        public Models.TaskStatus DependentTaskStatus { get; set; }
    }

    public class CreateTaskDependencyDto
    {
        public int TaskId { get; set; }
        public int DependentTaskId { get; set; }
        public DependencyType DependencyType { get; set; }
        public int CreatedByUserId { get; set; }
    }

    public class TaskWithDependenciesDto : TaskDto
    {
        public List<TaskDependencyDto> BlockedBy { get; set; } = new List<TaskDependencyDto>();
        public List<TaskDependencyDto> Blocks { get; set; } = new List<TaskDependencyDto>();
        public bool CanStart { get; set; } = true;
        public List<string> BlockingReasons { get; set; } = new List<string>();
    }
}
