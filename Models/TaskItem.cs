using System.ComponentModel.DataAnnotations.Schema;
using TeamWorkload.API.Enums;

namespace TeamWorkload.API.Models
{
    [Table("Tasks")]
    public class TaskItem
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

        public WorkTaskStatus Status { get; set; } = WorkTaskStatus.New;
        public double Weight { get; set; }

        public bool IsAcknowledged { get; set; } = false;
        public DateTime? AcknowledgedAt { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }

        public User? AssignedMember { get; set; }
        public User? CreatedBy { get; set; }

        public ICollection<TaskStatusHistory> StatusHistories { get; set; } = new List<TaskStatusHistory>();
        public ICollection<TaskChangeRequest> ChangeRequests { get; set; } = new List<TaskChangeRequest>();
    }
}