using Microsoft.AspNetCore.SignalR;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using TaskManagement.API.Services;

namespace TaskManagement.API.Hubs
{
    [Authorize]
    public class TaskManagementHub : Hub
    {
        private readonly ILogger<TaskManagementHub> _logger;
        private readonly IUserService _userService;
        private static readonly Dictionary<string, UserPresence> ConnectedUsers = new();

        public TaskManagementHub(ILogger<TaskManagementHub> logger, IUserService userService)
        {
            _logger = logger;
            _userService = userService;
        }

        public override async Task OnConnectedAsync()
        {
            var userId = GetUserId();
            var userName = GetUserName();
            
            if (userId != null && userName != null)
            {
                var userPresence = new UserPresence
                {
                    UserId = userId,
                    UserName = userName,
                    ConnectionId = Context.ConnectionId,
                    ConnectedAt = DateTime.UtcNow,
                    LastActivity = DateTime.UtcNow
                };

                ConnectedUsers[Context.ConnectionId] = userPresence;
                
                // Add to user-specific group
                await Groups.AddToGroupAsync(Context.ConnectionId, $"User_{userId}");
                
                // Notify others about user presence
                await Clients.Others.SendAsync("UserConnected", new
                {
                    UserId = userId,
                    UserName = userName,
                    ConnectedAt = userPresence.ConnectedAt
                });

                _logger.LogInformation("User {UserName} ({UserId}) connected with connection {ConnectionId}", 
                    userName, userId, Context.ConnectionId);
            }

            await base.OnConnectedAsync();
        }

        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            if (ConnectedUsers.TryGetValue(Context.ConnectionId, out var userPresence))
            {
                ConnectedUsers.Remove(Context.ConnectionId);
                
                // Remove from user-specific group
                await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"User_{userPresence.UserId}");
                
                // Notify others about user disconnection
                await Clients.Others.SendAsync("UserDisconnected", new
                {
                    UserId = userPresence.UserId,
                    UserName = userPresence.UserName,
                    DisconnectedAt = DateTime.UtcNow
                });

                _logger.LogInformation("User {UserName} ({UserId}) disconnected", 
                    userPresence.UserName, userPresence.UserId);
            }

