using Microsoft.EntityFrameworkCore;
using TaskManagement.API.Data;
using TaskManagement.API.Models;
using TaskManagement.API.Services;

namespace TaskManagement.API.Repositories
{
    public class CachedTaskRepository : ITaskRepository
    {
        private readonly ITaskRepository _baseRepository;
        private readonly ICacheService _cache;
        private readonly ILogger<CachedTaskRepository> _logger;
        
        // Cache tags for invalidation
        private const string TASKS_TAG = "tasks";
        private const string USER_TASKS_TAG = "user_tasks";

        public CachedTaskRepository(
            TaskRepository baseRepository,
            ICacheService cache,
            ILogger<CachedTaskRepository> logger)
        {
            _baseRepository = baseRepository;
            _cache = cache;
            _logger = logger;
        }

        public async Task<IEnumerable<Models.Task>> GetAllAsync()
        {
            return await _cache.GetOrSetAsync(
                RedisCacheService.TasksListKey(),
                async cancellationToken => await _baseRepository.GetAllAsync(),
                TimeSpan.FromMinutes(15)
            ) ?? Enumerable.Empty<Models.Task>();
        }

        public async Task<Models.Task?> GetByIdAsync(int id)
        {
            return await _cache.GetOrSetAsync(
                RedisCacheService.TaskKey(id),
                async cancellationToken => await _baseRepository.GetByIdAsync(id),
                TimeSpan.FromMinutes(30)
            );
        }

        public async Task<Models.Task> CreateAsync(Models.Task task)
        {
            var createdTask = await _baseRepository.CreateAsync(task);
            
            // Invalidate related caches
            await InvalidateTaskCaches();
            
            // Cache the new task
            if (createdTask.Id > 0)
            {
                await _cache.SetWithTagsAsync(
                    RedisCacheService.TaskKey(createdTask.Id),
                    createdTask,
                    new[] { TASKS_TAG, $"{USER_TASKS_TAG}_{createdTask.AssignedUserId}" },
                    TimeSpan.FromMinutes(30)
                );
            }
            
            _logger.LogDebug("Created task {TaskId} and invalidated related caches", createdTask.Id);
            return createdTask;
        }

        public async Task<Models.Task> UpdateAsync(Models.Task task)
        {
            var updatedTask = await _baseRepository.UpdateAsync(task);
            
            // Remove specific task from cache and invalidate lists
            await _cache.RemoveAsync(RedisCacheService.TaskKey(task.Id));
            await InvalidateTaskCaches();
            
            // Cache the updated task
            await _cache.SetWithTagsAsync(
                RedisCacheService.TaskKey(updatedTask.Id),
                updatedTask,
                new[] { TASKS_TAG, $"{USER_TASKS_TAG}_{updatedTask.AssignedUserId}" },
                TimeSpan.FromMinutes(30)
            );
            
            _logger.LogDebug("Updated task {TaskId} and refreshed cache", updatedTask.Id);
            return updatedTask;
        }

        public async Task DeleteAsync(int id)
        {
            await _baseRepository.DeleteAsync(id);
            
            // Remove from cache and invalidate related caches
            await _cache.RemoveAsync(RedisCacheService.TaskKey(id));
            await InvalidateTaskCaches();
            
            _logger.LogDebug("Deleted task {TaskId} and invalidated caches", id);
        }

        public async Task<IEnumerable<Models.Task>> GetByUserIdAsync(int userId)
        {
            return await _cache.GetOrSetAsync(
                RedisCacheService.UserTasksKey(userId),
                async cancellationToken => await _baseRepository.GetByUserIdAsync(userId),
                TimeSpan.FromMinutes(10)
            ) ?? Enumerable.Empty<Models.Task>();
        }

        public async Task<IEnumerable<Models.Task>> GetByCategoryIdAsync(int categoryId)
        {
            var cacheKey = $"tasks:category:{categoryId}";
            return await _cache.GetOrSetAsync(
                cacheKey,
                async cancellationToken => await _baseRepository.GetByCategoryIdAsync(categoryId),
                TimeSpan.FromMinutes(15)
            ) ?? Enumerable.Empty<Models.Task>();
        }

        public async Task<IEnumerable<Models.Task>> GetByStatusAsync(TaskStatus status)
        {
            var cacheKey = $"tasks:status:{status}";
            return await _cache.GetOrSetAsync(
                cacheKey,
                async cancellationToken => await _baseRepository.GetByStatusAsync(status),
                TimeSpan.FromMinutes(10)
            ) ?? Enumerable.Empty<Models.Task>();
        }

        public async Task<IEnumerable<Models.Task>> SearchAsync(string searchTerm)
        {
            // Don't cache search results as they're highly variable
            return await _baseRepository.SearchAsync(searchTerm);
        }

        public async Task<int> GetCountByStatusAsync(TaskStatus status)
        {
            var cacheKey = $"tasks:count:status:{status}";
            return await _cache.GetOrSetAsync(
                cacheKey,
                async cancellationToken => await _baseRepository.GetCountByStatusAsync(status),
                TimeSpan.FromMinutes(5)
            ) ?? 0;
        }

        public async Task<IEnumerable<Models.Task>> GetRecentAsync(int count = 10)
        {
            var cacheKey = $"tasks:recent:{count}";
            return await _cache.GetOrSetAsync(
                cacheKey,
                async cancellationToken => await _baseRepository.GetRecentAsync(count),
                TimeSpan.FromMinutes(5)
            ) ?? Enumerable.Empty<Models.Task>();
        }

        public async Task<IEnumerable<Models.Task>> GetOverdueAsync()
        {
            var cacheKey = "tasks:overdue";
            return await _cache.GetOrSetAsync(
                cacheKey,
                async cancellationToken => await _baseRepository.GetOverdueAsync(),
                TimeSpan.FromMinutes(2) // Short cache time for overdue tasks
            ) ?? Enumerable.Empty<Models.Task>();
        }

        public async Task<bool> ExistsAsync(int id)
        {
            // Check cache first
            var cachedTask = await _cache.GetAsync<Models.Task>(RedisCacheService.TaskKey(id));
            if (cachedTask != null)
                return true;
                
            return await _baseRepository.ExistsAsync(id);
        }

        public async Task<IEnumerable<Models.Task>> GetTasksDueSoonAsync(int days = 7)
        {
            var cacheKey = $"tasks:due_soon:{days}";
            return await _cache.GetOrSetAsync(
                cacheKey,
                async cancellationToken => await _baseRepository.GetTasksDueSoonAsync(days),
                TimeSpan.FromMinutes(10)
            ) ?? Enumerable.Empty<Models.Task>();
        }

        private async Task InvalidateTaskCaches()
        {
            try
            {
                // Invalidate task-related caches
                await _cache.InvalidateTagAsync(TASKS_TAG);
                await _cache.RemoveByPatternAsync("tasks:*");
                
                _logger.LogDebug("Invalidated task-related caches");
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to invalidate task caches");
            }
        }
    }
}