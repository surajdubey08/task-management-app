using TaskManagement.API.DTOs;

namespace TaskManagement.API.Services
{
    public interface ITaskCommentService
    {
        Task<IEnumerable<TaskCommentDto>> GetCommentsByTaskIdAsync(int taskId);
        Task<TaskCommentDto?> GetCommentByIdAsync(int id);
        Task<TaskCommentDto> CreateCommentAsync(CreateTaskCommentDto createCommentDto);
        Task<TaskCommentDto?> UpdateCommentAsync(int id, UpdateTaskCommentDto updateCommentDto);
        Task<bool> DeleteCommentAsync(int id);
    }
}
