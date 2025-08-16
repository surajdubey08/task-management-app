using Microsoft.EntityFrameworkCore;
using TaskManagement.API.Data;
using TaskManagement.API.Models;

namespace TaskManagement.API.Repositories
{
    public class TaskCommentRepository : ITaskCommentRepository
    {
        private readonly TaskManagementContext _context;
        private readonly ILogger<TaskCommentRepository> _logger;

        public TaskCommentRepository(TaskManagementContext context, ILogger<TaskCommentRepository> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<IEnumerable<TaskComment>> GetByTaskIdAsync(int taskId)
        {
            _logger.LogInformation("Retrieving comments for task ID: {TaskId}", taskId);
            return await _context.TaskComments
                .Include(c => c.User)
                .Where(c => c.TaskId == taskId)
                .OrderBy(c => c.CreatedAt)
                .ToListAsync();
        }

        public async Task<TaskComment?> GetByIdAsync(int id)
        {
            _logger.LogInformation("Retrieving comment with ID: {CommentId}", id);
            return await _context.TaskComments
                .Include(c => c.User)
                .FirstOrDefaultAsync(c => c.Id == id);
        }

        public async Task<TaskComment> CreateAsync(TaskComment comment)
        {
            _logger.LogInformation("Creating new comment for task ID: {TaskId}", comment.TaskId);
            comment.CreatedAt = DateTime.UtcNow;
            comment.UpdatedAt = DateTime.UtcNow;
            
            _context.TaskComments.Add(comment);
            await _context.SaveChangesAsync();
            
            // Load the user information
            await _context.Entry(comment)
                .Reference(c => c.User)
                .LoadAsync();
            
            return comment;
        }

        public async Task<TaskComment> UpdateAsync(TaskComment comment)
        {
            _logger.LogInformation("Updating comment with ID: {CommentId}", comment.Id);
            comment.UpdatedAt = DateTime.UtcNow;
            
            _context.TaskComments.Update(comment);
            await _context.SaveChangesAsync();
            
            return comment;
        }

        public async Task<bool> DeleteAsync(int id)
        {
            _logger.LogInformation("Deleting comment with ID: {CommentId}", id);
            var comment = await _context.TaskComments.FindAsync(id);
            if (comment == null)
            {
                return false;
            }

            _context.TaskComments.Remove(comment);
            await _context.SaveChangesAsync();
            return true;
        }
    }
}
