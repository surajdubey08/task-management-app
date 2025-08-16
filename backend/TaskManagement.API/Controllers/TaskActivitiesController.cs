using Microsoft.AspNetCore.Mvc;
using TaskManagement.API.DTOs;
using TaskManagement.API.Services;

namespace TaskManagement.API.Controllers
{
    [ApiController]
    [Route("api/tasks/{taskId}/activities")]
    public class TaskActivitiesController : ControllerBase
    {
        private readonly ITaskActivityService _activityService;
        private readonly ILogger<TaskActivitiesController> _logger;

        public TaskActivitiesController(
            ITaskActivityService activityService,
            ILogger<TaskActivitiesController> logger)
        {
            _activityService = activityService;
            _logger = logger;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<TaskActivityDto>>> GetActivities(int taskId)
        {
            try
            {
                _logger.LogInformation("Getting activities for task ID: {TaskId}", taskId);
                var activities = await _activityService.GetActivitiesByTaskIdAsync(taskId);
                return Ok(activities);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while getting activities for task ID: {TaskId}", taskId);
                return StatusCode(500, "An error occurred while processing your request.");
            }
        }
    }
}
