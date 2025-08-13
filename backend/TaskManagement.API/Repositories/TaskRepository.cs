using Microsoft.EntityFrameworkCore;
using TaskManagement.API.Data;
using TaskManagement.API.Models;
using TaskStatus = TaskManagement.API.Models.TaskStatus;

namespace TaskManagement.API.Repositories
{
    public class TaskRepository : ITaskRepository
    {
        private readonly TaskManagementContext _context;
        private readonly ILogger<TaskRepository> _logger;

        public TaskRepository(TaskManagementContext context, ILogger<TaskRepository> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<IEnumerable<TaskItem>> GetAllAsync()
        {
            _logger.LogInformation("Retrieving all tasks");
            return await _context.Tasks
                .Include(t => t.User)
                .Include(t => t.Category)
                .OrderByDescending(t => t.CreatedAt)
                .ToListAsync();
        }

        public async Task<TaskItem?> GetByIdAsync(int id)
        {
            _logger.LogInformation("Retrieving task with ID: {TaskId}", id);
            return await _context.Tasks
                .Include(t => t.User)
                .Include(t => t.Category)
                .FirstOrDefaultAsync(t => t.Id == id);
        }

        public async Task<IEnumerable<TaskItem>> GetByUserIdAsync(int userId)
        {
            _logger.LogInformation("Retrieving tasks for user ID: {UserId}", userId);
            return await _context.Tasks
                .Include(t => t.User)
                .Include(t => t.Category)
                .Where(t => t.UserId == userId)
                .OrderByDescending(t => t.CreatedAt)
                .ToListAsync();
        }

        public async Task<IEnumerable<TaskItem>> GetByCategoryIdAsync(int categoryId)
        {
            _logger.LogInformation("Retrieving tasks for category ID: {CategoryId}", categoryId);
            return await _context.Tasks
                .Include(t => t.User)
                .Include(t => t.Category)
                .Where(t => t.CategoryId == categoryId)
                .OrderByDescending(t => t.CreatedAt)
                .ToListAsync();
        }

        public async Task<IEnumerable<TaskItem>> GetByStatusAsync(TaskStatus status)
        {
            _logger.LogInformation("Retrieving tasks with status: {Status}", status);
            return await _context.Tasks
                .Include(t => t.User)
                .Include(t => t.Category)
                .Where(t => t.Status == status)
                .OrderByDescending(t => t.CreatedAt)
                .ToListAsync();
        }

        public async Task<TaskItem> CreateAsync(TaskItem task)
        {
            _logger.LogInformation("Creating new task: {TaskTitle}", task.Title);
            task.CreatedAt = DateTime.UtcNow;
            task.UpdatedAt = DateTime.UtcNow;
            
            _context.Tasks.Add(task);
            await _context.SaveChangesAsync();
            
            return await GetByIdAsync(task.Id) ?? task;
        }

        public async Task<TaskItem> UpdateAsync(TaskItem task)
        {
            _logger.LogInformation("Updating task with ID: {TaskId}", task.Id);
            task.UpdatedAt = DateTime.UtcNow;
            
            if (task.Status == TaskStatus.Completed && task.CompletedAt == null)
            {
                task.CompletedAt = DateTime.UtcNow;
            }
            else if (task.Status != TaskStatus.Completed)
            {
                task.CompletedAt = null;
            }
            
            _context.Tasks.Update(task);
            await _context.SaveChangesAsync();
            
            return await GetByIdAsync(task.Id) ?? task;
        }

        public async Task<bool> DeleteAsync(int id)
        {
            _logger.LogInformation("Deleting task with ID: {TaskId}", id);
            var task = await _context.Tasks.FindAsync(id);
            if (task == null)
                return false;

            _context.Tasks.Remove(task);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> ExistsAsync(int id)
        {
            return await _context.Tasks.AnyAsync(t => t.Id == id);
        }
    }
}
