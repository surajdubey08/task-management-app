using Microsoft.AspNetCore.Mvc;
using TaskManagement.API.DTOs;
using TaskManagement.API.Services;

namespace TaskManagement.API.Controllers
{
    [ApiController]
    [Route("api/tasks/{taskId}/dependencies")]
    public class TaskDependenciesController : ControllerBase
    {
        private readonly ITaskDependencyService _dependencyService;
        private readonly ILogger<TaskDependenciesController> _logger;

        public TaskDependenciesController(
            ITaskDependencyService dependencyService,
            ILogger<TaskDependenciesController> logger)
        {
            _dependencyService = dependencyService;
            _logger = logger;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<TaskDependencyDto>>> GetDependencies(int taskId)
        {
            try
            {
                _logger.LogInformation("Getting dependencies for task ID: {TaskId}", taskId);
                var dependencies = await _dependencyService.GetDependenciesByTaskIdAsync(taskId);
                return Ok(dependencies);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while getting dependencies for task ID: {TaskId}", taskId);
                return StatusCode(500, "An error occurred while processing your request.");
            }
        }

        [HttpGet("with-details")]
        public async Task<ActionResult<TaskWithDependenciesDto>> GetTaskWithDependencies(int taskId)
        {
            try
            {
                _logger.LogInformation("Getting task with dependencies for task ID: {TaskId}", taskId);
                var taskWithDependencies = await _dependencyService.GetTaskWithDependenciesAsync(taskId);
                return Ok(taskWithDependencies);
            }
            catch (ArgumentException ex)
            {
                _logger.LogWarning(ex, "Task not found: {TaskId}", taskId);
                return NotFound(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while getting task with dependencies for task ID: {TaskId}", taskId);
                return StatusCode(500, "An error occurred while processing your request.");
            }
        }

        [HttpPost]
        public async Task<ActionResult<TaskDependencyDto>> CreateDependency(int taskId, CreateTaskDependencyDto createDependencyDto)
        {
            try
            {
                // Ensure the taskId in the route matches the DTO
                createDependencyDto.TaskId = taskId;
                
                _logger.LogInformation("Creating dependency for task ID: {TaskId}", taskId);
                var dependency = await _dependencyService.CreateDependencyAsync(createDependencyDto);
                return CreatedAtAction(nameof(GetDependencies), new { taskId }, dependency);
            }
            catch (ArgumentException ex)
            {
                _logger.LogWarning(ex, "Invalid argument while creating dependency for task ID: {TaskId}", taskId);
                return BadRequest(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while creating dependency for task ID: {TaskId}", taskId);
                return StatusCode(500, "An error occurred while processing your request.");
            }
        }

        [HttpGet("can-start")]
        public async Task<ActionResult<bool>> CanTaskStart(int taskId)
        {
            try
            {
                _logger.LogInformation("Checking if task can start for task ID: {TaskId}", taskId);
                var canStart = await _dependencyService.CanTaskStartAsync(taskId);
                return Ok(canStart);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while checking if task can start for task ID: {TaskId}", taskId);
                return StatusCode(500, "An error occurred while processing your request.");
            }
        }

        [HttpGet("blocking-reasons")]
        public async Task<ActionResult<IEnumerable<string>>> GetBlockingReasons(int taskId)
        {
            try
            {
                _logger.LogInformation("Getting blocking reasons for task ID: {TaskId}", taskId);
                var reasons = await _dependencyService.GetBlockingReasonsAsync(taskId);
                return Ok(reasons);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while getting blocking reasons for task ID: {TaskId}", taskId);
                return StatusCode(500, "An error occurred while processing your request.");
            }
        }
    }

    [ApiController]
    [Route("api/dependencies")]
    public class DependenciesController : ControllerBase
    {
        private readonly ITaskDependencyService _dependencyService;
        private readonly ILogger<DependenciesController> _logger;

        public DependenciesController(
            ITaskDependencyService dependencyService,
            ILogger<DependenciesController> logger)
        {
            _dependencyService = dependencyService;
            _logger = logger;
        }

        [HttpDelete("{dependencyId}")]
        public async Task<IActionResult> DeleteDependency(int dependencyId)
        {
            try
            {
                _logger.LogInformation("Deleting dependency with ID: {DependencyId}", dependencyId);
                var deleted = await _dependencyService.DeleteDependencyAsync(dependencyId);
                
                if (!deleted)
                {
                    return NotFound();
                }

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while deleting dependency ID: {DependencyId}", dependencyId);
                return StatusCode(500, "An error occurred while processing your request.");
            }
        }
    }
}
