using AutoMapper;
using TaskManagement.API.DTOs;
using TaskManagement.API.Models;
using TaskManagement.API.Repositories;

namespace TaskManagement.API.Services
{
    public class TaskCommentService : ITaskCommentService
    {
        private readonly ITaskCommentRepository _commentRepository;
        private readonly ITaskRepository _taskRepository;
        private readonly IUserRepository _userRepository;
        private readonly IMapper _mapper;
        private readonly ILogger<TaskCommentService> _logger;

        public TaskCommentService(
            ITaskCommentRepository commentRepository,
            ITaskRepository taskRepository,
            IUserRepository userRepository,
            IMapper mapper,
            ILogger<TaskCommentService> logger)
        {
            _commentRepository = commentRepository;
            _taskRepository = taskRepository;
            _userRepository = userRepository;
            _mapper = mapper;
            _logger = logger;
        }

        public async Task<IEnumerable<TaskCommentDto>> GetCommentsByTaskIdAsync(int taskId)
        {
            _logger.LogInformation("Getting comments for task ID: {TaskId}", taskId);
            var comments = await _commentRepository.GetByTaskIdAsync(taskId);
            return _mapper.Map<IEnumerable<TaskCommentDto>>(comments);
        }

        public async Task<TaskCommentDto?> GetCommentByIdAsync(int id)
        {
            _logger.LogInformation("Getting comment by ID: {CommentId}", id);
            var comment = await _commentRepository.GetByIdAsync(id);
            return comment != null ? _mapper.Map<TaskCommentDto>(comment) : null;
        }

        public async Task<TaskCommentDto> CreateCommentAsync(CreateTaskCommentDto createCommentDto)
        {
            _logger.LogInformation("Creating comment for task ID: {TaskId}", createCommentDto.TaskId);
            
            // Validate task exists
            if (!await _taskRepository.ExistsAsync(createCommentDto.TaskId))
            {
                throw new ArgumentException($"Task with ID {createCommentDto.TaskId} does not exist.");
            }

            // Validate user exists
            if (!await _userRepository.ExistsAsync(createCommentDto.UserId))
            {
                throw new ArgumentException($"User with ID {createCommentDto.UserId} does not exist.");
            }

            var comment = _mapper.Map<TaskComment>(createCommentDto);
            var createdComment = await _commentRepository.CreateAsync(comment);
            return _mapper.Map<TaskCommentDto>(createdComment);
        }

        public async Task<TaskCommentDto?> UpdateCommentAsync(int id, UpdateTaskCommentDto updateCommentDto)
        {
            _logger.LogInformation("Updating comment with ID: {CommentId}", id);
            
            var existingComment = await _commentRepository.GetByIdAsync(id);
            if (existingComment == null)
            {
                return null;
            }

            existingComment.Content = updateCommentDto.Content;
            var updatedComment = await _commentRepository.UpdateAsync(existingComment);
            return _mapper.Map<TaskCommentDto>(updatedComment);
        }

        public async Task<bool> DeleteCommentAsync(int id)
        {
            _logger.LogInformation("Deleting comment with ID: {CommentId}", id);
            return await _commentRepository.DeleteAsync(id);
        }
    }
}
