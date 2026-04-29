 using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using TeamWorkload.API.Data;
using TeamWorkload.API.DTOs;
using TeamWorkload.API.Dtos.Tasks;
using TeamWorkload.API.Enums;
using TeamWorkload.API.Models;
using TeamWorkload.API.Services.Interfaces;

namespace TeamWorkload.API.Controllers
{
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class TasksController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly ITaskWeightService _taskWeightService;

        public TasksController(AppDbContext context, ITaskWeightService taskWeightService)
        {
            _context = context;
            _taskWeightService = taskWeightService;
        }

        [Authorize(Roles = "TeamLeader")]
        [HttpPost]
        public async Task<ActionResult<TaskResponseDto>> CreateTask(CreateTaskDto dto)
        {
            var assignedMember = await _context.Users.FindAsync(dto.AssignedMemberId);
            if (assignedMember == null)
                return BadRequest("Assigned member not found.");

            var createdByClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrWhiteSpace(createdByClaim))
                return Unauthorized("User id not found in token.");

            int createdById = int.Parse(createdByClaim);

            var createdByUser = await _context.Users.FindAsync(createdById);
            if (createdByUser == null)
                return BadRequest("CreatedBy user not found.");

            var calculatedWeight = _taskWeightService.CalculateWeight(
                dto.Priority,
                dto.Complexity,
                dto.EstimatedEffortHours);

            var taskItem = new TaskItem
            {
                Title = dto.Title,
                Description = dto.Description,
                AssignedMemberId = dto.AssignedMemberId,
                CreatedById = createdById,
                Priority = dto.Priority,
                Complexity = dto.Complexity,
                EstimatedEffortHours = dto.EstimatedEffortHours,
                StartDate = dto.StartDate,
                DueDate = dto.DueDate,
                Weight = calculatedWeight,
                Status = WorkTaskStatus.New,
                IsAcknowledged = false,
                CreatedAt = DateTime.UtcNow
            };

            _context.Tasks.Add(taskItem);
            await _context.SaveChangesAsync();

            var response = new TaskResponseDto
            {
                Id = taskItem.Id,
                Title = taskItem.Title,
                Description = taskItem.Description,
                AssignedMemberId = taskItem.AssignedMemberId,
                CreatedById = taskItem.CreatedById,
                Priority = taskItem.Priority,
                Complexity = taskItem.Complexity,
                EstimatedEffortHours = taskItem.EstimatedEffortHours,
                StartDate = taskItem.StartDate,
                DueDate = taskItem.DueDate,
                Status = taskItem.Status,
                Weight = taskItem.Weight,
                IsAcknowledged = taskItem.IsAcknowledged,
                AcknowledgedAt = taskItem.AcknowledgedAt,
                CreatedAt = taskItem.CreatedAt,
                UpdatedAt = taskItem.UpdatedAt
            };

