namespace TeamWorkload.API.Dtos.Tasks
{
    public class TaskUserDto
    {
        public int Id { get; set; }
        public string FullName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
    }

    public class TaskWeightBreakdownDto
    {
        public int EstimatedEffortHours { get; set; }
        public double ComplexityMultiplier { get; set; }
        public double PriorityMultiplier { get; set; }
        public double CalculatedWeight { get; set; }
    }

    public class TaskStatusHistoryDto
    {
        public int Id { get; set; }
        public int OldStatus { get; set; }
        public int NewStatus { get; set; }
        public DateTime ChangedAt { get; set; }
        public TaskUserDto? ChangedBy { get; set; }
    }

    public class TaskChangeHistoryDto
    {
        public int Id { get; set; }
        public TaskUserDto? RequestedBy { get; set; }
        public TaskUserDto? CurrentAssignedMember { get; set; }
        public TaskUserDto? NewAssignedMember { get; set; }
        public DateTime CurrentDueDate { get; set; }
        public DateTime? NewDueDate { get; set; }
        public int CurrentEstimatedEffortHours { get; set; }
        public int? NewEstimatedEffortHours { get; set; }
        public string? Reason { get; set; }
        public string Status { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public DateTime? ReviewedAt { get; set; }
        public TaskUserDto? ReviewedBy { get; set; }
    }

    public class TaskDetailsDto
    {
        public int Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;

        public int Priority { get; set; }
        public int Complexity { get; set; }
        public int EstimatedEffortHours { get; set; }

        public DateTime StartDate { get; set; }
        public DateTime DueDate { get; set; }

        public int Status { get; set; }
        public double Weight { get; set; }

        public bool IsAcknowledged { get; set; }
        public DateTime? AcknowledgedAt { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }

        public TaskUserDto? AssignedMember { get; set; }
        public TaskUserDto? CreatedBy { get; set; }

        public TaskWeightBreakdownDto WeightBreakdown { get; set; } = new();

        public List<TaskStatusHistoryDto> StatusHistory { get; set; } = new();
        public List<TaskChangeHistoryDto> ChangeHistory { get; set; } = new();
    }
}