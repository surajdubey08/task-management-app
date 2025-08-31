using System.Text.Json;
using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Extensions.Caching.Memory;

namespace TaskManagement.API.Services
{
    /// <summary>
    /// Interface for cache service with both in-memory and distributed caching capabilities
    /// </summary>
    public interface ICacheService
    {
        Task<T?> GetAsync<T>(string key, CancellationToken cancellationToken = default);
        Task SetAsync<T>(string key, T value, TimeSpan? expiration = null, CancellationToken cancellationToken = default);
        Task RemoveAsync(string key, CancellationToken cancellationToken = default);
        Task RemoveByPatternAsync(string pattern, CancellationToken cancellationToken = default);
        Task<bool> ExistsAsync(string key, CancellationToken cancellationToken = default);
        Task ClearAsync(CancellationToken cancellationToken = default);
        Task RefreshAsync(string key, CancellationToken cancellationToken = default);
        
        // Cache with factory method (GetOrSet pattern)
        Task<T?> GetOrSetAsync<T>(string key, Func<CancellationToken, Task<T?>> factory, TimeSpan? expiration = null, CancellationToken cancellationToken = default);
        
        // Tag-based invalidation
        Task InvalidateTagAsync(string tag, CancellationToken cancellationToken = default);
        
        // Batch operations
        Task SetManyAsync<T>(Dictionary<string, T> items, TimeSpan? expiration = null, CancellationToken cancellationToken = default);
        Task<Dictionary<string, T?>> GetManyAsync<T>(IEnumerable<string> keys, CancellationToken cancellationToken = default);
        Task RemoveManyAsync(IEnumerable<string> keys, CancellationToken cancellationToken = default);
        
        // Cache statistics
        Task<CacheStatistics> GetStatisticsAsync(CancellationToken cancellationToken = default);
    }

    /// <summary>
    /// Memory and distributed cache service implementation
    /// </summary>
    public class MemoryCacheService : ICacheService
    {
        private readonly IMemoryCache _memoryCache;
        private readonly IDistributedCache _distributedCache;
        private readonly ILogger<MemoryCacheService> _logger;
        private readonly JsonSerializerOptions _jsonOptions;
        private readonly SemaphoreSlim _semaphore;
        private readonly CacheStatistics _statistics;
        private readonly Dictionary<string, HashSet<string>> _taggedKeys;

        public MemoryCacheService(
            IMemoryCache memoryCache,
            IDistributedCache distributedCache,
            ILogger<MemoryCacheService> logger)
        {
            _memoryCache = memoryCache;
            _distributedCache = distributedCache;
            _logger = logger;
            _semaphore = new SemaphoreSlim(1, 1);
            _statistics = new CacheStatistics();
            _taggedKeys = new Dictionary<string, HashSet<string>>();
            
            _jsonOptions = new JsonSerializerOptions
            {
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
                PropertyNameCaseInsensitive = true,
                DefaultIgnoreCondition = System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull
            };
        }

        public async Task<T?> GetAsync<T>(string key, CancellationToken cancellationToken = default)
        {
            if (string.IsNullOrEmpty(key))
                throw new ArgumentException("Cache key cannot be null or empty", nameof(key));

            try
            {
                _statistics.TotalRequests++;

                // Try memory cache first
                if (_memoryCache.TryGetValue(key, out T? memoryValue))
                {
                    _statistics.MemoryHits++;
                    _logger.LogDebug("Cache hit in memory for key: {Key}", key);
                    return memoryValue;
                }

                // Try distributed cache
                var distributedValue = await _distributedCache.GetStringAsync(key, cancellationToken);
                if (!string.IsNullOrEmpty(distributedValue))
                {
                    var deserializedValue = JsonSerializer.Deserialize<T>(distributedValue, _jsonOptions);
                    
                    // Store back in memory cache for faster access
                    _memoryCache.Set(key, deserializedValue, TimeSpan.FromMinutes(5));
                    
                    _statistics.DistributedHits++;
                    _logger.LogDebug("Cache hit in distributed cache for key: {Key}", key);
                    return deserializedValue;
                }

                _statistics.Misses++;
                _logger.LogDebug("Cache miss for key: {Key}", key);
                return default;
            }
            catch (Exception ex)
            {
                _statistics.Errors++;
                _logger.LogError(ex, "Error getting cache value for key: {Key}", key);
                return default;
            }
        }

