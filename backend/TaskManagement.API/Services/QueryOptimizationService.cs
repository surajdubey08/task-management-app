using Microsoft.EntityFrameworkCore;
using TaskManagement.API.Data;
using TaskManagement.API.Models;

namespace TaskManagement.API.Services
{
    public interface IQueryOptimizationService
    {
        Task<IEnumerable<Models.Task>> GetTasksWithOptimizedLoadingAsync(
            int? userId = null, 
            int? categoryId = null, 
            TaskStatus? status = null,
            int page = 1, 
            int pageSize = 20);
            
        Task<Models.Task?> GetTaskWithDetailsAsync(int id);
        Task<Dictionary<string, object>> GetDashboardStatsAsync();
        Task<IEnumerable<Models.Task>> GetTasksForKanbanAsync();
    }

    public class QueryOptimizationService : IQueryOptimizationService
    {
        private readonly TaskManagementContext _context;
        private readonly ILogger<QueryOptimizationService> _logger;

        public QueryOptimizationService(
            TaskManagementContext context,
            ILogger<QueryOptimizationService> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<IEnumerable<Models.Task>> GetTasksWithOptimizedLoadingAsync(
            int? userId = null, 
            int? categoryId = null, 
            TaskStatus? status = null, 
            int page = 1, 
            int pageSize = 20)
        {
            var query = _context.Tasks
                .Include(t => t.AssignedUser)
                .Include(t => t.Category)
                .AsQueryable();

            // Apply filters
            if (userId.HasValue)
                query = query.Where(t => t.AssignedUserId == userId.Value);

            if (categoryId.HasValue)
                query = query.Where(t => t.CategoryId == categoryId.Value);

            if (status.HasValue)
                query = query.Where(t => t.Status == status.Value);

            // Apply ordering and pagination
            var tasks = await query
                .OrderByDescending(t => t.UpdatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .AsNoTracking() // Read-only for better performance
                .ToListAsync();

            _logger.LogDebug("Retrieved {Count} tasks with optimized loading for page {Page}", 
                tasks.Count, page);

            return tasks;
        }

        public async Task<Models.Task?> GetTaskWithDetailsAsync(int id)
        {
            var task = await _context.Tasks
                .Include(t => t.AssignedUser)
                .Include(t => t.Category)
                .Include(t => t.Comments.OrderByDescending(c => c.CreatedAt).Take(10))
                    .ThenInclude(c => c.User)
                .Include(t => t.Activities.OrderByDescending(a => a.CreatedAt).Take(20))
                    .ThenInclude(a => a.User)
                .AsNoTracking()
                .FirstOrDefaultAsync(t => t.Id == id);

            if (task != null)
            {
                _logger.LogDebug("Retrieved task {TaskId} with full details", id);
            }

            return task;
        }

        public async Task<Dictionary<string, object>> GetDashboardStatsAsync()
        {
            // Use a single query to get all counts efficiently
            var stats = await _context.Tasks
                .GroupBy(t => 1)
                .Select(g => new
                {
                    TotalTasks = g.Count(),
                    PendingTasks = g.Count(t => t.Status == TaskStatus.Pending),
                    InProgressTasks = g.Count(t => t.Status == TaskStatus.InProgress),
                    CompletedTasks = g.Count(t => t.Status == TaskStatus.Completed),
                    OverdueTasks = g.Count(t => t.DueDate.HasValue && t.DueDate < DateTime.UtcNow && t.Status != TaskStatus.Completed),
                    TasksCreatedThisWeek = g.Count(t => t.CreatedAt >= DateTime.UtcNow.AddDays(-7)),
                    TasksCompletedThisWeek = g.Count(t => t.Status == TaskStatus.Completed && 
                                                       t.UpdatedAt >= DateTime.UtcNow.AddDays(-7))
                })
                .FirstOrDefaultAsync();

            var userCount = await _context.Users.CountAsync();
            var categoryCount = await _context.Categories.CountAsync();

            var result = new Dictionary<string, object>
            {
                ["totalTasks"] = stats?.TotalTasks ?? 0,
                ["pendingTasks"] = stats?.PendingTasks ?? 0,
                ["inProgressTasks"] = stats?.InProgressTasks ?? 0,
                ["completedTasks"] = stats?.CompletedTasks ?? 0,
                ["overdueTasks"] = stats?.OverdueTasks ?? 0,
                ["tasksCreatedThisWeek"] = stats?.TasksCreatedThisWeek ?? 0,
                ["tasksCompletedThisWeek"] = stats?.TasksCompletedThisWeek ?? 0,
                ["totalUsers"] = userCount,
                ["totalCategories"] = categoryCount,
                ["completionRate"] = stats?.TotalTasks > 0 ? 
                    Math.Round((double)(stats.CompletedTasks * 100) / stats.TotalTasks, 1) : 0
            };

            _logger.LogDebug("Generated dashboard stats with {TaskCount} total tasks", 
                stats?.TotalTasks ?? 0);

            return result;
        }

        public async Task<IEnumerable<Models.Task>> GetTasksForKanbanAsync()
        {
            // Optimized query for Kanban board - minimal data loading
            var tasks = await _context.Tasks
                .Include(t => t.AssignedUser)
                .Include(t => t.Category)
                .Select(t => new Models.Task
                {
                    Id = t.Id,
                    Title = t.Title,
                    Description = t.Description,
                    Status = t.Status,
                    Priority = t.Priority,
                    DueDate = t.DueDate,
                    AssignedUserId = t.AssignedUserId,
                    CategoryId = t.CategoryId,
                    CreatedAt = t.CreatedAt,
                    UpdatedAt = t.UpdatedAt,
                    // Load only essential related data
                    AssignedUser = t.AssignedUser != null ? new User
                    {
                        Id = t.AssignedUser.Id,
                        Name = t.AssignedUser.Name,
                        Email = t.AssignedUser.Email
                    } : null,
                    Category = t.Category != null ? new Category
                    {
                        Id = t.Category.Id,
                        Name = t.Category.Name,
                        Color = t.Category.Color
                    } : null
                })
                .AsNoTracking()
                .OrderBy(t => t.Status)
                .ThenByDescending(t => t.UpdatedAt)
                .ToListAsync();

            _logger.LogDebug("Retrieved {Count} tasks for Kanban board", tasks.Count);
            return tasks;
        }
    }
}