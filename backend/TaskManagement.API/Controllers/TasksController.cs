using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using TaskManagement.API.DTOs;
using TaskManagement.API.Models;
using TaskManagement.API.Services;
using TaskManagement.API.Hubs;
using TaskStatus = TaskManagement.API.Models.TaskStatus;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.ResponseCaching;

namespace TaskManagement.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class TasksController : ControllerBase
    {
        private readonly ITaskService _taskService;
        private readonly IQueryOptimizationService _queryOptimizationService;
        private readonly ILogger<TasksController> _logger;
        private readonly IHubContext<TaskManagementHub> _hubContext;

        public TasksController(
            ITaskService taskService,
            IQueryOptimizationService queryOptimizationService,
            ILogger<TasksController> logger,
            IHubContext<TaskManagementHub> hubContext)
        {
            _taskService = taskService;
            _queryOptimizationService = queryOptimizationService;
            _logger = logger;
            _hubContext = hubContext;
        }

        [HttpGet]
        [ResponseCache(Duration = 300, VaryByQueryKeys = new[] { "userId", "categoryId", "status", "page", "pageSize" })]
        public async Task<ActionResult<IEnumerable<TaskDto>>> GetTasks(
            [FromQuery] int? userId = null,
            [FromQuery] int? categoryId = null,
            [FromQuery] TaskStatus? status = null,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 20)
        {
            try
            {
                _logger.LogInformation("Getting tasks with filters - UserId: {UserId}, CategoryId: {CategoryId}, Status: {Status}, Page: {Page}, PageSize: {PageSize}", 
                    userId, categoryId, status, page, pageSize);

                // Use optimized query service for paginated results
                var tasks = await _queryOptimizationService.GetTasksWithOptimizedLoadingAsync(
                    userId, categoryId, status, page, Math.Min(pageSize, 100));

                var taskDtos = tasks.Select(t => new TaskDto
                {
                    Id = t.Id,
                    Title = t.Title,
                    Description = t.Description,
                    Status = t.Status,
                    Priority = t.Priority,
                    DueDate = t.DueDate,
                    CreatedAt = t.CreatedAt,
                    UpdatedAt = t.UpdatedAt,
                    UserId = t.AssignedUserId,
                    UserName = t.AssignedUser?.Name,
                    CategoryId = t.CategoryId,
                    CategoryName = t.Category?.Name
                });

                return Ok(taskDtos);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while getting tasks");
                return StatusCode(500, "An error occurred while processing your request.");
            }
        }

        [HttpGet("{id}")]
        [ResponseCache(Duration = 600, VaryByHeader = "Authorization")]
        public async Task<ActionResult<TaskDto>> GetTask(int id)
        {
            try
            {
                _logger.LogInformation("Getting task with ID: {TaskId}", id);
                
                // Use optimized query for task details
                var task = await _queryOptimizationService.GetTaskWithDetailsAsync(id);

                if (task == null)
                {
                    return NotFound($"Task with ID {id} not found.");
                }

                var taskDto = new TaskDto
                {
                    Id = task.Id,
                    Title = task.Title,
                    Description = task.Description,
                    Status = task.Status,
                    Priority = task.Priority,
                    DueDate = task.DueDate,
                    CreatedAt = task.CreatedAt,
                    UpdatedAt = task.UpdatedAt,
                    UserId = task.AssignedUserId,
                    UserName = task.AssignedUser?.Name,
                    CategoryId = task.CategoryId,
                    CategoryName = task.Category?.Name
                };

                return Ok(taskDto);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while getting task with ID: {TaskId}", id);
                return StatusCode(500, "An error occurred while processing your request.");
            }
        }

        [HttpGet("kanban")]
        [ResponseCache(Duration = 180, VaryByHeader = "Authorization")]
        public async Task<ActionResult<IEnumerable<TaskDto>>> GetTasksForKanban()
        {
            try
            {
                _logger.LogInformation("Getting tasks for Kanban board");
                
                var tasks = await _queryOptimizationService.GetTasksForKanbanAsync();
                
                var taskDtos = tasks.Select(t => new TaskDto
                {
                    Id = t.Id,
                    Title = t.Title,
                    Description = t.Description,
                    Status = t.Status,
                    Priority = t.Priority,
                    DueDate = t.DueDate,
                    CreatedAt = t.CreatedAt,
                    UpdatedAt = t.UpdatedAt,
                    UserId = t.AssignedUserId,
                    UserName = t.AssignedUser?.Name,
                    CategoryId = t.CategoryId,
                    CategoryName = t.Category?.Name
                });

                return Ok(taskDtos);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while getting tasks for Kanban");
                return StatusCode(500, "An error occurred while processing your request.");
            }
        }

        [HttpGet("dashboard-stats")]
        [ResponseCache(Duration = 300)]
        public async Task<ActionResult<Dictionary<string, object>>> GetDashboardStats()
        {
            try
            {
                _logger.LogInformation("Getting dashboard statistics");
                
                var stats = await _queryOptimizationService.GetDashboardStatsAsync();
                
                return Ok(stats);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while getting dashboard stats");
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
                
                // Send real-time notification
                await _hubContext.Clients.All.SendAsync("TaskCreated", new
                {
                    TaskId = task.Id,
                    Title = task.Title,
                    CreatedBy = task.UserName,
                    CreatedAt = task.CreatedAt
                });
                
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
                
                // Get the current task to compare changes
                var currentTask = await _taskService.GetTaskByIdAsync(id);
                if (currentTask == null)
                {
                    return NotFound($"Task with ID {id} not found.");
                }
                
                var task = await _taskService.UpdateTaskAsync(id, updateTaskDto);
                if (task == null)
                {
                    return NotFound($"Task with ID {id} not found.");
                }

                // Send real-time notification for task update
                await _hubContext.Clients.All.SendAsync("TaskUpdated", new
                {
                    TaskId = task.Id,
                    Title = task.Title,
                    UpdatedBy = task.UserName,
                    UpdatedAt = task.UpdatedAt,
                    Changes = GetTaskChanges(currentTask, task)
                });
                
                // Send specific notification for status changes
                if (currentTask.Status != task.Status)
                {
                    await _hubContext.Clients.All.SendAsync("TaskStatusChanged", new
                    {
                        TaskId = task.Id,
                        Title = task.Title,
                        OldStatus = currentTask.Status.ToString(),
                        NewStatus = task.Status.ToString(),
                        UpdatedBy = task.UserName,
                        UpdatedAt = task.UpdatedAt
                    });
                }
                
                // Send notification for assignment changes
                if (currentTask.UserId != task.UserId)
                {
                    await _hubContext.Clients.Group($"User_{task.UserId}").SendAsync("TaskAssigned", new
                    {
                        TaskId = task.Id,
                        Title = task.Title,
                        AssignedBy = task.UserName,
                        AssignedAt = task.UpdatedAt
                    });
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
                
                // Get task details before deletion for notification
                var task = await _taskService.GetTaskByIdAsync(id);
                if (task == null)
                {
                    return NotFound($"Task with ID {id} not found.");
                }
                
                var result = await _taskService.DeleteTaskAsync(id);
                if (!result)
                {
                    return NotFound($"Task with ID {id} not found.");
                }

                // Send real-time notification
                await _hubContext.Clients.All.SendAsync("TaskDeleted", new
                {
                    TaskId = id,
                    Title = task.Title,
                    DeletedAt = DateTime.UtcNow
                });

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while deleting task with ID: {TaskId}", id);
                return StatusCode(500, "An error occurred while processing your request.");
            }
        }
        
        private static object GetTaskChanges(TaskDto oldTask, TaskDto newTask)
        {
            var changes = new List<object>();
            
            if (oldTask.Title != newTask.Title)
                changes.Add(new { Field = "Title", OldValue = oldTask.Title, NewValue = newTask.Title });
                
            if (oldTask.Description != newTask.Description)
                changes.Add(new { Field = "Description", OldValue = oldTask.Description, NewValue = newTask.Description });
                
            if (oldTask.Status != newTask.Status)
                changes.Add(new { Field = "Status", OldValue = oldTask.Status.ToString(), NewValue = newTask.Status.ToString() });
                
            if (oldTask.Priority != newTask.Priority)
                changes.Add(new { Field = "Priority", OldValue = oldTask.Priority.ToString(), NewValue = newTask.Priority.ToString() });
                
            if (oldTask.DueDate != newTask.DueDate)
                changes.Add(new { Field = "DueDate", OldValue = oldTask.DueDate, NewValue = newTask.DueDate });
                
            if (oldTask.UserId != newTask.UserId)
                changes.Add(new { Field = "AssignedUser", OldValue = oldTask.UserName, NewValue = newTask.UserName });
                
            if (oldTask.CategoryId != newTask.CategoryId)
                changes.Add(new { Field = "Category", OldValue = oldTask.CategoryName, NewValue = newTask.CategoryName });
            
            return changes;
        }
    }
}