            await base.OnDisconnectedAsync(exception);
        }

        // Task-related real-time methods
        public async Task JoinTaskGroup(int taskId)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, $"Task_{taskId}");
            
            var userId = GetUserId();
            var userName = GetUserName();
            
            await Clients.Group($"Task_{taskId}").SendAsync("UserJoinedTask", new
            {
                TaskId = taskId,
                UserId = userId,
                UserName = userName,
                JoinedAt = DateTime.UtcNow
            });

            _logger.LogInformation("User {UserName} joined task {TaskId} group", userName, taskId);
        }

        public async Task LeaveTaskGroup(int taskId)
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"Task_{taskId}");
            
            var userId = GetUserId();
            var userName = GetUserName();
            
            await Clients.Group($"Task_{taskId}").SendAsync("UserLeftTask", new
            {
                TaskId = taskId,
                UserId = userId,
                UserName = userName,
                LeftAt = DateTime.UtcNow
            });

            _logger.LogInformation("User {UserName} left task {TaskId} group", userName, taskId);
        }

        // Real-time task updates
        public async Task NotifyTaskUpdate(int taskId, object updateData)
        {
            await Clients.Group($"Task_{taskId}").SendAsync("TaskUpdated", new
            {
                TaskId = taskId,
                UpdatedBy = GetUserName(),
                UpdatedAt = DateTime.UtcNow,
                Data = updateData
            });
        }

        public async Task NotifyTaskStatusChange(int taskId, string oldStatus, string newStatus)
        {
            await Clients.All.SendAsync("TaskStatusChanged", new
            {
                TaskId = taskId,
                OldStatus = oldStatus,
                NewStatus = newStatus,
                UpdatedBy = GetUserName(),
                UpdatedAt = DateTime.UtcNow
            });
        }

        public async Task NotifyTaskAssignment(int taskId, int assignedUserId, string assignedUserName)
        {
            // Notify the assigned user
            await Clients.Group($"User_{assignedUserId}").SendAsync("TaskAssigned", new
            {
                TaskId = taskId,
                AssignedBy = GetUserName(),
                AssignedAt = DateTime.UtcNow
            });

            // Notify task watchers
            await Clients.Group($"Task_{taskId}").SendAsync("TaskAssignmentChanged", new
            {
                TaskId = taskId,
                AssignedUserId = assignedUserId,
                AssignedUserName = assignedUserName,
                AssignedBy = GetUserName(),
                AssignedAt = DateTime.UtcNow
            });
        }

        // Comment-related methods
        public async Task NotifyNewComment(int taskId, object comment)
        {
            await Clients.Group($"Task_{taskId}").SendAsync("NewComment", new
            {
                TaskId = taskId,
                Comment = comment,
                AddedBy = GetUserName(),
                AddedAt = DateTime.UtcNow
            });
        }

        // Typing indicators
        public async Task StartTyping(int taskId)
        {
            var userName = GetUserName();
            await Clients.OthersInGroup($"Task_{taskId}").SendAsync("UserStartedTyping", new
            {
                TaskId = taskId,
                UserName = userName,
                StartedAt = DateTime.UtcNow
            });
        }

        public async Task StopTyping(int taskId)
        {
            var userName = GetUserName();
            await Clients.OthersInGroup($"Task_{taskId}").SendAsync("UserStoppedTyping", new
            {
                TaskId = taskId,
                UserName = userName,
                StoppedAt = DateTime.UtcNow
            });
        }

        // User presence methods
        public async Task UpdateActivity()
        {
            if (ConnectedUsers.TryGetValue(Context.ConnectionId, out var userPresence))
            {
                userPresence.LastActivity = DateTime.UtcNow;
            }
        }

        public async Task GetConnectedUsers()
        {
            var connectedUsersList = ConnectedUsers.Values
                .GroupBy(u => u.UserId)
                .Select(g => new
                {
                    UserId = g.Key,
                    UserName = g.First().UserName,
                    ConnectionCount = g.Count(),
                    LastActivity = g.Max(u => u.LastActivity)
                })
                .ToList();

            await Clients.Caller.SendAsync("ConnectedUsersList", connectedUsersList);
        }

        // Broadcast methods (for admin/system notifications)
        public async Task BroadcastSystemMessage(string message, string type = "info")
        {
            var userId = GetUserId();
            
            // Only allow admins to broadcast system messages
            var user = await _userService.GetUserByIdAsync(int.Parse(userId));
            if (user?.Role == Models.UserRole.Admin)
            {
                await Clients.All.SendAsync("SystemMessage", new
                {
                    Message = message,
                    Type = type,
                    BroadcastBy = GetUserName(),
                    BroadcastAt = DateTime.UtcNow
                });
            }
        }

        // Helper methods
        private string? GetUserId()
        {
            return Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        }

        private string? GetUserName()
        {
            return Context.User?.FindFirst(ClaimTypes.Name)?.Value;
        }

        private string? GetUserEmail()
        {
            return Context.User?.FindFirst(ClaimTypes.Email)?.Value;
        }

        // Static method to get connected users (for use in controllers)
        public static List<UserPresence> GetAllConnectedUsers()
        {
            return ConnectedUsers.Values.ToList();
        }

        public static bool IsUserConnected(string userId)
        {
            return ConnectedUsers.Values.Any(u => u.UserId == userId);
        }
    }

    public class UserPresence
    {
        public string UserId { get; set; } = string.Empty;
        public string UserName { get; set; } = string.Empty;
        public string ConnectionId { get; set; } = string.Empty;
        public DateTime ConnectedAt { get; set; }
        public DateTime LastActivity { get; set; }
    }
}