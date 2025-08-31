using System.Collections.Concurrent;
using System.Net;

namespace TaskManagement.API.Middleware
{
    public class RateLimitingMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<RateLimitingMiddleware> _logger;
        private readonly RateLimitOptions _options;
        private static readonly ConcurrentDictionary<string, ClientStatistics> _clients = new();

        public RateLimitingMiddleware(
            RequestDelegate next,
            ILogger<RateLimitingMiddleware> logger,
            RateLimitOptions options)
        {
            _next = next;
            _logger = logger;
            _options = options;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            var endpoint = context.GetEndpoint();
            var rateLimitAttribute = endpoint?.Metadata.GetMetadata<RateLimitAttribute>();
            
            if (rateLimitAttribute != null)
            {
                var clientId = GetClientIdentifier(context);
                var key = $"{clientId}:{rateLimitAttribute.Resource}";
                
                var clientStats = _clients.GetOrAdd(key, _ => new ClientStatistics());
                
                var now = DateTime.UtcNow;
                var windowStart = now.AddMinutes(-rateLimitAttribute.WindowMinutes);
                
                // Remove old requests
                clientStats.RequestTimes.RemoveWhere(time => time < windowStart);
                
                if (clientStats.RequestTimes.Count >= rateLimitAttribute.MaxRequests)
                {
                    _logger.LogWarning("Rate limit exceeded for client {ClientId} on resource {Resource}", 
                        clientId, rateLimitAttribute.Resource);
                    
                    context.Response.StatusCode = (int)HttpStatusCode.TooManyRequests;
                    context.Response.Headers.Add("Retry-After", "60");
                    await context.Response.WriteAsync("Rate limit exceeded. Try again later.");
                    return;
                }
                
                clientStats.RequestTimes.Add(now);
            }
            
            await _next(context);
        }
        
        private string GetClientIdentifier(HttpContext context)
        {
            // Try to get user ID from JWT claims first
            var userId = context.User?.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (!string.IsNullOrEmpty(userId))
            {
                return $"user:{userId}";
            }
            
            // Fall back to IP address
            var forwardedFor = context.Request.Headers["X-Forwarded-For"].FirstOrDefault();
            if (!string.IsNullOrEmpty(forwardedFor))
            {
                return forwardedFor.Split(',')[0].Trim();
            }
            
            return context.Connection.RemoteIpAddress?.ToString() ?? "unknown";
        }
    }

    public class ClientStatistics
    {
        public HashSet<DateTime> RequestTimes { get; } = new();
    }

    public class RateLimitOptions
    {
        public int DefaultMaxRequests { get; set; } = 100;
        public int DefaultWindowMinutes { get; set; } = 15;
        public bool EnableGlobalRateLimit { get; set; } = true;
    }

    [AttributeUsage(AttributeTargets.Method | AttributeTargets.Class)]
    public class RateLimitAttribute : Attribute
    {
        public string Resource { get; }
        public int MaxRequests { get; }
        public int WindowMinutes { get; }

        public RateLimitAttribute(string resource, int maxRequests = 10, int windowMinutes = 1)
        {
            Resource = resource;
            MaxRequests = maxRequests;
            WindowMinutes = windowMinutes;
        }
    }

    public static class RateLimitingExtensions
    {
        public static IServiceCollection AddRateLimiting(this IServiceCollection services, 
            Action<RateLimitOptions>? configureOptions = null)
        {
            var options = new RateLimitOptions();
            configureOptions?.Invoke(options);
            services.AddSingleton(options);
            
            return services;
        }

        public static IApplicationBuilder UseRateLimiting(this IApplicationBuilder app)
        {
            return app.UseMiddleware<RateLimitingMiddleware>();
        }
    }
}