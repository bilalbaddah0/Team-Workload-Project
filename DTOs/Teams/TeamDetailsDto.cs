namespace TeamWorkload.API.Dtos.Teams
{
    public class TeamMemberDto
    {
        public int Id { get; set; }
        public string FullName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public int Role { get; set; }
        public bool IsActive { get; set; }
    }

    public class TeamDetailsDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public List<TeamMemberDto> Members { get; set; } = new();
    }
}