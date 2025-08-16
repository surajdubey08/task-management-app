using Microsoft.AspNetCore.Mvc;
using TaskManagement.API.DTOs;
using TaskManagement.API.Services;

namespace TaskManagement.API.Controllers
{
    [ApiController]
    [Route("api/tasks/{taskId}/comments")]
    public class TaskCommentsController : ControllerBase
    {
        private readonly ITaskCommentService _commentService;
        private readonly ITaskActivityService _activityService;
        private readonly ILogger<TaskCommentsController> _logger;

        public TaskCommentsController(
            ITaskCommentService commentService,
            ITaskActivityService activityService,
            ILogger<TaskCommentsController> logger)
        {
            _commentService = commentService;
            _activityService = activityService;
            _logger = logger;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<TaskCommentDto>>> GetComments(int taskId)
        {
            try
            {
                _logger.LogInformation("Getting comments for task ID: {TaskId}", taskId);
                var comments = await _commentService.GetCommentsByTaskIdAsync(taskId);
                return Ok(comments);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while getting comments for task ID: {TaskId}", taskId);
                return StatusCode(500, "An error occurred while processing your request.");
            }
        }

        [HttpPost]
        public async Task<ActionResult<TaskCommentDto>> CreateComment(int taskId, CreateTaskCommentDto createCommentDto)
        {
            try
            {
                // Ensure the taskId in the route matches the DTO
                createCommentDto.TaskId = taskId;
                
                _logger.LogInformation("Creating comment for task ID: {TaskId}", taskId);
                var comment = await _commentService.CreateCommentAsync(createCommentDto);
                
                // Create activity log for the comment
                await _activityService.CreateActivityAsync(
                    taskId, 
                    createCommentDto.UserId, 
                    Models.ActivityType.Commented, 
                    "Added a comment");

                return CreatedAtAction(nameof(GetComment), new { taskId, id = comment.Id }, comment);
            }
            catch (ArgumentException ex)
            {
                _logger.LogWarning(ex, "Invalid argument while creating comment for task ID: {TaskId}", taskId);
                return BadRequest(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while creating comment for task ID: {TaskId}", taskId);
                return StatusCode(500, "An error occurred while processing your request.");
            }
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<TaskCommentDto>> GetComment(int taskId, int id)
        {
            try
            {
                _logger.LogInformation("Getting comment ID: {CommentId} for task ID: {TaskId}", id, taskId);
                var comment = await _commentService.GetCommentByIdAsync(id);
                
                if (comment == null || comment.TaskId != taskId)
                {
                    return NotFound();
                }

                return Ok(comment);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while getting comment ID: {CommentId}", id);
                return StatusCode(500, "An error occurred while processing your request.");
            }
        }

        [HttpPut("{id}")]
        public async Task<ActionResult<TaskCommentDto>> UpdateComment(int taskId, int id, UpdateTaskCommentDto updateCommentDto)
        {
            try
            {
                _logger.LogInformation("Updating comment ID: {CommentId} for task ID: {TaskId}", id, taskId);
                var comment = await _commentService.UpdateCommentAsync(id, updateCommentDto);
                
                if (comment == null || comment.TaskId != taskId)
                {
                    return NotFound();
                }

                return Ok(comment);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while updating comment ID: {CommentId}", id);
                return StatusCode(500, "An error occurred while processing your request.");
            }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteComment(int taskId, int id)
        {
            try
            {
                _logger.LogInformation("Deleting comment ID: {CommentId} for task ID: {TaskId}", id, taskId);
                
                // First check if the comment exists and belongs to the task
                var comment = await _commentService.GetCommentByIdAsync(id);
                if (comment == null || comment.TaskId != taskId)
                {
                    return NotFound();
                }

                var deleted = await _commentService.DeleteCommentAsync(id);
                if (!deleted)
                {
                    return NotFound();
                }

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while deleting comment ID: {CommentId}", id);
                return StatusCode(500, "An error occurred while processing your request.");
            }
        }
    }
}
