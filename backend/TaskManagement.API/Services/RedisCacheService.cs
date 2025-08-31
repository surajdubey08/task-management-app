using Microsoft.Extensions.Caching.Distributed;
using System.Text.Json;
using StackExchange.Redis;

namespace TaskManagement.API.Services
{
    public class RedisCacheService : ICacheService
    {
        private readonly IDistributedCache _distributedCache;
        private readonly IConnectionMultiplexer _redis;
        private readonly IDatabase _database;
        private readonly ILogger<RedisCacheService> _logger;
        private readonly JsonSerializerOptions _jsonOptions;

        // Cache key prefixes for organization
        private const string TASK_PREFIX = "task:";
        private const string USER_PREFIX = "user:";
        private const string CATEGORY_PREFIX = "category:";
        private const string TAG_PREFIX = "tag:";

        public RedisCacheService(
            IDistributedCache distributedCache,
            IConnectionMultiplexer redis,
            ILogger<RedisCacheService> logger)
        {
            _distributedCache = distributedCache;
            _redis = redis;
            _database = redis.GetDatabase();
            _logger = logger;
            
            _jsonOptions = new JsonSerializerOptions
            {
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
                WriteIndented = false
            };
        }

        public async Task<T?> GetAsync<T>(string key, CancellationToken cancellationToken = default) where T : class
        {
            try
            {
                var cachedValue = await _distributedCache.GetStringAsync(key, cancellationToken);
                
                if (string.IsNullOrEmpty(cachedValue))
                    return null;

                return JsonSerializer.Deserialize<T>(cachedValue, _jsonOptions);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to retrieve cache key: {Key}", key);
                return null;
            }
        }

        public async Task SetAsync<T>(string key, T value, TimeSpan? expiration = null, CancellationToken cancellationToken = default) where T : class
        {
            try
            {
                var serializedValue = JsonSerializer.Serialize(value, _jsonOptions);
                
                var options = new DistributedCacheEntryOptions();
                if (expiration.HasValue)
                {
                    options.SetAbsoluteExpiration(expiration.Value);
                }
                else
                {
                    // Default expiration times based on data type
                    options.SetAbsoluteExpiration(GetDefaultExpiration(key));
                }

                await _distributedCache.SetStringAsync(key, serializedValue, options, cancellationToken);
                
                _logger.LogDebug("Cache set for key: {Key} with expiration: {Expiration}", key, options.AbsoluteExpirationRelativeToNow);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to set cache key: {Key}", key);
            }
        }

        public async Task RemoveAsync(string key, CancellationToken cancellationToken = default)
        {
            try
            {
                await _distributedCache.RemoveAsync(key, cancellationToken);
                _logger.LogDebug("Cache removed for key: {Key}", key);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to remove cache key: {Key}", key);
            }
        }

        public async Task RemoveByPatternAsync(string pattern, CancellationToken cancellationToken = default)
        {
            try
            {
                var server = _redis.GetServer(_redis.GetEndPoints().First());
                var keys = server.Keys(pattern: pattern).ToArray();
                
                if (keys.Length > 0)
                {
                    await _database.KeyDeleteAsync(keys);
                    _logger.LogDebug("Removed {Count} cache keys matching pattern: {Pattern}", keys.Length, pattern);
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to remove cache keys by pattern: {Pattern}", pattern);
            }
        }

        public async Task<bool> ExistsAsync(string key, CancellationToken cancellationToken = default)
        {
            try
            {
                return await _database.KeyExistsAsync(key);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to check cache key existence: {Key}", key);
                return false;
            }
        }

        public async Task FlushAsync(CancellationToken cancellationToken = default)
        {
            try
            {
                var server = _redis.GetServer(_redis.GetEndPoints().First());
                await server.FlushDatabaseAsync();
                _logger.LogInformation("Cache flushed");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to flush cache");
            }
        }

        public async Task<T?> GetOrSetAsync<T>(string key, Func<CancellationToken, Task<T>> getItem, TimeSpan? expiration = null, CancellationToken cancellationToken = default) where T : class
        {
            var cachedValue = await GetAsync<T>(key, cancellationToken);
            
            if (cachedValue != null)
            {
                _logger.LogDebug("Cache hit for key: {Key}", key);
                return cachedValue;
            }

            _logger.LogDebug("Cache miss for key: {Key}, fetching from source", key);
            var value = await getItem(cancellationToken);
            
            if (value != null)
            {
                await SetAsync(key, value, expiration, cancellationToken);
            }

            return value;
        }

        public async Task InvalidateTagAsync(string tag, CancellationToken cancellationToken = default)
        {
            try
            {
                var tagKey = $"{TAG_PREFIX}{tag}";
                var taggedKeys = await _database.SetMembersAsync(tagKey);
                
                if (taggedKeys.Length > 0)
                {
                    var keysToDelete = taggedKeys.Select(k => (RedisKey)k.ToString()).ToArray();
                    await _database.KeyDeleteAsync(keysToDelete);
                    await _database.KeyDeleteAsync(tagKey); // Remove the tag set itself
                    
                    _logger.LogDebug("Invalidated {Count} cache keys for tag: {Tag}", taggedKeys.Length, tag);
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to invalidate cache tag: {Tag}", tag);
            }
        }

        public async Task SetWithTagsAsync<T>(string key, T value, IEnumerable<string> tags, TimeSpan? expiration = null, CancellationToken cancellationToken = default) where T : class
        {
            await SetAsync(key, value, expiration, cancellationToken);
            
            try
            {
                // Add key to tag sets for invalidation
                foreach (var tag in tags)
                {
                    var tagKey = $"{TAG_PREFIX}{tag}";
                    await _database.SetAddAsync(tagKey, key);
                    
                    // Set expiration for tag set (longer than data expiration)
                    var tagExpiration = expiration?.Add(TimeSpan.FromMinutes(10)) ?? TimeSpan.FromHours(2);
                    await _database.KeyExpireAsync(tagKey, tagExpiration);
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to set cache tags for key: {Key}", key);
            }
        }

        private TimeSpan GetDefaultExpiration(string key)
        {
            return key switch
            {
                var k when k.StartsWith(TASK_PREFIX) => TimeSpan.FromMinutes(15),
                var k when k.StartsWith(USER_PREFIX) => TimeSpan.FromMinutes(30),
                var k when k.StartsWith(CATEGORY_PREFIX) => TimeSpan.FromHours(1),
                _ => TimeSpan.FromMinutes(10)
            };
        }

        // Helper methods for generating cache keys
        public static string TaskKey(int id) => $"{TASK_PREFIX}{id}";
        public static string TasksListKey(string? filters = null) => $"{TASK_PREFIX}list:{filters ?? "all"}";
        public static string UserKey(int id) => $"{USER_PREFIX}{id}";
        public static string UsersListKey() => $"{USER_PREFIX}list";
        public static string CategoryKey(int id) => $"{CATEGORY_PREFIX}{id}";
        public static string CategoriesListKey() => $"{CATEGORY_PREFIX}list";
        public static string UserTasksKey(int userId) => $"{USER_PREFIX}{userId}:tasks";
        public static string TaskCommentsKey(int taskId) => $"{TASK_PREFIX}{taskId}:comments";
        public static string TaskActivitiesKey(int taskId) => $"{TASK_PREFIX}{taskId}:activities";
    }
}