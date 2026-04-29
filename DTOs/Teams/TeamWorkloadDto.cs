namespace TeamWorkload.API.Dtos.Teams
{
    public class TeamMemberWorkloadDto
    {
        public int UserId { get; set; }
        public string Name { get; set; } = string.Empty;

        public int TaskCount { get; set; }
        public int TotalEffortHours { get; set; }
        public double TotalWeight { get; set; }

        public string Status { get; set; } = string.Empty; // Green / Yellow / Red
    }

    public class TeamWorkloadDto
    {
        public int TeamId { get; set; }
        public string TeamName { get; set; } = string.Empty;

        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }

        public int TotalTasks { get; set; }
        public int TotalEffortHours { get; set; }
        public double TotalWeight { get; set; }

        public List<TeamMemberWorkloadDto> Members { get; set; } = new();
    }
}