using TaskManagement.API.Models;

namespace TaskManagement.API.Repositories
{
    public interface ITaskActivityRepository
    {
        Task<IEnumerable<TaskActivity>> GetByTaskIdAsync(int taskId);
        Task<TaskActivity> CreateAsync(TaskActivity activity);
    }
}