        public async Task SetAsync<T>(string key, T value, TimeSpan? expiration = null, CancellationToken cancellationToken = default)
        {
            if (string.IsNullOrEmpty(key))
                throw new ArgumentException("Cache key cannot be null or empty", nameof(key));

            if (value == null)
                return;

            try
            {
                var actualExpiration = expiration ?? TimeSpan.FromMinutes(15);
                
                // Set in memory cache
                _memoryCache.Set(key, value, actualExpiration);
                
                // Set in distributed cache
                var serializedValue = JsonSerializer.Serialize(value, _jsonOptions);
                await _distributedCache.SetStringAsync(key, serializedValue, new DistributedCacheEntryOptions
                {
                    AbsoluteExpirationRelativeToNow = actualExpiration
                }, cancellationToken);

                _statistics.Sets++;
                _logger.LogDebug("Cache set for key: {Key} with expiration: {Expiration}", key, actualExpiration);
            }
            catch (Exception ex)
            {
                _statistics.Errors++;
                _logger.LogError(ex, "Error setting cache value for key: {Key}", key);
            }
        }

        public async Task RemoveAsync(string key, CancellationToken cancellationToken = default)
        {
            if (string.IsNullOrEmpty(key))
                return;

            try
            {
                // Remove from memory cache
                _memoryCache.Remove(key);
                
                // Remove from distributed cache
                await _distributedCache.RemoveAsync(key, cancellationToken);

                _statistics.Removes++;
                _logger.LogDebug("Cache removed for key: {Key}", key);
            }
            catch (Exception ex)
            {
                _statistics.Errors++;
                _logger.LogError(ex, "Error removing cache value for key: {Key}", key);
            }
        }

        public async Task RemoveByPatternAsync(string pattern, CancellationToken cancellationToken = default)
        {
            if (string.IsNullOrEmpty(pattern))
                return;

            try
            {
                // For in-memory only implementation, we'll use a simplified approach
                // This is a basic implementation - in production you might want a more sophisticated pattern matching
                _logger.LogWarning("RemoveByPatternAsync is not fully implemented for in-memory cache only. Pattern: {Pattern}", pattern);
                await Task.CompletedTask;
            }
            catch (Exception ex)
            {
                _statistics.Errors++;
                _logger.LogError(ex, "Error removing cache keys by pattern: {Pattern}", pattern);
            }
        }

        public async Task<bool> ExistsAsync(string key, CancellationToken cancellationToken = default)
        {
            if (string.IsNullOrEmpty(key))
                return false;

            try
            {
                // Check memory cache first
                if (_memoryCache.TryGetValue(key, out _))
                    return true;

                // Check distributed cache
                var value = await _distributedCache.GetStringAsync(key, cancellationToken);
                return !string.IsNullOrEmpty(value);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking cache key existence: {Key}", key);
                return false;
            }
        }

        public async Task ClearAsync(CancellationToken cancellationToken = default)
        {
            try
            {
                // Clear memory cache (this is tricky with IMemoryCache, so we'll use a workaround)
                if (_memoryCache is MemoryCache mc)
                {
                    mc.Compact(1.0); // Remove all entries
                }

                _logger.LogInformation("Cache cleared successfully");
                await Task.CompletedTask;
            }
            catch (Exception ex)
            {
                _statistics.Errors++;
                _logger.LogError(ex, "Error clearing cache");
            }
        }

