using System.ComponentModel.DataAnnotations;

namespace TaskManagement.API.Models
{
    public class TaskComment
    {
        public int Id { get; set; }
        
        [Required]
        [StringLength(2000)]
        public string Content { get; set; } = string.Empty;
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
        
        // Foreign keys
        public int TaskId { get; set; }
        public int UserId { get; set; }
        
        // Navigation properties
        public virtual TaskItem Task { get; set; } = null!;
        public virtual User User { get; set; } = null!;
    }
}
