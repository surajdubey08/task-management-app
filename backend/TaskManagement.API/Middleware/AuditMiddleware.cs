using System.Diagnostics;
using System.Security.Claims;
using System.Text;
using System.Text.Json;
using TaskManagement.API.Models;
using TaskManagement.API.Services;

namespace TaskManagement.API.Middleware
{
    /// <summary>
    /// Middleware for automatic audit logging of HTTP requests and responses
    /// </summary>
    public class AuditMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<AuditMiddleware> _logger;
        private readonly AuditOptions _options;

        // Paths that should be excluded from audit logging
        private readonly HashSet<string> _excludedPaths = new(StringComparer.OrdinalIgnoreCase)
        {
            "/health",
            "/swagger",
            "/api/audit",
            "/favicon.ico"
        };

        // HTTP methods that should be audited
        private readonly HashSet<string> _auditedMethods = new(StringComparer.OrdinalIgnoreCase)
        {
            "POST",
            "PUT",
            "DELETE",
            "PATCH"
        };

        public AuditMiddleware(RequestDelegate next, ILogger<AuditMiddleware> logger, AuditOptions? options = null)
        {
            _next = next;
            _logger = logger;
            _options = options ?? new AuditOptions();
        }

        public async Task InvokeAsync(HttpContext context)
        {
            // Check if this request should be audited
            if (!ShouldAuditRequest(context))
            {
                await _next(context);
                return;
            }

            var stopwatch = Stopwatch.StartNew();
            var originalBodyStream = context.Response.Body;

            try
            {
                // Capture request details
                var requestDetails = await CaptureRequestDetailsAsync(context);

                // Create a new memory stream for the response
                using var responseBody = new MemoryStream();
                context.Response.Body = responseBody;

                // Execute the next middleware
                await _next(context);

                stopwatch.Stop();

                // Capture response details
                var responseDetails = await CaptureResponseDetailsAsync(context, responseBody);

                // Copy the response back to the original stream
                responseBody.Seek(0, SeekOrigin.Begin);
                await responseBody.CopyToAsync(originalBodyStream);

                // Create audit log entry
                await CreateAuditLogAsync(context, requestDetails, responseDetails, stopwatch.ElapsedMilliseconds);
            }
            catch (Exception ex)
            {
                stopwatch.Stop();
                
                // Log the error and still create an audit entry
                _logger.LogError(ex, "Error in audit middleware for {Method} {Path}", 
                    context.Request.Method, context.Request.Path);

                await CreateErrorAuditLogAsync(context, ex, stopwatch.ElapsedMilliseconds);
                
                // Re-throw the exception to maintain normal error handling
                throw;
            }
            finally
            {
                context.Response.Body = originalBodyStream;
            }
        }

        private bool ShouldAuditRequest(HttpContext context)
        {
            var path = context.Request.Path.Value ?? string.Empty;
            var method = context.Request.Method;

            // Skip excluded paths
            if (_excludedPaths.Any(excluded => path.StartsWith(excluded, StringComparison.OrdinalIgnoreCase)))
            {
                return false;
            }

            // Skip if method is not in audited methods and not explicitly configured
            if (!_auditedMethods.Contains(method) && !_options.AuditAllMethods)
            {
                return false;
            }

            // Skip if request is from health checks or monitoring tools
            var userAgent = context.Request.Headers.UserAgent.ToString();
            if (userAgent.Contains("HealthCheck", StringComparison.OrdinalIgnoreCase) ||
                userAgent.Contains("Probe", StringComparison.OrdinalIgnoreCase))
            {
                return false;
            }

            return true;
        }

        private async Task<RequestDetails> CaptureRequestDetailsAsync(HttpContext context)
        {
            var request = context.Request;
            string? requestBody = null;

            // Capture request body if it's not too large and not multipart
            if (_options.CaptureRequestBody && 
                request.ContentLength.HasValue && 
                request.ContentLength.Value <= _options.MaxBodySizeToCapture &&
                !request.ContentType?.Contains("multipart", StringComparison.OrdinalIgnoreCase) == true)
            {
                request.EnableBuffering();
                using var reader = new StreamReader(request.Body, Encoding.UTF8, leaveOpen: true);
                requestBody = await reader.ReadToEndAsync();
                request.Body.Position = 0;
            }

            return new RequestDetails
            {
                Path = request.Path.Value ?? string.Empty,
                Method = request.Method,
                QueryString = request.QueryString.Value ?? string.Empty,
                ContentType = request.ContentType ?? string.Empty,
                ContentLength = request.ContentLength,
                Body = requestBody,
                Headers = _options.CaptureHeaders ? 
                    request.Headers.ToDictionary(h => h.Key, h => string.Join(", ", h.Value)) : 
                    new Dictionary<string, string>(),
                IpAddress = GetClientIpAddress(context),
                UserAgent = request.Headers.UserAgent.ToString()
            };
        }

