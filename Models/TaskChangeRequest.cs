using TeamWorkload.API.Enums;

namespace TeamWorkload.API.Models
{
    public class TaskChangeRequest
    {
        public int Id { get; set; }

        public int TaskId { get; set; }
        public TaskItem Task { get; set; } = null!;

        public int RequestedById { get; set; }
        public User RequestedBy { get; set; } = null!;

        public int? CurrentAssignedMemberId { get; set; }
        public User? CurrentAssignedMember { get; set; }

        public int? NewAssignedMemberId { get; set; }
        public User? NewAssignedMember { get; set; }

        public DateTime CurrentDueDate { get; set; }
        public DateTime? NewDueDate { get; set; }

        public int CurrentEstimatedEffortHours { get; set; }
        public int? NewEstimatedEffortHours { get; set; }

        public string? Reason { get; set; }

        public ChangeRequestStatus Status { get; set; } = ChangeRequestStatus.Pending;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? ReviewedAt { get; set; }

        public int? ReviewedById { get; set; }
        public User? ReviewedBy { get; set; }
    }
}