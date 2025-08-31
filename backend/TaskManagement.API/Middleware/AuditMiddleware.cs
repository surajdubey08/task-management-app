using System.Diagnostics;
using System.Security.Claims;
using TaskManagement.API.Models;
using TaskManagement.API.Services;

namespace TaskManagement.API.Middleware
{
    public class AuditMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<AuditMiddleware> _logger;
        private readonly IServiceScopeFactory _serviceScopeFactory;

        private static readonly HashSet<string> _auditablePaths = new(StringComparer.OrdinalIgnoreCase)
        {
            \"/api/tasks\",
            \"/api/users\", 
            \"/api/categories\",
            \"/api/auth\"
        };

        private static readonly HashSet<string> _auditableMethods = new(StringComparer.OrdinalIgnoreCase)
        {
            \"POST\", \"PUT\", \"DELETE\", \"PATCH\"
        };

        public AuditMiddleware(
            RequestDelegate next, 
            ILogger<AuditMiddleware> logger,
            IServiceScopeFactory serviceScopeFactory)
        {
            _next = next;
            _logger = logger;
            _serviceScopeFactory = serviceScopeFactory;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            var stopwatch = Stopwatch.StartNew();
            var originalBodyStream = context.Response.Body;
            
            using var responseBody = new MemoryStream();
            context.Response.Body = responseBody;

            try
            {
                await _next(context);
                
                stopwatch.Stop();
                
                // Log the request if it's auditable
                if (ShouldAuditRequest(context))
                {
                    await LogRequestAsync(context, stopwatch.ElapsedMilliseconds);
                }
            }
            catch (Exception ex)
            {
                stopwatch.Stop();
                
                if (ShouldAuditRequest(context))
                {
                    await LogRequestAsync(context, stopwatch.ElapsedMilliseconds, ex);
                }
                
                throw;
            }
            finally
            {
                await responseBody.CopyToAsync(originalBodyStream);
            }
        }

        private bool ShouldAuditRequest(HttpContext context)
        {
            var path = context.Request.Path.Value ?? string.Empty;
            var method = context.Request.Method;

            // Skip non-auditable methods
            if (!_auditableMethods.Contains(method) && method != \"GET\")
                return false;

            // Check if path starts with any auditable path
            return _auditablePaths.Any(auditablePath => 
                path.StartsWith(auditablePath, StringComparison.OrdinalIgnoreCase));
        }

        private async Task LogRequestAsync(HttpContext context, long executionTimeMs, Exception? exception = null)
        {
            try
            {
                using var scope = _serviceScopeFactory.CreateScope();
                var auditService = scope.ServiceProvider.GetRequiredService<IAuditService>();
                
                var userId = GetUserId(context);
                if (!userId.HasValue) return; // Skip if no authenticated user
                
                var entityInfo = ExtractEntityInfo(context);
                var action = DetermineAction(context.Request.Method, context.Response.StatusCode);
                
                var additionalData = new
                {
                    RequestMethod = context.Request.Method,
                    RequestPath = context.Request.Path.Value,
                    QueryString = context.Request.QueryString.Value,
                    StatusCode = context.Response.StatusCode,
                    ExecutionTimeMs = executionTimeMs,
                    Exception = exception?.Message,
                    UserAgent = context.Request.Headers[\"User-Agent\"].FirstOrDefault(),
                    ContentType = context.Request.ContentType,
                    ContentLength = context.Request.ContentLength
                };
                
                var summary = GenerateRequestSummary(context, exception);
                
                await auditService.LogAsync(
                    entityInfo.EntityType,
                    entityInfo.EntityId,
                    action,
                    userId.Value,
                    summary,
                    additionalData: additionalData);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, \"Failed to log audit trail for request {Method} {Path}\", 
                    context.Request.Method, context.Request.Path);
            }
        }

        private int? GetUserId(HttpContext context)
        {
            var userIdClaim = context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return int.TryParse(userIdClaim, out var userId) ? userId : null;
        }

        private (string EntityType, int EntityId) ExtractEntityInfo(HttpContext context)
        {
            var path = context.Request.Path.Value ?? string.Empty;
            var segments = path.Split('/', StringSplitOptions.RemoveEmptyEntries);
            
            if (segments.Length >= 2)
            {
                var entityType = segments[1].TrimEnd('s'); // Remove trailing 's' (tasks -> task)
                
                // Try to extract entity ID from path
                if (segments.Length >= 3 && int.TryParse(segments[2], out var entityId))
                {
                    return (entityType, entityId);
                }
                
                // For POST requests, entity ID might be in response or generated
                if (context.Request.Method == \"POST\")
                {
                    return (entityType, 0); // Will be updated when entity is created
                }
            }
            
            return (\"Unknown\", 0);
        }

        private string DetermineAction(string httpMethod, int statusCode)
        {
            return httpMethod.ToUpper() switch
            {
                \"GET\" => AuditActions.VIEW,
                \"POST\" => statusCode >= 200 && statusCode < 300 ? AuditActions.CREATE : \"CREATE_FAILED\",
                \"PUT\" or \"PATCH\" => statusCode >= 200 && statusCode < 300 ? AuditActions.UPDATE : \"UPDATE_FAILED\",
                \"DELETE\" => statusCode >= 200 && statusCode < 300 ? AuditActions.DELETE : \"DELETE_FAILED\",
                _ => httpMethod
            };
        }

        private string GenerateRequestSummary(HttpContext context, Exception? exception)
        {
            var method = context.Request.Method;
            var path = context.Request.Path.Value ?? string.Empty;
            var statusCode = context.Response.StatusCode;
            
            if (exception != null)
            {
                return $\"{method} {path} failed with exception: {exception.Message}\";
            }
            
            var statusDescription = statusCode switch
            {
                >= 200 and < 300 => \"successful\",
                >= 400 and < 500 => \"client error\",
                >= 500 => \"server error\",
                _ => \"completed\"
            };
            
            return $\"{method} {path} {statusDescription} (HTTP {statusCode})\";
        }
    }
    
    public static class AuditMiddlewareExtensions
    {
        public static IApplicationBuilder UseAuditLogging(this IApplicationBuilder builder)
        {
            return builder.UseMiddleware<AuditMiddleware>();
        }
    }
}