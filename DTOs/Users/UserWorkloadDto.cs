namespace TeamWorkload.API.Dtos.Users
{
    public class UserTaskSummaryDto
    {
        public int Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public int EstimatedEffortHours { get; set; }
        public double Weight { get; set; }
        public int Priority { get; set; }
        public int Complexity { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime DueDate { get; set; }
        public int Status { get; set; }
        public bool IsAcknowledged { get; set; }
    }

    public class UserWorkloadDto
    {
        public int UserId { get; set; }
        public string FullName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;

        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }

        public int TotalTasks { get; set; }
        public int TotalEffortHours { get; set; }
        public double TotalWeight { get; set; }
        public string WorkloadStatus { get; set; } = string.Empty;

        public List<UserTaskSummaryDto> Tasks { get; set; } = new();
    }
}