        public async Task RefreshAsync(string key, CancellationToken cancellationToken = default)
        {
            if (string.IsNullOrEmpty(key))
                return;

            try
            {
                await _distributedCache.RefreshAsync(key, cancellationToken);
                _logger.LogDebug("Cache refreshed for key: {Key}", key);
            }
            catch (Exception ex)
            {
                _statistics.Errors++;
                _logger.LogError(ex, "Error refreshing cache for key: {Key}", key);
            }
        }

        public async Task<T?> GetOrSetAsync<T>(string key, Func<CancellationToken, Task<T?>> factory, TimeSpan? expiration = null, CancellationToken cancellationToken = default)
        {
            if (string.IsNullOrEmpty(key))
                throw new ArgumentException("Cache key cannot be null or empty", nameof(key));

            if (factory == null)
                throw new ArgumentNullException(nameof(factory));

            try
            {
                // Try to get from cache first
                var cachedValue = await GetAsync<T>(key, cancellationToken);
                if (cachedValue != null)
                {
                    return cachedValue;
                }

                // Use semaphore to prevent multiple concurrent factory calls for same key
                await _semaphore.WaitAsync(cancellationToken);
                try
                {
                    // Double-check after acquiring semaphore
                    cachedValue = await GetAsync<T>(key, cancellationToken);
                    if (cachedValue != null)
                    {
                        return cachedValue;
                    }

                    // Call factory to get value
                    var newValue = await factory(cancellationToken);
                    if (newValue != null)
                    {
                        await SetAsync(key, newValue, expiration, cancellationToken);
                    }

                    return newValue;
                }
                finally
                {
                    _semaphore.Release();
                }
            }
            catch (Exception ex)
            {
                _statistics.Errors++;
                _logger.LogError(ex, "Error in GetOrSetAsync for key: {Key}", key);
                return default;
            }
        }

        public async Task InvalidateTagAsync(string tag, CancellationToken cancellationToken = default)
        {
            if (string.IsNullOrEmpty(tag))
                return;

            try
            {
                await _semaphore.WaitAsync(cancellationToken);
                try
                {
                    // Remove keys associated with this tag
                    if (_taggedKeys.TryGetValue(tag, out var keys))
                    {
                        var tasks = keys.Select(key => RemoveAsync(key, cancellationToken));
                        await Task.WhenAll(tasks);
                        _taggedKeys.Remove(tag);
                    }
                }
                finally
                {
                    _semaphore.Release();
                }
                
                _logger.LogDebug("Invalidated cache entries for tag: {Tag}", tag);
            }
            catch (Exception ex)
            {
                _statistics.Errors++;
                _logger.LogError(ex, "Error invalidating cache by tag: {Tag}", tag);
            }
        }

        public async Task SetManyAsync<T>(Dictionary<string, T> items, TimeSpan? expiration = null, CancellationToken cancellationToken = default)
        {
            if (items == null || !items.Any())
                return;

            await _semaphore.WaitAsync(cancellationToken);
            try
            {
                var tasks = items.Select(kvp => SetAsync(kvp.Key, kvp.Value, expiration, cancellationToken));
                await Task.WhenAll(tasks);
                
                _logger.LogDebug("Set {Count} cache entries in batch", items.Count);
            }
            finally
            {
                _semaphore.Release();
            }
        }

        public async Task<Dictionary<string, T?>> GetManyAsync<T>(IEnumerable<string> keys, CancellationToken cancellationToken = default)
        {
            var result = new Dictionary<string, T?>();
            
            if (keys == null || !keys.Any())
                return result;

            var tasks = keys.Select(async key =>
            {
                var value = await GetAsync<T>(key, cancellationToken);
                return new { Key = key, Value = value };
            });

            var results = await Task.WhenAll(tasks);
            
            foreach (var item in results)
            {
                result[item.Key] = item.Value;
            }

            return result;
        }

