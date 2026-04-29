using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using TeamWorkload.API.Data;
using TeamWorkload.API.Dtos.ChangeRequests;
using TeamWorkload.API.Enums;
using TeamWorkload.API.Models;
using TeamWorkload.API.Services.Interfaces;

namespace TeamWorkload.API.Controllers
{
    [Authorize]
    [Route("api/change-requests")]
    [ApiController]
    public class ChangeRequestsController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly ITaskWeightService _taskWeightService;

        public ChangeRequestsController(AppDbContext context, ITaskWeightService taskWeightService)
        {
            _context = context;
            _taskWeightService = taskWeightService;
        }

        [HttpPost("/api/tasks/{taskId}/change-request")]
        public async Task<IActionResult> CreateTaskChangeRequest(
            int taskId,
            [FromBody] CreateTaskChangeRequestDto dto)
        {
            var task = await _context.Tasks
                .FirstOrDefaultAsync(t => t.Id == taskId);

            if (task == null)
                return NotFound("Task not found.");

            var requestedByClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrWhiteSpace(requestedByClaim))
                return Unauthorized("User id not found in token.");

            int requestedById = int.Parse(requestedByClaim);

            var requester = await _context.Users.FindAsync(requestedById);
            if (requester == null)
                return Unauthorized("Requesting user not found.");

            if (requester.Role == UserRole.Member && task.AssignedMemberId != requestedById)
                return Forbid();

            if (dto.NewAssignedMemberId == null &&
                dto.NewDueDate == null &&
                dto.NewEstimatedEffortHours == null)
            {
                return BadRequest("At least one change must be requested.");
            }

            bool ownerChanged = dto.NewAssignedMemberId.HasValue &&
                                dto.NewAssignedMemberId.Value != task.AssignedMemberId;

            bool dueDateChanged = dto.NewDueDate.HasValue &&
                                  dto.NewDueDate.Value != task.DueDate;

            bool effortIncreased = dto.NewEstimatedEffortHours.HasValue &&
                                   dto.NewEstimatedEffortHours.Value > task.EstimatedEffortHours;

            if (!ownerChanged && !dueDateChanged && !effortIncreased)
            {
                return BadRequest("Only owner change, due date change, or increased effort require approval.");
            }

            if (dto.NewAssignedMemberId.HasValue)
            {
                var newMemberExists = await _context.Users
                    .AnyAsync(u => u.Id == dto.NewAssignedMemberId.Value);

                if (!newMemberExists)
                    return BadRequest("New assigned member not found.");
            }

            if (dto.NewEstimatedEffortHours.HasValue && dto.NewEstimatedEffortHours.Value <= 0)
            {
                return BadRequest("New estimated effort hours must be greater than zero.");
            }

            var changeRequest = new TaskChangeRequest
            {
                TaskId = task.Id,
                RequestedById = requestedById,
                CurrentAssignedMemberId = task.AssignedMemberId,
                NewAssignedMemberId = dto.NewAssignedMemberId,
                CurrentDueDate = task.DueDate,
                NewDueDate = dto.NewDueDate,
                CurrentEstimatedEffortHours = task.EstimatedEffortHours,
                NewEstimatedEffortHours = dto.NewEstimatedEffortHours,
                Reason = dto.Reason,
                Status = ChangeRequestStatus.Pending,
                CreatedAt = DateTime.UtcNow
            };

