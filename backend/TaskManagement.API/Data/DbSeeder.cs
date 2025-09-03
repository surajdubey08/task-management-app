using Microsoft.EntityFrameworkCore;
using TaskManagement.API.Models;
using TaskManagement.API.Services;

namespace TaskManagement.API.Data
{
    public static class DbSeeder
    {
        public static async Task SeedAsync(TaskManagementContext context, IServiceProvider serviceProvider)
        {
            await context.Database.EnsureCreatedAsync();

            // Check if any users exist
            if (await context.Users.AnyAsync())
            {
                return; // Database has been seeded
            }

            var passwordService = serviceProvider.GetRequiredService<IPasswordService>();

            // Create admin user
            var adminUser = new User
            {
                Name = "System Administrator",
                Email = "admin@taskflow.com",
                PasswordHash = passwordService.HashPassword("admin123"),
                Role = UserRole.Admin,
                Status = AccountStatus.Active,
                Department = "IT",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            // Create a sample member user
            var memberUser = new User
            {
                Name = "Demo User",
                Email = "demo@taskflow.com",
                PasswordHash = passwordService.HashPassword("demo123"),
                Role = UserRole.Member,
                Status = AccountStatus.Active,
                Department = "Operations",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            context.Users.AddRange(adminUser, memberUser);

            // Create default categories
            var categories = new[]
            {
                new Category
                {
                    Name = "Development",
                    Description = "Software development tasks",
                    Color = "#3B82F6",
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                },
                new Category
                {
                    Name = "Design",
                    Description = "UI/UX design tasks",
                    Color = "#8B5CF6",
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                },
                new Category
                {
                    Name = "Testing",
                    Description = "Quality assurance and testing",
                    Color = "#10B981",
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                },
                new Category
                {
                    Name = "Documentation",
                    Description = "Documentation and knowledge base",
                    Color = "#F59E0B",
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                }
            };

            context.Categories.AddRange(categories);
            await context.SaveChangesAsync();

            // Create sample tasks after users and categories are saved
            var sampleTasks = new[]
            {
                new TaskItem
                {
                    Title = "Setup Authentication System",
                    Description = "Implement JWT-based authentication with login and registration",
                    Status = Models.TaskStatus.Completed,
                    Priority = TaskPriority.High,
                    UserId = adminUser.Id,
                    CategoryId = categories[0].Id, // Development
                    DueDate = DateTime.UtcNow.AddDays(-1),
                    CreatedAt = DateTime.UtcNow.AddDays(-5),
                    UpdatedAt = DateTime.UtcNow.AddDays(-1)
                },
                new TaskItem
                {
                    Title = "Design Dashboard UI",
                    Description = "Create an intuitive dashboard with widgets and charts",
                    Status = Models.TaskStatus.InProgress,
                    Priority = TaskPriority.Medium,
                    UserId = memberUser.Id,
                    CategoryId = categories[1].Id, // Design
                    DueDate = DateTime.UtcNow.AddDays(3),
                    CreatedAt = DateTime.UtcNow.AddDays(-3),
                    UpdatedAt = DateTime.UtcNow.AddDays(-1)
                },
                new TaskItem
                {
                    Title = "Write API Documentation",
                    Description = "Document all API endpoints with examples and schemas",
                    Status = Models.TaskStatus.Pending,
                    Priority = TaskPriority.Medium,
                    UserId = adminUser.Id,
                    CategoryId = categories[3].Id, // Documentation
                    DueDate = DateTime.UtcNow.AddDays(7),
                    CreatedAt = DateTime.UtcNow.AddDays(-2),
                    UpdatedAt = DateTime.UtcNow.AddDays(-2)
                },
                new TaskItem
                {
                    Title = "Implement Unit Tests",
                    Description = "Add comprehensive unit tests for all services and controllers",
                    Status = Models.TaskStatus.Pending,
                    Priority = TaskPriority.High,
                    UserId = memberUser.Id,
                    CategoryId = categories[2].Id, // Testing
                    DueDate = DateTime.UtcNow.AddDays(10),
                    CreatedAt = DateTime.UtcNow.AddDays(-1),
                    UpdatedAt = DateTime.UtcNow.AddDays(-1)
                },
                new TaskItem
                {
                    Title = "Setup CI/CD Pipeline",
                    Description = "Configure automated deployment pipeline with Docker",
                    Status = Models.TaskStatus.InProgress,
                    Priority = TaskPriority.High,
                    UserId = adminUser.Id,
                    CategoryId = categories[0].Id, // Development
                    DueDate = DateTime.UtcNow.AddDays(5),
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                }
            };

            context.Tasks.AddRange(sampleTasks);
            await context.SaveChangesAsync();

            Console.WriteLine("Database seeded successfully with admin user: admin@taskflow.com / admin123");
        }
    }
}