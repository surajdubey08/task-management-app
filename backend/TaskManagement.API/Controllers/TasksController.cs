using Microsoft.AspNetCore.Mvc;
using TaskManagement.API.DTOs;
using TaskManagement.API.Models;
using TaskManagement.API.Services;
using TaskStatus = TaskManagement.API.Models.TaskStatus;

namespace TaskManagement.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class TasksController : ControllerBase
    {
        private readonly ITaskService _taskService;
        private readonly ILogger<TasksController> _logger;

        public TasksController(ITaskService taskService, ILogger<TasksController> logger)
        {
            _taskService = taskService;
            _logger = logger;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<TaskDto>>> GetTasks(
            [FromQuery] int? userId = null,
            [FromQuery] int? categoryId = null,
            [FromQuery] TaskStatus? status = null)
        {
            try
            {
                _logger.LogInformation("Getting tasks with filters - UserId: {UserId}, CategoryId: {CategoryId}, Status: {Status}", 
                    userId, categoryId, status);

                IEnumerable<TaskDto> tasks;

                if (userId.HasValue)
                {
                    tasks = await _taskService.GetTasksByUserIdAsync(userId.Value);
                }
                else if (categoryId.HasValue)
                {
                    tasks = await _taskService.GetTasksByCategoryIdAsync(categoryId.Value);
                }
                else if (status.HasValue)
                {
                    tasks = await _taskService.GetTasksByStatusAsync(status.Value);
                }
                else
                {
                    tasks = await _taskService.GetAllTasksAsync();
                }

                return Ok(tasks);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while getting tasks");
                return StatusCode(500, "An error occurred while processing your request.");
            }
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<TaskDto>> GetTask(int id)
        {
            try
            {
                _logger.LogInformation("Getting task with ID: {TaskId}", id);
                var task = await _taskService.GetTaskByIdAsync(id);

                if (task == null)
                {
                    return NotFound($"Task with ID {id} not found.");
                }

                return Ok(task);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while getting task with ID: {TaskId}", id);
                return StatusCode(500, "An error occurred while processing your request.");
            }
        }

        [HttpPost]
        public async Task<ActionResult<TaskDto>> CreateTask(CreateTaskDto createTaskDto)
        {
            try
            {
                _logger.LogInformation("Creating new task: {TaskTitle}", createTaskDto.Title);
                var task = await _taskService.CreateTaskAsync(createTaskDto);
                return CreatedAtAction(nameof(GetTask), new { id = task.Id }, task);
            }
            catch (ArgumentException ex)
            {
                _logger.LogWarning(ex, "Invalid argument while creating task");
                return BadRequest(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while creating task");
                return StatusCode(500, "An error occurred while processing your request.");
            }
        }

        [HttpPut("{id}")]
        public async Task<ActionResult<TaskDto>> UpdateTask(int id, UpdateTaskDto updateTaskDto)
        {
            try
            {
                _logger.LogInformation("Updating task with ID: {TaskId}", id);
                var task = await _taskService.UpdateTaskAsync(id, updateTaskDto);

                if (task == null)
                {
                    return NotFound($"Task with ID {id} not found.");
                }

                return Ok(task);
            }
            catch (ArgumentException ex)
            {
                _logger.LogWarning(ex, "Invalid argument while updating task with ID: {TaskId}", id);
                return BadRequest(ex.Message);
            }
            catch (InvalidOperationException ex)
            {
                _logger.LogWarning(ex, "Invalid operation while updating task with ID: {TaskId}", id);
                return BadRequest(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while updating task with ID: {TaskId}", id);
                return StatusCode(500, "An error occurred while processing your request.");
            }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteTask(int id)
        {
            try
            {
                _logger.LogInformation("Deleting task with ID: {TaskId}", id);
                var result = await _taskService.DeleteTaskAsync(id);

                if (!result)
                {
                    return NotFound($"Task with ID {id} not found.");
                }

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while deleting task with ID: {TaskId}", id);
                return StatusCode(500, "An error occurred while processing your request.");
            }
        }
    }
}
