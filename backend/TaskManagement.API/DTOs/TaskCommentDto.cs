using TaskManagement.API.Models;

namespace TaskManagement.API.DTOs
{
    public class TaskCommentDto
    {
        public int Id { get; set; }
        public string Content { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
        public int TaskId { get; set; }
        public int UserId { get; set; }
        public string UserName { get; set; } = string.Empty;
    }

    public class CreateTaskCommentDto
    {
        public string Content { get; set; } = string.Empty;
        public int TaskId { get; set; }
        public int UserId { get; set; }
    }

    public class UpdateTaskCommentDto
    {
        public string Content { get; set; } = string.Empty;
    }

    public class TaskActivityDto
    {
        public int Id { get; set; }
        public ActivityType ActivityType { get; set; }
        public string? Description { get; set; }
        public string? OldValue { get; set; }
        public string? NewValue { get; set; }
        public DateTime CreatedAt { get; set; }
        public int TaskId { get; set; }
        public int UserId { get; set; }
        public string UserName { get; set; } = string.Empty;
    }
}
