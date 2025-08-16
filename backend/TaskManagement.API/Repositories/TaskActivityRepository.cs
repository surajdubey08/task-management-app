using Microsoft.EntityFrameworkCore;
using TaskManagement.API.Data;
using TaskManagement.API.Models;

namespace TaskManagement.API.Repositories
{
    public class TaskActivityRepository : ITaskActivityRepository
    {
        private readonly TaskManagementContext _context;
        private readonly ILogger<TaskActivityRepository> _logger;

        public TaskActivityRepository(TaskManagementContext context, ILogger<TaskActivityRepository> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<IEnumerable<TaskActivity>> GetByTaskIdAsync(int taskId)
        {
            _logger.LogInformation("Retrieving activities for task ID: {TaskId}", taskId);
            return await _context.TaskActivities
                .Include(a => a.User)
                .Where(a => a.TaskId == taskId)
                .OrderByDescending(a => a.CreatedAt)
                .ToListAsync();
        }

        public async Task<TaskActivity> CreateAsync(TaskActivity activity)
        {
            _logger.LogInformation("Creating new activity for task ID: {TaskId}", activity.TaskId);
            activity.CreatedAt = DateTime.UtcNow;
            
            _context.TaskActivities.Add(activity);
            await _context.SaveChangesAsync();
            
            // Load the user information
            await _context.Entry(activity)
                .Reference(a => a.User)
                .LoadAsync();
            
            return activity;
        }
    }
}
