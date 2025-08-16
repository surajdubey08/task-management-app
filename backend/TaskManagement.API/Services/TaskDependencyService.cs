using AutoMapper;
using TaskManagement.API.DTOs;
using TaskManagement.API.Models;
using TaskManagement.API.Repositories;

namespace TaskManagement.API.Services
{
    public class TaskDependencyService : ITaskDependencyService
    {
        private readonly ITaskDependencyRepository _dependencyRepository;
        private readonly ITaskRepository _taskRepository;
        private readonly ITaskActivityService _activityService;
        private readonly IMapper _mapper;
        private readonly ILogger<TaskDependencyService> _logger;

        public TaskDependencyService(
            ITaskDependencyRepository dependencyRepository,
            ITaskRepository taskRepository,
            ITaskActivityService activityService,
            IMapper mapper,
            ILogger<TaskDependencyService> logger)
        {
            _dependencyRepository = dependencyRepository;
            _taskRepository = taskRepository;
            _activityService = activityService;
            _mapper = mapper;
            _logger = logger;
        }

        public async Task<IEnumerable<TaskDependencyDto>> GetDependenciesByTaskIdAsync(int taskId)
        {
            _logger.LogInformation("Getting dependencies for task ID: {TaskId}", taskId);
            var dependencies = await _dependencyRepository.GetByTaskIdAsync(taskId);
            return _mapper.Map<IEnumerable<TaskDependencyDto>>(dependencies);
        }

        public async Task<TaskWithDependenciesDto> GetTaskWithDependenciesAsync(int taskId)
        {
            _logger.LogInformation("Getting task with dependencies for task ID: {TaskId}", taskId);
            
            var task = await _taskRepository.GetByIdAsync(taskId);
            if (task == null)
            {
                throw new ArgumentException($"Task with ID {taskId} not found.");
            }

            var taskDto = _mapper.Map<TaskWithDependenciesDto>(task);
            
            // Get dependencies (tasks that block this task)
            var blockedByDependencies = await _dependencyRepository.GetDependenciesForTaskAsync(taskId);
            taskDto.BlockedBy = _mapper.Map<List<TaskDependencyDto>>(blockedByDependencies);
            
            // Get dependents (tasks that this task blocks)
            var blocksDependencies = await _dependencyRepository.GetDependentsForTaskAsync(taskId);
            taskDto.Blocks = _mapper.Map<List<TaskDependencyDto>>(blocksDependencies);
            
            // Check if task can start
            taskDto.CanStart = await CanTaskStartAsync(taskId);
            taskDto.BlockingReasons = (await GetBlockingReasonsAsync(taskId)).ToList();
            
            return taskDto;
        }

        public async Task<TaskDependencyDto> CreateDependencyAsync(CreateTaskDependencyDto createDependencyDto)
        {
            _logger.LogInformation("Creating dependency: Task {TaskId} -> {DependentTaskId}", 
                createDependencyDto.TaskId, createDependencyDto.DependentTaskId);

            // Validate tasks exist
            if (!await _taskRepository.ExistsAsync(createDependencyDto.TaskId))
            {
                throw new ArgumentException($"Task with ID {createDependencyDto.TaskId} does not exist.");
            }

            if (!await _taskRepository.ExistsAsync(createDependencyDto.DependentTaskId))
            {
                throw new ArgumentException($"Dependent task with ID {createDependencyDto.DependentTaskId} does not exist.");
            }

            // Prevent self-dependency
            if (createDependencyDto.TaskId == createDependencyDto.DependentTaskId)
            {
                throw new ArgumentException("A task cannot depend on itself.");
            }

            // Check for existing dependency
            if (await _dependencyRepository.DependencyExistsAsync(
                createDependencyDto.TaskId, 
                createDependencyDto.DependentTaskId, 
                createDependencyDto.DependencyType))
            {
                throw new ArgumentException("This dependency already exists.");
            }

            // Check for circular dependencies
            if (await _dependencyRepository.HasCircularDependencyAsync(
                createDependencyDto.TaskId, 
                createDependencyDto.DependentTaskId))
            {
                throw new ArgumentException("Creating this dependency would result in a circular dependency.");
            }

            var dependency = _mapper.Map<TaskDependency>(createDependencyDto);
            var createdDependency = await _dependencyRepository.CreateAsync(dependency);
            
            // Log activity
            await _activityService.CreateActivityAsync(
                createDependencyDto.TaskId,
                createDependencyDto.CreatedByUserId,
                ActivityType.Created,
                $"Dependency created with task #{createDependencyDto.DependentTaskId}");

            return _mapper.Map<TaskDependencyDto>(createdDependency);
        }

        public async Task<bool> DeleteDependencyAsync(int dependencyId)
        {
            _logger.LogInformation("Deleting dependency with ID: {DependencyId}", dependencyId);
            
            var dependency = await _dependencyRepository.GetByIdAsync(dependencyId);
            if (dependency == null)
            {
                return false;
            }

            var result = await _dependencyRepository.DeleteAsync(dependencyId);
            
            if (result)
            {
                // Log activity
                await _activityService.CreateActivityAsync(
                    dependency.TaskId,
                    dependency.CreatedByUserId,
                    ActivityType.Created,
                    $"Dependency removed with task #{dependency.DependentTaskId}");
            }

            return result;
        }

        public async Task<bool> CanTaskStartAsync(int taskId)
        {
            _logger.LogInformation("Checking if task {TaskId} can start", taskId);
            
            var blockingDependencies = await _dependencyRepository.GetDependenciesForTaskAsync(taskId);
            
            foreach (var dependency in blockingDependencies)
            {
                var blockingTask = await _taskRepository.GetByIdAsync(dependency.DependentTaskId);
                if (blockingTask != null && blockingTask.Status != Models.TaskStatus.Completed)
                {
                    return false;
                }
            }
            
            return true;
        }

        public async Task<IEnumerable<string>> GetBlockingReasonsAsync(int taskId)
        {
            _logger.LogInformation("Getting blocking reasons for task {TaskId}", taskId);
            
            var reasons = new List<string>();
            var blockingDependencies = await _dependencyRepository.GetDependenciesForTaskAsync(taskId);
            
            foreach (var dependency in blockingDependencies)
            {
                var blockingTask = await _taskRepository.GetByIdAsync(dependency.DependentTaskId);
                if (blockingTask != null && blockingTask.Status != Models.TaskStatus.Completed)
                {
                    reasons.Add($"Waiting for task '{blockingTask.Title}' (#{blockingTask.Id}) to be completed");
                }
            }
            
            return reasons;
        }
    }
}
