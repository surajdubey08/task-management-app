using Microsoft.Extensions.Caching.Memory;
using System.Text.Json;

namespace TaskManagement.API.Services
{
    public class MemoryCacheService : ICacheService
    {
        private readonly IMemoryCache _memoryCache;
        private readonly ILogger<MemoryCacheService> _logger;
        private readonly HashSet<string> _keys = new();
        private readonly object _lockObject = new();

        public MemoryCacheService(IMemoryCache memoryCache, ILogger<MemoryCacheService> logger)
        {
            _memoryCache = memoryCache;
            _logger = logger;
        }

        public async Task<T?> GetAsync<T>(string key, CancellationToken cancellationToken = default) where T : class
        {
            try
            {
                return _memoryCache.Get<T>(key);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to get from memory cache: {Key}", key);
                return null;
            }
        }

        public async Task SetAsync<T>(string key, T value, TimeSpan? expiration = null, CancellationToken cancellationToken = default) where T : class
        {
            try
            {
                var options = new MemoryCacheEntryOptions();
                
                if (expiration.HasValue)
                {
                    options.SetAbsoluteExpiration(expiration.Value);
                }
                else
                {
                    options.SetAbsoluteExpiration(TimeSpan.FromMinutes(15));
                }

                _memoryCache.Set(key, value, options);
                
                lock (_lockObject)
                {
                    _keys.Add(key);
                }
                
                _logger.LogDebug("Set memory cache for key: {Key}", key);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to set memory cache: {Key}", key);
            }
        }

        public async Task RemoveAsync(string key, CancellationToken cancellationToken = default)
        {
            try
            {
                _memoryCache.Remove(key);
                
                lock (_lockObject)
                {
                    _keys.Remove(key);
                }
                
                _logger.LogDebug("Removed from memory cache: {Key}", key);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to remove from memory cache: {Key}", key);
            }
        }

        public async Task RemoveByPatternAsync(string pattern, CancellationToken cancellationToken = default)
        {
            try
            {
                var keysToRemove = new List<string>();
                
                lock (_lockObject)
                {
                    keysToRemove.AddRange(_keys.Where(k => k.Contains(pattern.Replace("*", ""))));\n                }\n\n                foreach (var key in keysToRemove)\n                {\n                    await RemoveAsync(key, cancellationToken);\n                }\n                \n                _logger.LogDebug("Removed {Count} keys matching pattern: {Pattern}", keysToRemove.Count, pattern);\n            }\n            catch (Exception ex)\n            {\n                _logger.LogWarning(ex, "Failed to remove by pattern from memory cache: {Pattern}", pattern);\n            }\n        }\n\n        public async Task<bool> ExistsAsync(string key, CancellationToken cancellationToken = default)\n        {\n            try\n            {\n                return _memoryCache.TryGetValue(key, out _);\n            }\n            catch (Exception ex)\n            {\n                _logger.LogWarning(ex, "Failed to check existence in memory cache: {Key}", key);\n                return false;\n            }\n        }\n\n        public async Task FlushAsync(CancellationToken cancellationToken = default)\n        {\n            try\n            {\n                var keysToRemove = new List<string>();\n                \n                lock (_lockObject)\n                {\n                    keysToRemove.AddRange(_keys);\n                    _keys.Clear();\n                }\n\n                foreach (var key in keysToRemove)\n                {\n                    _memoryCache.Remove(key);\n                }\n                \n                _logger.LogInformation("Flushed memory cache, removed {Count} keys", keysToRemove.Count);\n            }\n            catch (Exception ex)\n            {\n                _logger.LogError(ex, "Failed to flush memory cache");\n            }\n        }\n\n        public async Task<T?> GetOrSetAsync<T>(string key, Func<CancellationToken, Task<T>> getItem, TimeSpan? expiration = null, CancellationToken cancellationToken = default) where T : class\n        {\n            var cachedValue = await GetAsync<T>(key, cancellationToken);\n            \n            if (cachedValue != null)\n            {\n                _logger.LogDebug("Memory cache hit for key: {Key}", key);\n                return cachedValue;\n            }\n\n            _logger.LogDebug("Memory cache miss for key: {Key}, fetching from source", key);\n            var value = await getItem(cancellationToken);\n            \n            if (value != null)\n            {\n                await SetAsync(key, value, expiration, cancellationToken);\n            }\n\n            return value;\n        }\n\n        public async Task InvalidateTagAsync(string tag, CancellationToken cancellationToken = default)\n        {\n            // For memory cache, we'll remove keys that contain the tag\n            await RemoveByPatternAsync(tag, cancellationToken);\n        }\n\n        public async Task SetWithTagsAsync<T>(string key, T value, IEnumerable<string> tags, TimeSpan? expiration = null, CancellationToken cancellationToken = default) where T : class\n        {\n            // For memory cache, just set normally (tags are handled differently in Redis)\n            await SetAsync(key, value, expiration, cancellationToken);\n        }\n    }\n}