            return CreatedAtAction(nameof(GetTaskById), new { id = taskItem.Id }, response);
        }

        [Authorize(Roles = "TeamLeader")]
        [HttpPut("{id}")]
        public async Task<ActionResult<TaskResponseDto>> UpdateTask(int id, UpdateTaskDto dto)
        {
            var taskItem = await _context.Tasks.FindAsync(id);
            if (taskItem == null)
                return NotFound(new { message = $"Task with id {id} was not found." });

            var assignedMember = await _context.Users.FindAsync(dto.AssignedMemberId);
            if (assignedMember == null)
                return BadRequest("Assigned member not found.");

            bool ownerChanged = taskItem.AssignedMemberId != dto.AssignedMemberId;

            taskItem.Title = dto.Title;
            taskItem.Description = dto.Description;
            taskItem.AssignedMemberId = dto.AssignedMemberId;
            taskItem.Priority = dto.Priority;
            taskItem.Complexity = dto.Complexity;
            taskItem.EstimatedEffortHours = dto.EstimatedEffortHours;
            taskItem.StartDate = dto.StartDate;
            taskItem.DueDate = dto.DueDate;
            taskItem.Weight = _taskWeightService.CalculateWeight(
                dto.Priority,
                dto.Complexity,
                dto.EstimatedEffortHours
            );
            taskItem.UpdatedAt = DateTime.UtcNow;

            if (ownerChanged)
            {
                taskItem.IsAcknowledged = false;
                taskItem.AcknowledgedAt = null;
            }

            await _context.SaveChangesAsync();

            var response = new TaskResponseDto
            {
                Id = taskItem.Id,
                Title = taskItem.Title,
                Description = taskItem.Description,
                AssignedMemberId = taskItem.AssignedMemberId,
                CreatedById = taskItem.CreatedById,
                Priority = taskItem.Priority,
                Complexity = taskItem.Complexity,
                EstimatedEffortHours = taskItem.EstimatedEffortHours,
                StartDate = taskItem.StartDate,
                DueDate = taskItem.DueDate,
                Status = taskItem.Status,
                Weight = taskItem.Weight,
                IsAcknowledged = taskItem.IsAcknowledged,
                AcknowledgedAt = taskItem.AcknowledgedAt,
                CreatedAt = taskItem.CreatedAt,
                UpdatedAt = taskItem.UpdatedAt
            };

            return Ok(response);
        }

        [Authorize]
        [HttpPatch("{id}/acknowledge")]
        public async Task<IActionResult> AcknowledgeTask(int id)
        {
            var taskItem = await _context.Tasks.FindAsync(id);
            if (taskItem == null)
                return NotFound("Task not found.");

            var currentUserClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrWhiteSpace(currentUserClaim))
                return Unauthorized("User id not found in token.");

            int currentUserId = int.Parse(currentUserClaim);

            if (taskItem.AssignedMemberId != currentUserId)
                return Forbid();

            if (taskItem.IsAcknowledged)
                return BadRequest("Task already acknowledged.");

            taskItem.IsAcknowledged = true;
            taskItem.AcknowledgedAt = DateTime.UtcNow;
            taskItem.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Task acknowledged successfully.",
                taskItem.Id,
                taskItem.IsAcknowledged,
                taskItem.AcknowledgedAt
            });
        }

        [Authorize(Roles = "TeamLeader")]
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteTask(int id)
        {
            var taskItem = await _context.Tasks.FindAsync(id);

            if (taskItem == null)
            {
                return NotFound(new { message = $"Task with id {id} was not found." });
            }

            var statusHistories = _context.TaskStatusHistories
                .Where(x => x.TaskId == id);

            var changeRequests = _context.TaskChangeRequests
                .Where(x => x.TaskId == id);

            _context.TaskStatusHistories.RemoveRange(statusHistories);
            _context.TaskChangeRequests.RemoveRange(changeRequests);

            _context.Tasks.Remove(taskItem);

            await _context.SaveChangesAsync();

            return Ok(new { message = $"Task with id {id} was deleted successfully." });
        }

        [HttpGet("member/{userId}")]
        public async Task<ActionResult<IEnumerable<TaskResponseDto>>> GetTasksByMember(int userId)
        {
            var user = await _context.Users.FindAsync(userId);

            if (user == null)
            {
                return NotFound(new { message = $"User with id {userId} was not found." });
            }

            var currentUserClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var isAdminOrLeader =
                User.IsInRole(UserRole.Admin.ToString()) ||
                User.IsInRole(UserRole.TeamLeader.ToString());

            if (!isAdminOrLeader && currentUserClaim != userId.ToString())
                return Forbid();

            var tasks = await _context.Tasks
                .Where(t => t.AssignedMemberId == userId)
                .Select(taskItem => new TaskResponseDto
                {
                    Id = taskItem.Id,
                    Title = taskItem.Title,
                    Description = taskItem.Description,
                    AssignedMemberId = taskItem.AssignedMemberId,
                    CreatedById = taskItem.CreatedById,
                    Priority = taskItem.Priority,
                    Complexity = taskItem.Complexity,
                    EstimatedEffortHours = taskItem.EstimatedEffortHours,
                    StartDate = taskItem.StartDate,
                    DueDate = taskItem.DueDate,
                    Status = taskItem.Status,
                    Weight = taskItem.Weight,
                    IsAcknowledged = taskItem.IsAcknowledged,
                    AcknowledgedAt = taskItem.AcknowledgedAt,
                    CreatedAt = taskItem.CreatedAt,
                    UpdatedAt = taskItem.UpdatedAt
                })
                .ToListAsync();

            return Ok(tasks);
        }

        [Authorize]
        [HttpPatch("{id}/status")]
        public async Task<ActionResult<TaskResponseDto>> UpdateTaskStatus(int id, UpdateTaskStatusDto dto)
        {
            var taskItem = await _context.Tasks.FindAsync(id);

            if (taskItem == null)
                return NotFound(new { message = $"Task with id {id} was not found." });

            var currentUserClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrWhiteSpace(currentUserClaim))
                return Unauthorized("User id not found in token.");

            int currentUserId = int.Parse(currentUserClaim);

            var isAdminOrLeader =
                User.IsInRole(UserRole.Admin.ToString()) ||
                User.IsInRole(UserRole.TeamLeader.ToString());

            if (!isAdminOrLeader && taskItem.AssignedMemberId != currentUserId)
                return Forbid();

            if (taskItem.Status == dto.Status)
                return BadRequest(new { message = "Task already has this status." });

            var oldStatus = taskItem.Status;

            taskItem.Status = dto.Status;
            taskItem.UpdatedAt = DateTime.UtcNow;

            var history = new TaskStatusHistory
            {
                TaskId = taskItem.Id,
                OldStatus = oldStatus,
                NewStatus = dto.Status,
                ChangedById = currentUserId,
                ChangedAt = DateTime.UtcNow
            };

            _context.TaskStatusHistories.Add(history);
            await _context.SaveChangesAsync();

            var response = new TaskResponseDto
            {
                Id = taskItem.Id,
                Title = taskItem.Title,
                Description = taskItem.Description,
                AssignedMemberId = taskItem.AssignedMemberId,
                CreatedById = taskItem.CreatedById,
                Priority = taskItem.Priority,
                Complexity = taskItem.Complexity,
                EstimatedEffortHours = taskItem.EstimatedEffortHours,
                StartDate = taskItem.StartDate,
                DueDate = taskItem.DueDate,
                Status = taskItem.Status,
                Weight = taskItem.Weight,
                IsAcknowledged = taskItem.IsAcknowledged,
                AcknowledgedAt = taskItem.AcknowledgedAt,
                CreatedAt = taskItem.CreatedAt,
                UpdatedAt = taskItem.UpdatedAt
            };

            return Ok(response);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<TaskResponseDto>> GetTaskById(int id)
        {
            var taskItem = await _context.Tasks.FindAsync(id);

            if (taskItem == null)
            {
                return NotFound();
            }

            var currentUserClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var isAdminOrLeader =
                User.IsInRole(UserRole.Admin.ToString()) ||
                User.IsInRole(UserRole.TeamLeader.ToString());

            if (!isAdminOrLeader && currentUserClaim != taskItem.AssignedMemberId.ToString())
                return Forbid();

            var response = new TaskResponseDto
            {
                Id = taskItem.Id,
                Title = taskItem.Title,
                Description = taskItem.Description,
                AssignedMemberId = taskItem.AssignedMemberId,
                CreatedById = taskItem.CreatedById,
                Priority = taskItem.Priority,
                Complexity = taskItem.Complexity,
                EstimatedEffortHours = taskItem.EstimatedEffortHours,
                StartDate = taskItem.StartDate,
                DueDate = taskItem.DueDate,
                Status = taskItem.Status,
                Weight = taskItem.Weight,
                IsAcknowledged = taskItem.IsAcknowledged,
                AcknowledgedAt = taskItem.AcknowledgedAt,
                CreatedAt = taskItem.CreatedAt,
                UpdatedAt = taskItem.UpdatedAt
            };

            return Ok(response);
        }

        [Authorize]
        [HttpGet]
        public async Task<ActionResult<IEnumerable<TaskResponseDto>>> GetAllTasks()
        {
            var isAdminOrLeader =
                User.IsInRole(UserRole.Admin.ToString()) ||
                User.IsInRole(UserRole.TeamLeader.ToString());

            IQueryable<TaskItem> query = _context.Tasks;

            if (!isAdminOrLeader)
            {
                var currentUserClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrWhiteSpace(currentUserClaim))
                    return Unauthorized("User id not found in token.");

                int currentUserId = int.Parse(currentUserClaim);
                query = query.Where(t => t.AssignedMemberId == currentUserId);
            }

            var tasks = await query
                .Select(taskItem => new TaskResponseDto
                {
                    Id = taskItem.Id,
                    Title = taskItem.Title,
                    Description = taskItem.Description,
                    AssignedMemberId = taskItem.AssignedMemberId,
                    CreatedById = taskItem.CreatedById,
                    Priority = taskItem.Priority,
                    Complexity = taskItem.Complexity,
                    EstimatedEffortHours = taskItem.EstimatedEffortHours,
                    StartDate = taskItem.StartDate,
                    DueDate = taskItem.DueDate,
                    Status = taskItem.Status,
                    Weight = taskItem.Weight,
                    IsAcknowledged = taskItem.IsAcknowledged,
                    AcknowledgedAt = taskItem.AcknowledgedAt,
                    CreatedAt = taskItem.CreatedAt,
                    UpdatedAt = taskItem.UpdatedAt
                })
                .ToListAsync();

            return Ok(tasks);
        }

        [Authorize]
        [HttpGet("{id}/details")]
        public async Task<IActionResult> GetTaskDetails(int id)
        {
            var task = await _context.Tasks
                .Include(t => t.AssignedMember)
                .Include(t => t.CreatedBy)
                .Include(t => t.StatusHistories)
                    .ThenInclude(h => h.ChangedBy)
                .Include(t => t.ChangeRequests)
                    .ThenInclude(c => c.RequestedBy)
                .Include(t => t.ChangeRequests)
                    .ThenInclude(c => c.CurrentAssignedMember)
                .Include(t => t.ChangeRequests)
                    .ThenInclude(c => c.NewAssignedMember)
                .Include(t => t.ChangeRequests)
                    .ThenInclude(c => c.ReviewedBy)
                .FirstOrDefaultAsync(t => t.Id == id);

            if (task == null)
                return NotFound("Task not found");

            var currentUserClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var isAdminOrLeader =
                User.IsInRole(UserRole.Admin.ToString()) ||
                User.IsInRole(UserRole.TeamLeader.ToString());

            if (!isAdminOrLeader && currentUserClaim != task.AssignedMemberId.ToString())
                return Forbid();

            TaskUserDto? MapUser(User? user)
            {
                if (user == null) return null;

                return new TaskUserDto
                {
                    Id = user.Id,
                    FullName = user.FullName,
                    Email = user.Email
                };
            }

            double priorityMultiplier = task.Priority switch
            {
                TaskPriority.Low => 1.0,
                TaskPriority.Medium => 1.2,
                TaskPriority.High => 1.5,
                TaskPriority.Critical => 2.0,
                _ => 1.0
            };

            double complexityMultiplier = task.Complexity switch
            {
                TaskComplexity.Simple => 1.0,
                TaskComplexity.Medium => 1.5,
                TaskComplexity.Complex => 2.0,
                _ => 1.0
            };

            var result = new TaskDetailsDto
            {
                Id = task.Id,
                Title = task.Title,
                Description = task.Description ?? string.Empty,
                Priority = (int)task.Priority,
                Complexity = (int)task.Complexity,
                EstimatedEffortHours = task.EstimatedEffortHours,
                StartDate = task.StartDate,
                DueDate = task.DueDate,
                Status = (int)task.Status,
                Weight = task.Weight,
                IsAcknowledged = task.IsAcknowledged,
                AcknowledgedAt = task.AcknowledgedAt,
                CreatedAt = task.CreatedAt,
                UpdatedAt = task.UpdatedAt,
                AssignedMember = MapUser(task.AssignedMember),
                CreatedBy = MapUser(task.CreatedBy),
                WeightBreakdown = new TaskWeightBreakdownDto
                {
                    EstimatedEffortHours = task.EstimatedEffortHours,
                    PriorityMultiplier = priorityMultiplier,
                    ComplexityMultiplier = complexityMultiplier,
                    CalculatedWeight = task.EstimatedEffortHours * priorityMultiplier * complexityMultiplier
                },
                StatusHistory = task.StatusHistories
                    .OrderByDescending(h => h.ChangedAt)
                    .Select(h => new TaskStatusHistoryDto
                    {
                        Id = h.Id,
                        OldStatus = (int)h.OldStatus,
                        NewStatus = (int)h.NewStatus,
                        ChangedAt = h.ChangedAt,
                        ChangedBy = MapUser(h.ChangedBy)
                    })
                    .ToList(),
                ChangeHistory = task.ChangeRequests
                    .OrderByDescending(c => c.CreatedAt)
                    .Select(c => new TaskChangeHistoryDto
                    {
                        Id = c.Id,
                        RequestedBy = MapUser(c.RequestedBy),
                        CurrentAssignedMember = MapUser(c.CurrentAssignedMember),
                        NewAssignedMember = MapUser(c.NewAssignedMember),
                        CurrentDueDate = c.CurrentDueDate,
                        NewDueDate = c.NewDueDate,
                        CurrentEstimatedEffortHours = c.CurrentEstimatedEffortHours,
                        NewEstimatedEffortHours = c.NewEstimatedEffortHours,
                        Reason = c.Reason,
                        Status = c.Status.ToString(),
                        CreatedAt = c.CreatedAt,
                        ReviewedAt = c.ReviewedAt,
                        ReviewedBy = MapUser(c.ReviewedBy)
                    })
                    .ToList()
            };

            return Ok(result);
        }

        [Authorize]
        [HttpGet("test-auth")]
        public IActionResult TestAuth()
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var email = User.FindFirst(ClaimTypes.Email)?.Value;
            var role = User.FindFirst(ClaimTypes.Role)?.Value;

            return Ok(new
            {
                message = "Token is valid",
                userId,
                email,
                role
            });
        }
    }
}