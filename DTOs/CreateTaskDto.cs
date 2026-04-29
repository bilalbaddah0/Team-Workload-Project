using TeamWorkload.API.Enums;

namespace TeamWorkload.API.DTOs
{
    public class CreateTaskDto
    {
        public string Title { get; set; } = string.Empty;
        public string? Description { get; set; }

        public int AssignedMemberId { get; set; }

        public TaskPriority Priority { get; set; }
        public TaskComplexity Complexity { get; set; }
        public int EstimatedEffortHours { get; set; }

        public DateTime StartDate { get; set; }
        public DateTime DueDate { get; set; }
    }
}