            _context.TaskChangeRequests.Add(changeRequest);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Change request created successfully.",
                changeRequestId = changeRequest.Id,
                status = changeRequest.Status.ToString()
            });
        }

        [Authorize(Roles = "Admin,TeamLeader")]
        [HttpGet("pending")]
        public async Task<IActionResult> GetPendingChangeRequests()
        {
            var requests = await _context.TaskChangeRequests
                .Include(r => r.Task)
                .Include(r => r.RequestedBy)
                .Where(r => r.Status == ChangeRequestStatus.Pending)
                .OrderByDescending(r => r.CreatedAt)
                .Select(r => new PendingChangeRequestDto
                {
                    Id = r.Id,
                    TaskId = r.TaskId,
                    TaskTitle = r.Task.Title,
                    RequestedById = r.RequestedById,
                    RequestedByName = r.RequestedBy.FullName,
                    CurrentAssignedMemberId = r.CurrentAssignedMemberId,
                    NewAssignedMemberId = r.NewAssignedMemberId,
                    CurrentDueDate = r.CurrentDueDate,
                    NewDueDate = r.NewDueDate,
                    CurrentEstimatedEffortHours = r.CurrentEstimatedEffortHours,
                    NewEstimatedEffortHours = r.NewEstimatedEffortHours,
                    Reason = r.Reason,
                    Status = r.Status.ToString(),
                    CreatedAt = r.CreatedAt
                })
                .ToListAsync();

            return Ok(requests);
        }

        [Authorize(Roles = "Admin,TeamLeader")]
        [HttpPatch("{id}/approve")]
        public async Task<IActionResult> ApproveChangeRequest(int id)
        {
            var changeRequest = await _context.TaskChangeRequests
                .Include(r => r.Task)
                .FirstOrDefaultAsync(r => r.Id == id);

            if (changeRequest == null)
                return NotFound("Change request not found.");

            if (changeRequest.Status != ChangeRequestStatus.Pending)
                return BadRequest("Only pending requests can be approved.");

            var reviewerClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrWhiteSpace(reviewerClaim))
                return Unauthorized("Reviewer id not found in token.");

            int reviewerId = int.Parse(reviewerClaim);

            var task = changeRequest.Task;
            if (task == null)
                return NotFound("Related task not found.");

            if (changeRequest.NewAssignedMemberId.HasValue &&
                changeRequest.NewAssignedMemberId.Value != task.AssignedMemberId)
            {
                var newAssignedUser = await _context.Users
                    .FirstOrDefaultAsync(u => u.Id == changeRequest.NewAssignedMemberId.Value);

                if (newAssignedUser == null)
                    return BadRequest("New assigned member not found.");

                task.AssignedMemberId = changeRequest.NewAssignedMemberId.Value;
                task.IsAcknowledged = false;
                task.AcknowledgedAt = null;
            }

            if (changeRequest.NewDueDate.HasValue)
            {
                task.DueDate = changeRequest.NewDueDate.Value;
            }

            if (changeRequest.NewEstimatedEffortHours.HasValue)
            {
                task.EstimatedEffortHours = changeRequest.NewEstimatedEffortHours.Value;
            }

            task.Weight = _taskWeightService.CalculateWeight(
                task.Priority,
                task.Complexity,
                task.EstimatedEffortHours
            );

            task.UpdatedAt = DateTime.UtcNow;

            changeRequest.Status = ChangeRequestStatus.Approved;
            changeRequest.ReviewedAt = DateTime.UtcNow;
            changeRequest.ReviewedById = reviewerId;

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Change request approved successfully.",
                changeRequestId = changeRequest.Id,
                status = changeRequest.Status.ToString(),
                reviewedById = reviewerId,
                reviewedAt = changeRequest.ReviewedAt,
                taskId = task.Id,
                newAssignedMemberId = task.AssignedMemberId,
                newDueDate = task.DueDate,
                newEstimatedEffortHours = task.EstimatedEffortHours,
                newWeight = task.Weight,
                isAcknowledged = task.IsAcknowledged,
                acknowledgedAt = task.AcknowledgedAt
            });
        }

        [Authorize(Roles = "Admin,TeamLeader")]
        [HttpPatch("{id}/reject")]
        public async Task<IActionResult> RejectChangeRequest(int id)
        {
            var changeRequest = await _context.TaskChangeRequests
                .FirstOrDefaultAsync(r => r.Id == id);

            if (changeRequest == null)
                return NotFound("Change request not found.");

            if (changeRequest.Status != ChangeRequestStatus.Pending)
                return BadRequest("Only pending requests can be rejected.");

            var reviewerClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrWhiteSpace(reviewerClaim))
                return Unauthorized("Reviewer id not found in token.");

            int reviewerId = int.Parse(reviewerClaim);

            changeRequest.Status = ChangeRequestStatus.Rejected;
            changeRequest.ReviewedAt = DateTime.UtcNow;
            changeRequest.ReviewedById = reviewerId;

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Change request rejected successfully.",
                changeRequestId = changeRequest.Id,
                status = changeRequest.Status.ToString(),
                reviewedById = reviewerId
            });
        }
    }
}