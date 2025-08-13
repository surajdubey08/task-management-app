using TaskManagement.API.Models;
using TaskStatus = TaskManagement.API.Models.TaskStatus;

namespace TaskManagement.API.Repositories
{
    public interface ITaskRepository
    {
        Task<IEnumerable<TaskItem>> GetAllAsync();
        Task<TaskItem?> GetByIdAsync(int id);
        Task<IEnumerable<TaskItem>> GetByUserIdAsync(int userId);
        Task<IEnumerable<TaskItem>> GetByCategoryIdAsync(int categoryId);
        Task<IEnumerable<TaskItem>> GetByStatusAsync(TaskStatus status);
        Task<TaskItem> CreateAsync(TaskItem task);
        Task<TaskItem> UpdateAsync(TaskItem task);
        Task<bool> DeleteAsync(int id);
        Task<bool> ExistsAsync(int id);
    }
}
