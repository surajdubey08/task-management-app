using TaskManagement.API.Models;

namespace TaskManagement.API.Repositories
{
    public interface ITaskCommentRepository
    {
        Task<IEnumerable<TaskComment>> GetByTaskIdAsync(int taskId);
        Task<TaskComment?> GetByIdAsync(int id);
        Task<TaskComment> CreateAsync(TaskComment comment);
        Task<TaskComment> UpdateAsync(TaskComment comment);
        Task<bool> DeleteAsync(int id);
    }
}
