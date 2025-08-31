using Microsoft.EntityFrameworkCore;
using TaskManagement.API.Data;
using TaskManagement.API.Models;
using TaskManagement.API.Services;
using TaskStatus = TaskManagement.API.Models.TaskStatus;

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

        public async Task<IEnumerable<TaskItem>> GetAllAsync()
        {
            return await _cache.GetOrSetAsync(
                "tasks:all",
                async cancellationToken => await _baseRepository.GetAllAsync(),
                TimeSpan.FromMinutes(15)
            ) ?? Enumerable.Empty<TaskItem>();
        }

        public async Task<TaskItem?> GetByIdAsync(int id)
        {
            return await _cache.GetOrSetAsync(
                $"task:{id}",
                async cancellationToken => await _baseRepository.GetByIdAsync(id),
                TimeSpan.FromMinutes(30)
            );
        }

        public async Task<TaskItem> CreateAsync(TaskItem task)
        {
            var createdTask = await _baseRepository.CreateAsync(task);
            
            // Invalidate related caches
            await InvalidateTaskCaches();
            
            // Cache the new task
            if (createdTask.Id > 0)
            {
                await _cache.SetAsync(
                    $"task:{createdTask.Id}",
                    createdTask,
                    TimeSpan.FromMinutes(30)
                );
            }
            
            _logger.LogDebug("Created task {TaskId} and invalidated related caches", createdTask.Id);
            return createdTask;
        }

        public async Task<TaskItem> UpdateAsync(TaskItem task)
        {
            var updatedTask = await _baseRepository.UpdateAsync(task);
            
            // Remove specific task from cache and invalidate lists
            await _cache.RemoveAsync($"task:{task.Id}");
            await InvalidateTaskCaches();
            
            // Cache the updated task
            await _cache.SetAsync(
                $"task:{updatedTask.Id}",
                updatedTask,
                TimeSpan.FromMinutes(30)
            );
            
            _logger.LogDebug("Updated task {TaskId} and refreshed cache", updatedTask.Id);
            return updatedTask;
        }

        public async Task<bool> DeleteAsync(int id)
        {
            var result = await _baseRepository.DeleteAsync(id);
            
            // Remove from cache and invalidate related caches
            await _cache.RemoveAsync($"task:{id}");
            await InvalidateTaskCaches();
            
            _logger.LogDebug("Deleted task {TaskId} and invalidated caches", id);
            return result;
        }

        public async Task<IEnumerable<TaskItem>> GetByUserIdAsync(int userId)
        {
            return await _cache.GetOrSetAsync(
                $"tasks:user:{userId}",
                async cancellationToken => await _baseRepository.GetByUserIdAsync(userId),
                TimeSpan.FromMinutes(10)
            ) ?? Enumerable.Empty<TaskItem>();
        }

        public async Task<IEnumerable<TaskItem>> GetByCategoryIdAsync(int categoryId)
        {
            var cacheKey = $"tasks:category:{categoryId}";
            return await _cache.GetOrSetAsync(
                cacheKey,
                async cancellationToken => await _baseRepository.GetByCategoryIdAsync(categoryId),
                TimeSpan.FromMinutes(15)
            ) ?? Enumerable.Empty<TaskItem>();
        }

        public async Task<IEnumerable<TaskItem>> GetByStatusAsync(TaskStatus status)
        {
            var cacheKey = $"tasks:status:{status}";
            return await _cache.GetOrSetAsync(
                cacheKey,
                async cancellationToken => await _baseRepository.GetByStatusAsync(status),
                TimeSpan.FromMinutes(10)
            ) ?? Enumerable.Empty<TaskItem>();
        }

        public async Task<bool> ExistsAsync(int id)
        {
            // Check cache first
            var cachedTask = await _cache.GetAsync<TaskItem>($"task:{id}");
            if (cachedTask != null)
                return true;
                
            return await _baseRepository.ExistsAsync(id);
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