        private async Task<ResponseDetails> CaptureResponseDetailsAsync(HttpContext context, MemoryStream responseBody)
        {
            string? responseContent = null;

            // Capture response body if it's not too large
            if (_options.CaptureResponseBody && 
                responseBody.Length <= _options.MaxBodySizeToCapture)
            {
                responseBody.Seek(0, SeekOrigin.Begin);
                using var reader = new StreamReader(responseBody, Encoding.UTF8, leaveOpen: true);
                responseContent = await reader.ReadToEndAsync();
            }

            return new ResponseDetails
            {
                StatusCode = context.Response.StatusCode,
                ContentType = context.Response.ContentType ?? string.Empty,
                ContentLength = responseBody.Length,
                Body = responseContent,
                Headers = _options.CaptureHeaders ? 
                    context.Response.Headers.ToDictionary(h => h.Key, h => string.Join(", ", h.Value)) : 
                    new Dictionary<string, string>()
            };
        }

        private async Task CreateAuditLogAsync(
            HttpContext context, 
            RequestDetails requestDetails, 
            ResponseDetails responseDetails, 
            long executionTimeMs)
        {
            try
            {
                var auditService = context.RequestServices.GetService<IAuditService>();
                if (auditService == null)
                {
                    _logger.LogWarning("IAuditService not registered, skipping audit logging");
                    return;
                }

                var userId = GetUserId(context);
                var entityInfo = DetermineEntityInfo(context, requestDetails, responseDetails);

                var auditDetails = new
                {
                    Request = new
                    {
                        requestDetails.Path,
                        requestDetails.Method,
                        requestDetails.QueryString,
                        requestDetails.ContentType,
                        requestDetails.ContentLength,
                        Body = _options.CaptureRequestBody ? requestDetails.Body : "[Not Captured]",
                        Headers = requestDetails.Headers
                    },
                    Response = new
                    {
                        responseDetails.StatusCode,
                        responseDetails.ContentType,
                        responseDetails.ContentLength,
                        Body = _options.CaptureResponseBody ? responseDetails.Body : "[Not Captured]",
                        Headers = responseDetails.Headers
                    },
                    Performance = new
                    {
                        ExecutionTimeMs = executionTimeMs,
                        Timestamp = DateTime.UtcNow
                    }
                };

                var createDto = new CreateAuditLogDto
                {
                    EntityType = entityInfo.EntityType,
                    EntityId = entityInfo.EntityId,
                    Action = DetermineAction(requestDetails.Method, requestDetails.Path, responseDetails.StatusCode),
                    UserId = userId,
                    Summary = GenerateSummary(requestDetails, responseDetails),
                    Details = JsonSerializer.Serialize(auditDetails),
                    IpAddress = requestDetails.IpAddress,
                    UserAgent = requestDetails.UserAgent,
                    RequestPath = requestDetails.Path,
                    HttpMethod = requestDetails.Method,
                    ResponseStatusCode = responseDetails.StatusCode,
                    ExecutionTimeMs = executionTimeMs
                };

                await auditService.CreateAuditLogAsync(createDto);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to create audit log for {Method} {Path}", 
                    requestDetails.Method, requestDetails.Path);
            }
        }

        private async Task CreateErrorAuditLogAsync(HttpContext context, Exception exception, long executionTimeMs)
        {
            try
            {
                var auditService = context.RequestServices.GetService<IAuditService>();
                if (auditService == null) return;

                var userId = GetUserId(context);
                var path = context.Request.Path.Value ?? string.Empty;
                var method = context.Request.Method;

                var errorDetails = new
                {
                    Exception = new
                    {
                        Type = exception.GetType().Name,
                        Message = exception.Message,
                        StackTrace = exception.StackTrace
                    },
                    Request = new
                    {
                        Path = path,
                        Method = method,
                        QueryString = context.Request.QueryString.Value,
                        IpAddress = GetClientIpAddress(context),
                        UserAgent = context.Request.Headers.UserAgent.ToString()
                    },
                    Performance = new
                    {
                        ExecutionTimeMs = executionTimeMs,
                        Timestamp = DateTime.UtcNow
                    }
                };

                var createDto = new CreateAuditLogDto
                {
                    EntityType = "System",
                    EntityId = "Error",
                    Action = "Error",
                    UserId = userId,
                    Summary = $"Error in {method} {path}: {exception.Message}",
                    Details = JsonSerializer.Serialize(errorDetails),
                    IpAddress = GetClientIpAddress(context),
                    UserAgent = context.Request.Headers.UserAgent.ToString(),
                    RequestPath = path,
                    HttpMethod = method,
                    ResponseStatusCode = 500,
                    ExecutionTimeMs = executionTimeMs
                };

                await auditService.CreateAuditLogAsync(createDto);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to create error audit log");
            }
        }

        private int? GetUserId(HttpContext context)
        {
            var userIdClaim = context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return int.TryParse(userIdClaim, out var userId) ? userId : null;
        }

        private string GetClientIpAddress(HttpContext context)
        {
            // Check for forwarded headers first (for load balancers/proxies)
            var forwardedFor = context.Request.Headers["X-Forwarded-For"].FirstOrDefault();
            if (!string.IsNullOrEmpty(forwardedFor))
            {
                var ips = forwardedFor.Split(',', StringSplitOptions.RemoveEmptyEntries);
                if (ips.Length > 0)
                {
                    return ips[0].Trim();
                }
            }

            var realIp = context.Request.Headers["X-Real-IP"].FirstOrDefault();
            if (!string.IsNullOrEmpty(realIp))
            {
                return realIp;
            }

            return context.Connection.RemoteIpAddress?.ToString() ?? "Unknown";
        }

        private EntityInfo DetermineEntityInfo(HttpContext context, RequestDetails request, ResponseDetails response)
        {
            var path = request.Path.ToLower();
            var pathSegments = path.Split('/', StringSplitOptions.RemoveEmptyEntries);

            if (pathSegments.Length >= 2 && pathSegments[0] == "api")
            {
                var controller = pathSegments[1];
                
                // Try to extract entity ID from path
                string entityId = "Unknown";
                if (pathSegments.Length > 2 && int.TryParse(pathSegments[2], out var id))
                {
                    entityId = id.ToString();
                }
                else if (pathSegments.Length > 2)
                {
                    entityId = pathSegments[2];
                }

                return new EntityInfo
                {
                    EntityType = controller.TrimEnd('s'), // Remove trailing 's' from controller name
                    EntityId = entityId
                };
            }

            return new EntityInfo
            {
                EntityType = "System",
                EntityId = path
            };
        }

        private string DetermineAction(string method, string path, int statusCode)
        {
            if (statusCode >= 400)
            {
                return $"{method}_Error";
            }

            return method.ToUpper() switch
            {
                "GET" => "Read",
                "POST" => "Create",
                "PUT" => "Update",
                "PATCH" => "Update",
                "DELETE" => "Delete",
                _ => method
            };
        }

        private string GenerateSummary(RequestDetails request, ResponseDetails response)
        {
            var action = DetermineAction(request.Method, request.Path, response.StatusCode);
            var path = request.Path;
            
            if (response.StatusCode >= 400)
            {
                return $"Failed {request.Method} request to {path} (Status: {response.StatusCode})";
            }

            return $"Successful {action} operation on {path}";
        }
    }

    /// <summary>
    /// Configuration options for audit middleware
    /// </summary>
    public class AuditOptions
    {
        public bool CaptureRequestBody { get; set; } = true;
        public bool CaptureResponseBody { get; set; } = false;
        public bool CaptureHeaders { get; set; } = false;
        public bool AuditAllMethods { get; set; } = false;
        public long MaxBodySizeToCapture { get; set; } = 1024 * 1024; // 1MB
    }

    /// <summary>
    /// Request details for audit logging
    /// </summary>
    internal class RequestDetails
    {
        public string Path { get; set; } = string.Empty;
        public string Method { get; set; } = string.Empty;
        public string QueryString { get; set; } = string.Empty;
        public string ContentType { get; set; } = string.Empty;
        public long? ContentLength { get; set; }
        public string? Body { get; set; }
        public Dictionary<string, string> Headers { get; set; } = new();
        public string IpAddress { get; set; } = string.Empty;
        public string UserAgent { get; set; } = string.Empty;
    }

    /// <summary>
    /// Response details for audit logging
    /// </summary>
    internal class ResponseDetails
    {
        public int StatusCode { get; set; }
        public string ContentType { get; set; } = string.Empty;
        public long ContentLength { get; set; }
        public string? Body { get; set; }
        public Dictionary<string, string> Headers { get; set; } = new();
    }

    /// <summary>
    /// Entity information extracted from request
    /// </summary>
    internal class EntityInfo
    {
        public string EntityType { get; set; } = string.Empty;
        public string EntityId { get; set; } = string.Empty;
    }

    /// <summary>
    /// Extension methods for adding audit middleware
    /// </summary>
    public static class AuditMiddlewareExtensions
    {
        public static IApplicationBuilder UseAuditLogging(this IApplicationBuilder builder, AuditOptions? options = null)
        {
            return builder.UseMiddleware<AuditMiddleware>(options ?? new AuditOptions());
        }

        public static IServiceCollection AddAuditLogging(this IServiceCollection services, Action<AuditOptions>? configureOptions = null)
        {
            var options = new AuditOptions();
            configureOptions?.Invoke(options);
            services.AddSingleton(options);
            
            return services;
        }
    }
}