using TaskManagement.API.DTOs;

namespace TaskManagement.API.Services
{
    public interface ITaskDependencyService
    {
        Task<IEnumerable<TaskDependencyDto>> GetDependenciesByTaskIdAsync(int taskId);
        Task<TaskWithDependenciesDto> GetTaskWithDependenciesAsync(int taskId);
        Task<TaskDependencyDto> CreateDependencyAsync(CreateTaskDependencyDto createDependencyDto);
        Task<bool> DeleteDependencyAsync(int dependencyId);
        Task<bool> CanTaskStartAsync(int taskId);
        Task<IEnumerable<string>> GetBlockingReasonsAsync(int taskId);
    }
}
