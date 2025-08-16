using TaskManagement.API.DTOs;
using TaskManagement.API.Models;

namespace TaskManagement.API.Services
{
    public interface ITaskActivityService
    {
        Task<IEnumerable<TaskActivityDto>> GetActivitiesByTaskIdAsync(int taskId);
        Task<TaskActivityDto> CreateActivityAsync(int taskId, int userId, ActivityType activityType, string? description = null, string? oldValue = null, string? newValue = null);
    }
}
