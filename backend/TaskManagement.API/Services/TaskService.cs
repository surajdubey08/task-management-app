using AutoMapper;
using TaskManagement.API.DTOs;
using TaskManagement.API.Models;
using TaskManagement.API.Repositories;
using TaskStatus = TaskManagement.API.Models.TaskStatus;

namespace TaskManagement.API.Services
{
    public class TaskService : ITaskService
    {
        private readonly ITaskRepository _taskRepository;
        private readonly IUserRepository _userRepository;
        private readonly ICategoryRepository _categoryRepository;
        private readonly IMapper _mapper;
        private readonly ILogger<TaskService> _logger;

        public TaskService(
            ITaskRepository taskRepository,
            IUserRepository userRepository,
            ICategoryRepository categoryRepository,
            IMapper mapper,
            ILogger<TaskService> logger)
        {
            _taskRepository = taskRepository;
            _userRepository = userRepository;
            _categoryRepository = categoryRepository;
            _mapper = mapper;
            _logger = logger;
        }

        public async Task<IEnumerable<TaskDto>> GetAllTasksAsync()
        {
            _logger.LogInformation("Getting all tasks");
            var tasks = await _taskRepository.GetAllAsync();
            return _mapper.Map<IEnumerable<TaskDto>>(tasks);
        }

        public async Task<TaskDto?> GetTaskByIdAsync(int id)
        {
            _logger.LogInformation("Getting task by ID: {TaskId}", id);
            var task = await _taskRepository.GetByIdAsync(id);
            return task != null ? _mapper.Map<TaskDto>(task) : null;
        }

        public async Task<IEnumerable<TaskDto>> GetTasksByUserIdAsync(int userId)
        {
            _logger.LogInformation("Getting tasks for user ID: {UserId}", userId);
            var tasks = await _taskRepository.GetByUserIdAsync(userId);
            return _mapper.Map<IEnumerable<TaskDto>>(tasks);
        }

        public async Task<IEnumerable<TaskDto>> GetTasksByCategoryIdAsync(int categoryId)
        {
            _logger.LogInformation("Getting tasks for category ID: {CategoryId}", categoryId);
            var tasks = await _taskRepository.GetByCategoryIdAsync(categoryId);
            return _mapper.Map<IEnumerable<TaskDto>>(tasks);
        }

        public async Task<IEnumerable<TaskDto>> GetTasksByStatusAsync(TaskStatus status)
        {
            _logger.LogInformation("Getting tasks with status: {Status}", status);
            var tasks = await _taskRepository.GetByStatusAsync(status);
            return _mapper.Map<IEnumerable<TaskDto>>(tasks);
        }

        public async Task<TaskDto> CreateTaskAsync(CreateTaskDto createTaskDto)
        {
            _logger.LogInformation("Creating new task: {TaskTitle}", createTaskDto.Title);
            
            // Validate user exists
            if (!await _userRepository.ExistsAsync(createTaskDto.UserId))
            {
                throw new ArgumentException($"User with ID {createTaskDto.UserId} does not exist.");
            }

            // Validate category exists if provided
            if (createTaskDto.CategoryId.HasValue && !await _categoryRepository.ExistsAsync(createTaskDto.CategoryId.Value))
            {
                throw new ArgumentException($"Category with ID {createTaskDto.CategoryId} does not exist.");
            }

            var task = _mapper.Map<TaskItem>(createTaskDto);
            var createdTask = await _taskRepository.CreateAsync(task);
            return _mapper.Map<TaskDto>(createdTask);
        }

        public async Task<TaskDto?> UpdateTaskAsync(int id, UpdateTaskDto updateTaskDto)
        {
            _logger.LogInformation("Updating task with ID: {TaskId}", id);
            
            var existingTask = await _taskRepository.GetByIdAsync(id);
            if (existingTask == null)
            {
                return null;
            }

            // Validate user exists
            if (!await _userRepository.ExistsAsync(updateTaskDto.UserId))
            {
                throw new ArgumentException($"User with ID {updateTaskDto.UserId} does not exist.");
            }

            // Validate category exists if provided
            if (updateTaskDto.CategoryId.HasValue && !await _categoryRepository.ExistsAsync(updateTaskDto.CategoryId.Value))
            {
                throw new ArgumentException($"Category with ID {updateTaskDto.CategoryId} does not exist.");
            }

            _mapper.Map(updateTaskDto, existingTask);
            var updatedTask = await _taskRepository.UpdateAsync(existingTask);
            return _mapper.Map<TaskDto>(updatedTask);
        }

        public async Task<bool> DeleteTaskAsync(int id)
        {
            _logger.LogInformation("Deleting task with ID: {TaskId}", id);
            return await _taskRepository.DeleteAsync(id);
        }
    }
}
