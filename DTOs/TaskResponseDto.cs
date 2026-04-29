using TeamWorkload.API.Enums;

namespace TeamWorkload.API.DTOs
{
    public class TaskResponseDto
    {
        public int Id { get; set; }

        public string Title { get; set; } = string.Empty;
        public string? Description { get; set; }

        public int AssignedMemberId { get; set; }
        public int CreatedById { get; set; }

        public TaskPriority Priority { get; set; }
        public TaskComplexity Complexity { get; set; }
        public int EstimatedEffortHours { get; set; }

        public DateTime StartDate { get; set; }
        public DateTime DueDate { get; set; }

        public WorkTaskStatus Status { get; set; }
        public double Weight { get; set; }

        public bool IsAcknowledged { get; set; }
        public DateTime? AcknowledgedAt { get; set; }

        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
    }
}