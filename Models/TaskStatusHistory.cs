using TeamWorkload.API.Enums;

namespace TeamWorkload.API.Models
{
    public class TaskStatusHistory
    {
        public int Id { get; set; }

        public int TaskId { get; set; }
        public TaskItem Task { get; set; } = null!;

        public WorkTaskStatus OldStatus { get; set; }
        public WorkTaskStatus NewStatus { get; set; }

        public int ChangedById { get; set; }
        public User ChangedBy { get; set; } = null!;

        public DateTime ChangedAt { get; set; } = DateTime.UtcNow;
    }
}