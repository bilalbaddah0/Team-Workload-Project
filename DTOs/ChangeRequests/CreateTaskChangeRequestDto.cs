namespace TeamWorkload.API.Dtos.ChangeRequests
{
    public class CreateTaskChangeRequestDto
    {
        public int? NewAssignedMemberId { get; set; }
        public DateTime? NewDueDate { get; set; }
        public int? NewEstimatedEffortHours { get; set; }
        public string? Reason { get; set; }
    }
}