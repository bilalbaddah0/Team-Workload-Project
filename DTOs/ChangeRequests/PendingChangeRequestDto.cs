


namespace TeamWorkload.API.Dtos.ChangeRequests
{
    public class PendingChangeRequestDto
    {
        public int Id { get; set; }

        public int TaskId { get; set; }
        public string TaskTitle { get; set; } = string.Empty;

        public int RequestedById { get; set; }
        public string RequestedByName { get; set; } = string.Empty;

        public int? CurrentAssignedMemberId { get; set; }
        public int? NewAssignedMemberId { get; set; }

        public DateTime CurrentDueDate { get; set; }
        public DateTime? NewDueDate { get; set; }

        public int CurrentEstimatedEffortHours { get; set; }
        public int? NewEstimatedEffortHours { get; set; }

        public string? Reason { get; set; }
        public string Status { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
    }
}