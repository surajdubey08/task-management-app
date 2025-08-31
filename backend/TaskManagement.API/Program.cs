using Microsoft.EntityFrameworkCore;
using TaskManagement.API.Data;
using TaskManagement.API.Services;
using TaskManagement.API.Repositories;
using TaskManagement.API.Hubs;
using TaskManagement.API.Middleware;
using AutoMapper;
using Serilog;
using System.Reflection;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using Microsoft.OpenApi.Models;
using FluentValidation;
using FluentValidation.AspNetCore;
using StackExchange.Redis;

var builder = WebApplication.CreateBuilder(args);

// Configure Kestrel to use non-privileged port for non-root execution
builder.WebHost.UseUrls("http://0.0.0.0:8080");

// Configure Serilog
Log.Logger = new LoggerConfiguration()
    .ReadFrom.Configuration(builder.Configuration)
    .Enrich.FromLogContext()
    .WriteTo.Console()
    .WriteTo.File("logs/taskmanagement-.txt", rollingInterval: RollingInterval.Day)
    .CreateLogger();

builder.Host.UseSerilog();

// Add services to the container.
builder.Services.AddControllers()
    .ConfigureApiBehaviorOptions(options =>
    {
        // Suppress automatic model validation responses for better error handling
        options.SuppressModelStateInvalidFilter = false;
    });

// FluentValidation
builder.Services.AddFluentValidationAutoValidation();
builder.Services.AddFluentValidationClientsideAdapters();
builder.Services.AddValidatorsFromAssembly(Assembly.GetExecutingAssembly());

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo 
    { 
        Title = "TaskFlow API", 
        Version = "v1",
        Description = "A comprehensive task management API"
    });
    
    // Add JWT authentication to Swagger
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "JWT Authorization header using the Bearer scheme. Example: \"Authorization: Bearer {token}\"",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });
    
    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

// Performance optimizations
builder.Services.AddResponseCompression(options =>
{
    options.EnableForHttps = true;
    options.Providers.Add<Microsoft.AspNetCore.ResponseCompression.BrotliCompressionProvider>();
    options.Providers.Add<Microsoft.AspNetCore.ResponseCompression.GzipCompressionProvider>();
});

builder.Services.AddMemoryCache();
builder.Services.AddResponseCaching();

// Redis Caching Configuration
var redisConnectionString = builder.Configuration.GetConnectionString("Redis") ?? "localhost:6379";
if (builder.Environment.IsProduction() || !string.IsNullOrEmpty(Environment.GetEnvironmentVariable("REDIS_URL")))
{
    try
    {
        builder.Services.AddStackExchangeRedisCache(options =>
        {
            options.Configuration = redisConnectionString;
            options.InstanceName = "TaskFlow";
        });
        
        builder.Services.AddSingleton<IConnectionMultiplexer>(provider =>
        {
            return ConnectionMultiplexer.Connect(redisConnectionString);
        });
        
        builder.Services.AddScoped<ICacheService, MemoryCacheService>();
        Log.Information("Redis caching configured successfully");
    }
    catch (Exception ex)
    {
        Log.Warning(ex, "Failed to configure Redis, falling back to in-memory caching");
        builder.Services.AddSingleton<ICacheService, MemoryCacheService>();
    }
}
else
{
    // Development: Use in-memory caching
    builder.Services.AddSingleton<ICacheService, MemoryCacheService>();
    Log.Information("Using in-memory caching for development");
}

// Database with performance optimizations
builder.Services.AddDbContext<TaskManagementContext>(options =>
{
    var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
    var databaseProvider = builder.Configuration.GetValue<string>("DatabaseProvider") ?? "SQLite";

    if (databaseProvider.Equals("PostgreSQL", StringComparison.OrdinalIgnoreCase))
    {
        options.UseNpgsql(connectionString, npgsqlOptions =>
        {
            npgsqlOptions.CommandTimeout(30);
        });
    }
    else
    {
        options.UseSqlite(connectionString, sqliteOptions =>
        {
            sqliteOptions.CommandTimeout(30);
        });
    }

    // Performance optimizations
    if (builder.Environment.IsProduction())
    {
        options.EnableSensitiveDataLogging(false);
        options.EnableDetailedErrors(false);
        options.EnableServiceProviderCaching();
        options.EnableSensitiveDataLogging(false);
    }
    else
    {
        options.EnableSensitiveDataLogging(true);
        options.EnableDetailedErrors(true);
    }
    
    // Enable lazy loading proxies for better performance in some scenarios
    options.UseLazyLoadingProxies();
    
    // Query optimization
    options.ConfigureWarnings(warnings => warnings.Ignore(Microsoft.EntityFrameworkCore.Diagnostics.CoreEventId.LazyLoadOnDisposedContextWarning));
});

