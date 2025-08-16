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
        private readonly ITaskActivityService _activityService;
        private readonly ITaskDependencyRepository _dependencyRepository;
        private readonly IMapper _mapper;
        private readonly ILogger<TaskService> _logger;

        public TaskService(
            ITaskRepository taskRepository,
            IUserRepository userRepository,
            ICategoryRepository categoryRepository,
            ITaskActivityService activityService,
            ITaskDependencyRepository dependencyRepository,
            IMapper mapper,
            ILogger<TaskService> logger)
        {
            _taskRepository = taskRepository;
            _userRepository = userRepository;
            _categoryRepository = categoryRepository;
            _activityService = activityService;
            _dependencyRepository = dependencyRepository;
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

            // Log task creation activity
            await _activityService.CreateActivityAsync(
                createdTask.Id,
                createTaskDto.UserId,
                ActivityType.Created,
                "Task created");

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

            // Validate dependency constraints for status changes
            await ValidateDependencyConstraintsAsync(id, existingTask.Status, updateTaskDto.Status);

            // Track changes for activity log
            var changes = new List<(ActivityType type, string description, string? oldValue, string? newValue)>();

            if (existingTask.Title != updateTaskDto.Title)
            {
                changes.Add((ActivityType.TitleChanged, "Title changed", existingTask.Title, updateTaskDto.Title));
            }

            if (existingTask.Status != updateTaskDto.Status)
            {
                changes.Add((ActivityType.StatusChanged, "Status changed", existingTask.Status.ToString(), updateTaskDto.Status.ToString()));
            }

            if (existingTask.Priority != updateTaskDto.Priority)
            {
                changes.Add((ActivityType.PriorityChanged, "Priority changed", existingTask.Priority.ToString(), updateTaskDto.Priority.ToString()));
            }

            if (existingTask.UserId != updateTaskDto.UserId)
            {
                changes.Add((ActivityType.AssigneeChanged, "Assignee changed", existingTask.UserId.ToString(), updateTaskDto.UserId.ToString()));
            }

            if (existingTask.CategoryId != updateTaskDto.CategoryId)
            {
                changes.Add((ActivityType.CategoryChanged, "Category changed", existingTask.CategoryId?.ToString(), updateTaskDto.CategoryId?.ToString()));
            }

            if (existingTask.DueDate != updateTaskDto.DueDate)
            {
                changes.Add((ActivityType.DueDateChanged, "Due date changed", existingTask.DueDate?.ToString("yyyy-MM-dd"), updateTaskDto.DueDate?.ToString("yyyy-MM-dd")));
            }

            _mapper.Map(updateTaskDto, existingTask);
            var updatedTask = await _taskRepository.UpdateAsync(existingTask);

            // Log all changes as activities
            foreach (var change in changes)
            {
                await _activityService.CreateActivityAsync(
                    id,
                    updateTaskDto.UserId,
                    change.type,
                    change.description,
                    change.oldValue,
                    change.newValue);
            }

            return _mapper.Map<TaskDto>(updatedTask);
        }

        public async Task<bool> DeleteTaskAsync(int id)
        {
            _logger.LogInformation("Deleting task with ID: {TaskId}", id);
            return await _taskRepository.DeleteAsync(id);
        }

        /// <summary>
        /// Validates all dependency constraints when a task status changes
        /// Handles edge cases like reopening completed tasks, cancelling tasks, etc.
        /// </summary>
        private async Task ValidateDependencyConstraintsAsync(int taskId, TaskStatus oldStatus, TaskStatus newStatus)
        {
            _logger.LogInformation("Validating dependency constraints for task {TaskId}: {OldStatus} -> {NewStatus}",
                taskId, oldStatus, newStatus);

            // Case 1: Task is being moved to In Progress or Completed - check if it's blocked
            if ((newStatus == TaskStatus.InProgress || newStatus == TaskStatus.Completed) &&
                (oldStatus == TaskStatus.Pending || oldStatus == TaskStatus.Cancelled))
            {
                var canStart = await CanTaskStartAsync(taskId);
                if (!canStart)
                {
                    var reasons = await GetBlockingReasonsAsync(taskId);
                    var reasonsText = string.Join("; ", reasons);
                    throw new InvalidOperationException($"Cannot change task status because it is blocked by dependencies: {reasonsText}");
                }
            }

            // Case 2: Completed task is being reopened - this affects dependent tasks
            if (oldStatus == TaskStatus.Completed &&
                (newStatus == TaskStatus.Pending || newStatus == TaskStatus.InProgress))
            {
                _logger.LogWarning("Completed task {TaskId} is being reopened. This may block dependent tasks.", taskId);

                // Find all tasks that depend on this task (tasks that are blocked by this task)
                var dependentTasks = await _dependencyRepository.GetDependentsForTaskAsync(taskId);
                var invalidDependentTasks = new List<string>();

                // Check if any dependent tasks are currently In Progress or Completed
                // These should potentially be blocked now
                foreach (var dependency in dependentTasks)
                {
                    var dependentTask = await _taskRepository.GetByIdAsync(dependency.TaskId);
                    if (dependentTask != null &&
                        (dependentTask.Status == TaskStatus.InProgress || dependentTask.Status == TaskStatus.Completed))
                    {
                        invalidDependentTasks.Add($"'{dependentTask.Title}' (#{dependentTask.Id}) is currently {dependentTask.Status}");
                        _logger.LogWarning("Task {TaskId} reopening will affect dependent task {DependentTaskId} which is currently {Status}",
                            taskId, dependentTask.Id, dependentTask.Status);
                    }
                }

                // STRICT MODE: Prevent reopening if it would invalidate dependent tasks
                if (invalidDependentTasks.Any())
                {
                    var invalidTasksText = string.Join("; ", invalidDependentTasks);
                    throw new InvalidOperationException($"Cannot reopen this task because the following dependent tasks would become invalid: {invalidTasksText}. Please move these tasks back to Pending first, or remove the dependencies.");
                }
            }

            // Case 3: Task is being cancelled - decide if dependent tasks should be freed
            if (newStatus == TaskStatus.Cancelled && oldStatus != TaskStatus.Cancelled)
            {
                _logger.LogInformation("Task {TaskId} is being cancelled. Dependent tasks will remain blocked until dependencies are removed.", taskId);
                // Note: We keep dependencies intact when a task is cancelled
                // This is a business decision - you might want to auto-remove dependencies instead
            }

            // Case 4: Cancelled task is being reactivated
            if (oldStatus == TaskStatus.Cancelled &&
                (newStatus == TaskStatus.Pending || newStatus == TaskStatus.InProgress || newStatus == TaskStatus.Completed))
            {
                // Same validation as Case 1 - check if the task can start
                if (newStatus == TaskStatus.InProgress || newStatus == TaskStatus.Completed)
                {
                    var canStart = await CanTaskStartAsync(taskId);
                    if (!canStart)
                    {
                        var reasons = await GetBlockingReasonsAsync(taskId);
                        var reasonsText = string.Join("; ", reasons);
                        throw new InvalidOperationException($"Cannot reactivate task because it is blocked by dependencies: {reasonsText}");
                    }
                }
            }

            _logger.LogInformation("Dependency constraint validation passed for task {TaskId}", taskId);
        }

        /// <summary>
        /// Helper method to check if a task can start (not blocked by dependencies)
        /// </summary>
        private async Task<bool> CanTaskStartAsync(int taskId)
        {
            var blockingDependencies = await _dependencyRepository.GetDependenciesForTaskAsync(taskId);

            foreach (var dependency in blockingDependencies)
            {
                var blockingTask = await _taskRepository.GetByIdAsync(dependency.DependentTaskId);
                if (blockingTask != null && blockingTask.Status != TaskStatus.Completed)
                {
                    return false;
                }
            }

            return true;
        }

        /// <summary>
        /// Helper method to get reasons why a task is blocked
        /// </summary>
        private async Task<IEnumerable<string>> GetBlockingReasonsAsync(int taskId)
        {
            var reasons = new List<string>();
            var blockingDependencies = await _dependencyRepository.GetDependenciesForTaskAsync(taskId);

            foreach (var dependency in blockingDependencies)
            {
                var blockingTask = await _taskRepository.GetByIdAsync(dependency.DependentTaskId);
                if (blockingTask != null && blockingTask.Status != TaskStatus.Completed)
                {
                    reasons.Add($"Waiting for task '{blockingTask.Title}' (#{blockingTask.Id}) to be completed");
                }
            }

            return reasons;
        }
    }
}
