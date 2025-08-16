using Microsoft.EntityFrameworkCore;
using TaskManagement.API.Models;
using TaskStatus = TaskManagement.API.Models.TaskStatus;
using TaskPriority = TaskManagement.API.Models.TaskPriority;

namespace TaskManagement.API.Data
{
    public class TaskManagementContext : DbContext
    {
        public TaskManagementContext(DbContextOptions<TaskManagementContext> options) : base(options)
        {
        }

        public DbSet<User> Users { get; set; }
        public DbSet<Category> Categories { get; set; }
        public DbSet<TaskItem> Tasks { get; set; }
        public DbSet<TaskComment> TaskComments { get; set; }
        public DbSet<TaskActivity> TaskActivities { get; set; }


        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // User configuration
            modelBuilder.Entity<User>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Name).IsRequired().HasMaxLength(100);
                entity.Property(e => e.Email).IsRequired().HasMaxLength(255);
                entity.HasIndex(e => e.Email).IsUnique();
                entity.Property(e => e.PhoneNumber).HasMaxLength(20);
                entity.Property(e => e.Department).HasMaxLength(100);
            });

            // Category configuration
            modelBuilder.Entity<Category>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Name).IsRequired().HasMaxLength(100);
                entity.Property(e => e.Description).HasMaxLength(500);
                entity.Property(e => e.Color).HasMaxLength(7);
            });

            // TaskItem configuration
            modelBuilder.Entity<TaskItem>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Title).IsRequired().HasMaxLength(200);
                entity.Property(e => e.Description).HasMaxLength(1000);
                
                entity.HasOne(e => e.User)
                      .WithMany(u => u.Tasks)
                      .HasForeignKey(e => e.UserId)
                      .OnDelete(DeleteBehavior.Cascade);
                
                entity.HasOne(e => e.Category)
                      .WithMany(c => c.Tasks)
                      .HasForeignKey(e => e.CategoryId)
                      .OnDelete(DeleteBehavior.SetNull);
            });

            // TaskComment configuration
            modelBuilder.Entity<TaskComment>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Content).IsRequired().HasMaxLength(2000);

                entity.HasOne(e => e.Task)
                      .WithMany(t => t.Comments)
                      .HasForeignKey(e => e.TaskId)
                      .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(e => e.User)
                      .WithMany(u => u.Comments)
                      .HasForeignKey(e => e.UserId)
                      .OnDelete(DeleteBehavior.Restrict);
            });

            // TaskActivity configuration
            modelBuilder.Entity<TaskActivity>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Description).HasMaxLength(500);
                entity.Property(e => e.OldValue).HasMaxLength(100);
                entity.Property(e => e.NewValue).HasMaxLength(100);

                entity.HasOne(e => e.Task)
                      .WithMany(t => t.Activities)
                      .HasForeignKey(e => e.TaskId)
                      .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(e => e.User)
                      .WithMany(u => u.Activities)
                      .HasForeignKey(e => e.UserId)
                      .OnDelete(DeleteBehavior.Restrict);
            });



            // Seed data
            SeedData(modelBuilder);
        }

        private void SeedData(ModelBuilder modelBuilder)
        {
            // Seed Users
            modelBuilder.Entity<User>().HasData(
                new User { Id = 1, Name = "John Doe", Email = "john.doe@example.com", Department = "Engineering", CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
                new User { Id = 2, Name = "Jane Smith", Email = "jane.smith@example.com", Department = "Marketing", CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
                new User { Id = 3, Name = "Bob Johnson", Email = "bob.johnson@example.com", Department = "Sales", CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow }
            );

            // Seed Categories
            modelBuilder.Entity<Category>().HasData(
                new Category { Id = 1, Name = "Development", Description = "Software development tasks", Color = "#28a745", IsActive = true, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
                new Category { Id = 2, Name = "Testing", Description = "Quality assurance and testing", Color = "#ffc107", IsActive = true, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
                new Category { Id = 3, Name = "Documentation", Description = "Documentation and knowledge sharing", Color = "#17a2b8", IsActive = true, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
                new Category { Id = 4, Name = "Bug Fix", Description = "Bug fixes and maintenance", Color = "#dc3545", IsActive = true, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow }
            );

            // Seed Tasks
            modelBuilder.Entity<TaskItem>().HasData(
                new TaskItem { Id = 1, Title = "Implement user authentication", Description = "Add JWT-based authentication to the API", Status = TaskStatus.InProgress, Priority = TaskPriority.High, UserId = 1, CategoryId = 1, DueDate = DateTime.UtcNow.AddDays(7), CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
                new TaskItem { Id = 2, Title = "Write unit tests", Description = "Create comprehensive unit tests for the task service", Status = TaskStatus.Pending, Priority = TaskPriority.Medium, UserId = 1, CategoryId = 2, DueDate = DateTime.UtcNow.AddDays(5), CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
                new TaskItem { Id = 3, Title = "Update API documentation", Description = "Update Swagger documentation with new endpoints", Status = TaskStatus.Pending, Priority = TaskPriority.Low, UserId = 2, CategoryId = 3, DueDate = DateTime.UtcNow.AddDays(3), CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
                new TaskItem { Id = 4, Title = "Fix login bug", Description = "Resolve issue with user login failing on mobile devices", Status = TaskStatus.Completed, Priority = TaskPriority.Critical, UserId = 3, CategoryId = 4, CompletedAt = DateTime.UtcNow.AddDays(-1), CreatedAt = DateTime.UtcNow.AddDays(-3), UpdatedAt = DateTime.UtcNow.AddDays(-1) }
            );
        }
    }
}