        public async Task RemoveManyAsync(IEnumerable<string> keys, CancellationToken cancellationToken = default)
        {
            if (keys == null || !keys.Any())
                return;

            await _semaphore.WaitAsync(cancellationToken);
            try
            {
                var tasks = keys.Select(key => RemoveAsync(key, cancellationToken));
                await Task.WhenAll(tasks);
                
                _logger.LogDebug("Removed {Count} cache entries in batch", keys.Count());
            }
            finally
            {
                _semaphore.Release();
            }
        }

        public async Task<CacheStatistics> GetStatisticsAsync(CancellationToken cancellationToken = default)
        {
            await Task.CompletedTask; // For consistency with async pattern
            return _statistics.Clone();
        }

        public void Dispose()
        {
            _semaphore?.Dispose();
        }
    }

    /// <summary>
    /// Cache statistics for monitoring and debugging
    /// </summary>
    public class CacheStatistics
    {
        public long TotalRequests { get; set; }
        public long MemoryHits { get; set; }
        public long DistributedHits { get; set; }
        public long Misses { get; set; }
        public long Sets { get; set; }
        public long Removes { get; set; }
        public long Errors { get; set; }
        public DateTime StartTime { get; set; } = DateTime.UtcNow;

        public double MemoryHitRate => TotalRequests > 0 ? (double)MemoryHits / TotalRequests * 100 : 0;
        public double DistributedHitRate => TotalRequests > 0 ? (double)DistributedHits / TotalRequests * 100 : 0;
        public double TotalHitRate => TotalRequests > 0 ? (double)(MemoryHits + DistributedHits) / TotalRequests * 100 : 0;
        public double MissRate => TotalRequests > 0 ? (double)Misses / TotalRequests * 100 : 0;
        public double ErrorRate => TotalRequests > 0 ? (double)Errors / TotalRequests * 100 : 0;

        public CacheStatistics Clone()
        {
            return new CacheStatistics
            {
                TotalRequests = TotalRequests,
                MemoryHits = MemoryHits,
                DistributedHits = DistributedHits,
                Misses = Misses,
                Sets = Sets,
                Removes = Removes,
                Errors = Errors,
                StartTime = StartTime
            };
        }
    }

    /// <summary>
    /// Cache key helper for generating consistent cache keys
    /// </summary>
    public static class CacheKeys
    {
        private const string USER_PREFIX = "user";
        private const string TASK_PREFIX = "task";
        private const string CATEGORY_PREFIX = "category";
        private const string STATS_PREFIX = "stats";
        
        public static string User(int userId) => $"{USER_PREFIX}:{userId}";
        public static string UserByEmail(string email) => $"{USER_PREFIX}:email:{email}";
        public static string UserTasks(int userId) => $"{USER_PREFIX}:{userId}:tasks";
        
        public static string Task(int taskId) => $"{TASK_PREFIX}:{taskId}";
        public static string TasksByUser(int userId) => $"{TASK_PREFIX}:user:{userId}";
        public static string TasksByCategory(int categoryId) => $"{TASK_PREFIX}:category:{categoryId}";
        public static string TasksByStatus(string status) => $"{TASK_PREFIX}:status:{status}";
        
        public static string Category(int categoryId) => $"{CATEGORY_PREFIX}:{categoryId}";
        public static string CategoriesByUser(int userId) => $"{CATEGORY_PREFIX}:user:{userId}";
        public static string AllCategories() => $"{CATEGORY_PREFIX}:all";
        
        public static string DashboardStats(int userId) => $"{STATS_PREFIX}:dashboard:{userId}";
        public static string TaskStatistics(int userId) => $"{STATS_PREFIX}:tasks:{userId}";
        public static string UserStatistics() => $"{STATS_PREFIX}:users";
        
        public static string GenerateKey(string prefix, params object[] identifiers)
        {
            var parts = new List<string> { prefix };
            parts.AddRange(identifiers.Select(id => id?.ToString() ?? "null"));
            return string.Join(":", parts);
        }
    }
}