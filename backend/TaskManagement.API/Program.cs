using Microsoft.EntityFrameworkCore;
using TaskManagement.API.Data;
using TaskManagement.API.Services;
using TaskManagement.API.Repositories;
using AutoMapper;
using Serilog;
using System.Reflection;

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

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Performance optimizations
builder.Services.AddResponseCompression(options =>
{
    options.EnableForHttps = true;
});

builder.Services.AddMemoryCache();
builder.Services.AddResponseCaching();

// Database with performance optimizations
builder.Services.AddDbContext<TaskManagementContext>(options =>
{
    options.UseSqlite(builder.Configuration.GetConnectionString("DefaultConnection"));

    // Performance optimizations
    if (builder.Environment.IsProduction())
    {
        options.EnableSensitiveDataLogging(false);
        options.EnableDetailedErrors(false);
    }
    else
    {
        options.EnableSensitiveDataLogging(true);
        options.EnableDetailedErrors(true);
    }
});

// AutoMapper
builder.Services.AddAutoMapper(Assembly.GetExecutingAssembly());

// Services
builder.Services.AddScoped<ITaskService, TaskService>();
builder.Services.AddScoped<IUserService, UserService>();
builder.Services.AddScoped<ICategoryService, CategoryService>();
builder.Services.AddScoped<ITaskCommentService, TaskCommentService>();
builder.Services.AddScoped<ITaskActivityService, TaskActivityService>();

// Repositories
builder.Services.AddScoped<ITaskRepository, TaskRepository>();
builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<ICategoryRepository, CategoryRepository>();
builder.Services.AddScoped<ITaskCommentRepository, TaskCommentRepository>();
builder.Services.AddScoped<ITaskActivityRepository, TaskActivityRepository>();


// CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReactApp", policy =>
    {
        policy.WithOrigins("http://localhost:3000", "http://localhost:3001")
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

app.UseResponseCompression();
app.UseResponseCaching();

app.UseHttpsRedirection();

app.UseCors("AllowReactApp");

app.UseAuthorization();

app.MapControllers();

// Health check endpoint
app.MapGet("/health", () => Results.Ok(new { status = "healthy", timestamp = DateTime.UtcNow }));

// Ensure database is created
using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<TaskManagementContext>();
    context.Database.EnsureCreated();
}

app.Run();
