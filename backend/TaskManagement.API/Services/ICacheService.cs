namespace TaskManagement.API.Services
{
    public interface ICacheService
    {
        Task<T?> GetAsync<T>(string key, CancellationToken cancellationToken = default) where T : class;
        Task SetAsync<T>(string key, T value, TimeSpan? expiration = null, CancellationToken cancellationToken = default) where T : class;
        Task RemoveAsync(string key, CancellationToken cancellationToken = default);
        Task RemoveByPatternAsync(string pattern, CancellationToken cancellationToken = default);
        Task<bool> ExistsAsync(string key, CancellationToken cancellationToken = default);
        Task FlushAsync(CancellationToken cancellationToken = default);
        
        // Specialized methods for common operations
        Task<T?> GetOrSetAsync<T>(string key, Func<CancellationToken, Task<T>> getItem, TimeSpan? expiration = null, CancellationToken cancellationToken = default) where T : class;
        Task InvalidateTagAsync(string tag, CancellationToken cancellationToken = default);
        Task SetWithTagsAsync<T>(string key, T value, IEnumerable<string> tags, TimeSpan? expiration = null, CancellationToken cancellationToken = default) where T : class;
    }
}