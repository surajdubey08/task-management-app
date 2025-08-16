using AutoMapper;
using TaskManagement.API.DTOs;
using TaskManagement.API.Models;
using TaskManagement.API.Repositories;

namespace TaskManagement.API.Services
{
    public class TaskActivityService : ITaskActivityService
    {
        private readonly ITaskActivityRepository _activityRepository;
        private readonly IMapper _mapper;
        private readonly ILogger<TaskActivityService> _logger;

        public TaskActivityService(
            ITaskActivityRepository activityRepository,
            IMapper mapper,
            ILogger<TaskActivityService> logger)
        {
            _activityRepository = activityRepository;
            _mapper = mapper;
            _logger = logger;
        }

        public async Task<IEnumerable<TaskActivityDto>> GetActivitiesByTaskIdAsync(int taskId)
        {
            _logger.LogInformation("Getting activities for task ID: {TaskId}", taskId);
            var activities = await _activityRepository.GetByTaskIdAsync(taskId);
            return _mapper.Map<IEnumerable<TaskActivityDto>>(activities);
        }

        public async Task<TaskActivityDto> CreateActivityAsync(int taskId, int userId, ActivityType activityType, string? description = null, string? oldValue = null, string? newValue = null)
        {
            _logger.LogInformation("Creating activity for task ID: {TaskId}, Type: {ActivityType}", taskId, activityType);
            
            var activity = new TaskActivity
            {
                TaskId = taskId,
                UserId = userId,
                ActivityType = activityType,
                Description = description,
                OldValue = oldValue,
                NewValue = newValue
            };

            var createdActivity = await _activityRepository.CreateAsync(activity);
            return _mapper.Map<TaskActivityDto>(createdActivity);
        }
    }
}
