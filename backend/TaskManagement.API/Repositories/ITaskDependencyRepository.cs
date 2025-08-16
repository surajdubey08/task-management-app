using TaskManagement.API.Models;

namespace TaskManagement.API.Repositories
{
    public interface ITaskDependencyRepository
    {
        Task<IEnumerable<TaskDependency>> GetByTaskIdAsync(int taskId);
        Task<IEnumerable<TaskDependency>> GetDependenciesForTaskAsync(int taskId);
        Task<IEnumerable<TaskDependency>> GetDependentsForTaskAsync(int taskId);
        Task<TaskDependency?> GetByIdAsync(int id);
        Task<TaskDependency> CreateAsync(TaskDependency dependency);
        Task<bool> DeleteAsync(int id);
        Task<bool> HasCircularDependencyAsync(int taskId, int dependentTaskId);
        Task<bool> DependencyExistsAsync(int taskId, int dependentTaskId, DependencyType dependencyType);
    }
}
