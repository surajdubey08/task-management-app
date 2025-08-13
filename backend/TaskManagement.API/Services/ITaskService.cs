using TaskManagement.API.DTOs;
using TaskManagement.API.Models;
using TaskStatus = TaskManagement.API.Models.TaskStatus;

namespace TaskManagement.API.Services
{
    public interface ITaskService
    {
        Task<IEnumerable<TaskDto>> GetAllTasksAsync();
        Task<TaskDto?> GetTaskByIdAsync(int id);
        Task<IEnumerable<TaskDto>> GetTasksByUserIdAsync(int userId);
        Task<IEnumerable<TaskDto>> GetTasksByCategoryIdAsync(int categoryId);
        Task<IEnumerable<TaskDto>> GetTasksByStatusAsync(TaskStatus status);
        Task<TaskDto> CreateTaskAsync(CreateTaskDto createTaskDto);
        Task<TaskDto?> UpdateTaskAsync(int id, UpdateTaskDto updateTaskDto);
        Task<bool> DeleteTaskAsync(int id);
    }
}
