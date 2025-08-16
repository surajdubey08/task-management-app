using Microsoft.EntityFrameworkCore;
using TaskManagement.API.Data;
using TaskManagement.API.Models;

namespace TaskManagement.API.Repositories
{
    public class TaskDependencyRepository : ITaskDependencyRepository
    {
        private readonly TaskManagementContext _context;
        private readonly ILogger<TaskDependencyRepository> _logger;

        public TaskDependencyRepository(TaskManagementContext context, ILogger<TaskDependencyRepository> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<IEnumerable<TaskDependency>> GetByTaskIdAsync(int taskId)
        {
            _logger.LogInformation("Retrieving all dependencies for task ID: {TaskId}", taskId);
            return await _context.TaskDependencies
                .Include(d => d.Task)
                .Include(d => d.DependentTask)
                .Include(d => d.CreatedByUser)
                .Where(d => d.TaskId == taskId || d.DependentTaskId == taskId)
                .ToListAsync();
        }

        public async Task<IEnumerable<TaskDependency>> GetDependenciesForTaskAsync(int taskId)
        {
            _logger.LogInformation("Retrieving dependencies that block task ID: {TaskId}", taskId);
            return await _context.TaskDependencies
                .Include(d => d.Task)
                .Include(d => d.DependentTask)
                .Include(d => d.CreatedByUser)
                .Where(d => d.TaskId == taskId && d.DependencyType == DependencyType.BlockedBy)
                .ToListAsync();
        }

        public async Task<IEnumerable<TaskDependency>> GetDependentsForTaskAsync(int taskId)
        {
            _logger.LogInformation("Retrieving tasks that are blocked by task ID: {TaskId}", taskId);
            return await _context.TaskDependencies
                .Include(d => d.Task)
                .Include(d => d.DependentTask)
                .Include(d => d.CreatedByUser)
                .Where(d => d.DependentTaskId == taskId && d.DependencyType == DependencyType.BlockedBy)
                .ToListAsync();
        }

        public async Task<TaskDependency?> GetByIdAsync(int id)
        {
            _logger.LogInformation("Retrieving dependency with ID: {DependencyId}", id);
            return await _context.TaskDependencies
                .Include(d => d.Task)
                .Include(d => d.DependentTask)
                .Include(d => d.CreatedByUser)
                .FirstOrDefaultAsync(d => d.Id == id);
        }

        public async Task<TaskDependency> CreateAsync(TaskDependency dependency)
        {
            _logger.LogInformation("Creating dependency between task {TaskId} and {DependentTaskId}", 
                dependency.TaskId, dependency.DependentTaskId);
            
            dependency.CreatedAt = DateTime.UtcNow;
            _context.TaskDependencies.Add(dependency);
            await _context.SaveChangesAsync();
            
            // Load navigation properties
            await _context.Entry(dependency)
                .Reference(d => d.Task)
                .LoadAsync();
            await _context.Entry(dependency)
                .Reference(d => d.DependentTask)
                .LoadAsync();
            await _context.Entry(dependency)
                .Reference(d => d.CreatedByUser)
                .LoadAsync();
            
            return dependency;
        }

        public async Task<bool> DeleteAsync(int id)
        {
            _logger.LogInformation("Deleting dependency with ID: {DependencyId}", id);
            var dependency = await _context.TaskDependencies.FindAsync(id);
            if (dependency == null)
            {
                return false;
            }

            _context.TaskDependencies.Remove(dependency);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> HasCircularDependencyAsync(int taskId, int dependentTaskId)
        {
            _logger.LogInformation("Checking for circular dependency between {TaskId} and {DependentTaskId}", 
                taskId, dependentTaskId);
            
            // Use a recursive CTE to check for circular dependencies
            var visited = new HashSet<int>();
            return await CheckCircularDependencyRecursive(taskId, dependentTaskId, visited);
        }

        private async Task<bool> CheckCircularDependencyRecursive(int startTaskId, int targetTaskId, HashSet<int> visited)
        {
            if (visited.Contains(targetTaskId))
            {
                return true; // Circular dependency found
            }

            visited.Add(targetTaskId);

            var dependencies = await _context.TaskDependencies
                .Where(d => d.TaskId == targetTaskId && d.DependencyType == DependencyType.BlockedBy)
                .Select(d => d.DependentTaskId)
                .ToListAsync();

            foreach (var depTaskId in dependencies)
            {
                if (depTaskId == startTaskId)
                {
                    return true; // Direct circular dependency
                }

                if (await CheckCircularDependencyRecursive(startTaskId, depTaskId, new HashSet<int>(visited)))
                {
                    return true; // Indirect circular dependency
                }
            }

            return false;
        }

        public async Task<bool> DependencyExistsAsync(int taskId, int dependentTaskId, DependencyType dependencyType)
        {
            _logger.LogInformation("Checking if dependency exists: {TaskId} -> {DependentTaskId} ({DependencyType})", 
                taskId, dependentTaskId, dependencyType);
            
            return await _context.TaskDependencies
                .AnyAsync(d => d.TaskId == taskId && 
                              d.DependentTaskId == dependentTaskId && 
                              d.DependencyType == dependencyType);
        }
    }
}
