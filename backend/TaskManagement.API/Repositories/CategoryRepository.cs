using Microsoft.EntityFrameworkCore;
using TaskManagement.API.Data;
using TaskManagement.API.Models;

namespace TaskManagement.API.Repositories
{
    public class CategoryRepository : ICategoryRepository
    {
        private readonly TaskManagementContext _context;
        private readonly ILogger<CategoryRepository> _logger;

        public CategoryRepository(TaskManagementContext context, ILogger<CategoryRepository> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<IEnumerable<Category>> GetAllAsync()
        {
            _logger.LogInformation("Retrieving all categories");
            return await _context.Categories
                .OrderBy(c => c.Name)
                .ToListAsync();
        }

        public async Task<IEnumerable<Category>> GetActiveAsync()
        {
            _logger.LogInformation("Retrieving active categories");
            return await _context.Categories
                .Where(c => c.IsActive)
                .OrderBy(c => c.Name)
                .ToListAsync();
        }

        public async Task<Category?> GetByIdAsync(int id)
        {
            _logger.LogInformation("Retrieving category with ID: {CategoryId}", id);
            return await _context.Categories.FindAsync(id);
        }

        public async Task<Category> CreateAsync(Category category)
        {
            _logger.LogInformation("Creating new category: {CategoryName}", category.Name);
            category.CreatedAt = DateTime.UtcNow;
            category.UpdatedAt = DateTime.UtcNow;
            
            _context.Categories.Add(category);
            await _context.SaveChangesAsync();
            
            return category;
        }

        public async Task<Category> UpdateAsync(Category category)
        {
            _logger.LogInformation("Updating category with ID: {CategoryId}", category.Id);
            category.UpdatedAt = DateTime.UtcNow;
            
            _context.Categories.Update(category);
            await _context.SaveChangesAsync();
            
            return category;
        }

        public async Task<bool> DeleteAsync(int id)
        {
            _logger.LogInformation("Deleting category with ID: {CategoryId}", id);
            var category = await _context.Categories.FindAsync(id);
            if (category == null)
                return false;

            _context.Categories.Remove(category);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> ExistsAsync(int id)
        {
            return await _context.Categories.AnyAsync(c => c.Id == id);
        }
    }
}