// AutoMapper
builder.Services.AddAutoMapper(Assembly.GetExecutingAssembly());

// Services
builder.Services.AddScoped<ITaskService, TaskService>();
builder.Services.AddScoped<IUserService, UserService>();
builder.Services.AddScoped<ICategoryService, CategoryService>();
builder.Services.AddScoped<ITaskCommentService, TaskCommentService>();
builder.Services.AddScoped<ITaskActivityService, TaskActivityService>();
builder.Services.AddScoped<IQueryOptimizationService, QueryOptimizationService>();
builder.Services.AddScoped<IAuditService, AuditService>();

// Authentication services
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<ITokenService, TokenService>();
builder.Services.AddScoped<IPasswordService, PasswordService>();

// Repositories with caching decorators
builder.Services.AddScoped<TaskRepository>();
builder.Services.AddScoped<ITaskRepository>(provider =>
{
    var baseRepo = provider.GetRequiredService<TaskRepository>();
    var cache = provider.GetRequiredService<ICacheService>();
    var logger = provider.GetRequiredService<ILogger<CachedTaskRepository>>();
    return new CachedTaskRepository(baseRepo, cache, logger);
});

builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<ICategoryRepository, CategoryRepository>();
builder.Services.AddScoped<ITaskCommentRepository, TaskCommentRepository>();
builder.Services.AddScoped<ITaskActivityRepository, TaskActivityRepository>();

// JWT Authentication
var jwtSettings = builder.Configuration.GetSection("JwtSettings");
var secretKey = jwtSettings["SecretKey"] ?? throw new InvalidOperationException("JWT Secret Key must be configured");

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = jwtSettings["Issuer"] ?? "TaskFlow",
        ValidAudience = jwtSettings["Audience"] ?? "TaskFlow",
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey)),
        ClockSkew = TimeSpan.Zero
    };
    
    options.Events = new JwtBearerEvents
    {
        OnAuthenticationFailed = context =>
        {
            Log.Warning("JWT Authentication failed: {Exception}", context.Exception.Message);
            return Task.CompletedTask;
        },
        OnChallenge = context =>
        {
            Log.Warning("JWT Challenge: {Error}", context.Error);
            return Task.CompletedTask;
        }
    };
});

builder.Services.AddAuthorization();

// SignalR
builder.Services.AddSignalR(options =>
{
    options.EnableDetailedErrors = builder.Environment.IsDevelopment();
    options.KeepAliveInterval = TimeSpan.FromMinutes(1);
    options.ClientTimeoutInterval = TimeSpan.FromMinutes(2);
});

// Rate Limiting
builder.Services.AddRateLimiting(options =>
{
    options.DefaultMaxRequests = 100;
    options.DefaultWindowMinutes = 15;
    options.EnableGlobalRateLimit = true;
});

// Audit Logging
builder.Services.AddAuditLogging(options =>
{
    options.CaptureRequestBody = true;
    options.CaptureResponseBody = false;
    options.CaptureHeaders = false;
    options.AuditAllMethods = false;
    options.MaxBodySizeToCapture = 1024 * 1024; // 1MB
});

// CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReactApp", policy =>
    {
        policy.WithOrigins(
            "http://localhost:3000", 
            "http://localhost:3001", 
            "http://taskmanagement-frontend:8080",
            "http://frontend:8080"
        )
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseSerilogRequestLogging();

// Enable response compression
app.UseResponseCompression();
app.UseResponseCaching();

// Security headers
app.UseSecurityHeaders();

// Rate limiting
app.UseRateLimiting();

app.UseResponseCompression();
app.UseResponseCaching();

app.UseHttpsRedirection();

app.UseCors("AllowReactApp");

app.UseAuthentication();
app.UseAuthorization();

// Audit logging (after authentication to capture user info)
app.UseAuditLogging();

app.MapControllers();

// Map SignalR Hub
app.MapHub<TaskManagementHub>("/hub/taskmanagement");

// Health check endpoint
app.MapGet("/health", () => Results.Ok(new { status = "healthy", timestamp = DateTime.UtcNow }));

// Ensure database is created
using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<TaskManagementContext>();
    context.Database.EnsureCreated();
}

app.Run();
