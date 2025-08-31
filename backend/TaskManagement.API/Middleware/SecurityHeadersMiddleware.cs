namespace TaskManagement.API.Middleware
{
    public class SecurityHeadersMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<SecurityHeadersMiddleware> _logger;

        public SecurityHeadersMiddleware(RequestDelegate next, ILogger<SecurityHeadersMiddleware> logger)
        {
            _next = next;
            _logger = logger;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            // Add security headers
            var headers = context.Response.Headers;

            // Remove server information
            headers.Remove("Server");

            // X-Content-Type-Options
            if (!headers.ContainsKey("X-Content-Type-Options"))
            {
                headers.Add("X-Content-Type-Options", "nosniff");
            }

            // X-Frame-Options
            if (!headers.ContainsKey("X-Frame-Options"))
            {
                headers.Add("X-Frame-Options", "DENY");
            }

            // X-XSS-Protection
            if (!headers.ContainsKey("X-XSS-Protection"))
            {
                headers.Add("X-XSS-Protection", "1; mode=block");
            }

            // Referrer-Policy
            if (!headers.ContainsKey("Referrer-Policy"))
            {
                headers.Add("Referrer-Policy", "strict-origin-when-cross-origin");
            }

            // Permissions-Policy
            if (!headers.ContainsKey("Permissions-Policy"))
            {
                headers.Add("Permissions-Policy", 
                    "accelerometer=(), ambient-light-sensor=(), autoplay=(), battery=(), " +
                    "camera=(), cross-origin-isolated=(), display-capture=(), " +
                    "document-domain=(), encrypted-media=(), execution-while-not-rendered=(), " +
                    "execution-while-out-of-viewport=(), fullscreen=(), geolocation=(), " +
                    "gyroscope=(), keyboard-map=(), magnetometer=(), microphone=(), " +
                    "midi=(), navigation-override=(), payment=(), picture-in-picture=(), " +
                    "publickey-credentials-get=(), screen-wake-lock=(), sync-xhr=(), " +
                    "usb=(), web-share=(), xr-spatial-tracking=()");
            }

            // Content-Security-Policy
            if (!headers.ContainsKey("Content-Security-Policy"))
            {
                var csp = "default-src 'self'; " +
                         "script-src 'self'; " +
                         "style-src 'self' 'unsafe-inline'; " +
                         "img-src 'self' data: blob:; " +
                         "font-src 'self'; " +
                         "connect-src 'self'; " +
                         "media-src 'self'; " +
                         "object-src 'none'; " +
                         "child-src 'none'; " +
                         "frame-src 'none'; " +
                         "worker-src 'none'; " +
                         "frame-ancestors 'none'; " +
                         "form-action 'self'; " +
                         "base-uri 'self'; " +
                         "manifest-src 'self';";

                headers.Add("Content-Security-Policy", csp);
            }

            // Strict-Transport-Security (only for HTTPS)
            if (context.Request.IsHttps && !headers.ContainsKey("Strict-Transport-Security"))
            {
                headers.Add("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
            }

            // Cache-Control for sensitive endpoints
            if (IsSensitiveEndpoint(context.Request.Path))
            {
                headers.Add("Cache-Control", "no-cache, no-store, must-revalidate");
                headers.Add("Pragma", "no-cache");
                headers.Add("Expires", "0");
            }

            await _next(context);
        }

        private static bool IsSensitiveEndpoint(PathString path)
        {
            var sensitivePaths = new[]
            {
                "/api/auth",
                "/api/users"
            };

            return sensitivePaths.Any(sensitivePath => 
                path.StartsWithSegments(sensitivePath, StringComparison.OrdinalIgnoreCase));
        }
    }

    public static class SecurityHeadersExtensions
    {
        public static IApplicationBuilder UseSecurityHeaders(this IApplicationBuilder app)
        {
            return app.UseMiddleware<SecurityHeadersMiddleware>();
        }
    }
}