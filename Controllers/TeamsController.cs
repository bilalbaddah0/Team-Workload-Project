using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TeamWorkload.API.Data;
using TeamWorkload.API.Dtos.Teams;
using TeamWorkload.API.DTOs;

namespace TeamWorkload.API.Controllers
{
    [Route("api/[controller]")]
    [Authorize]
    [ApiController]
    public class TeamsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public TeamsController(AppDbContext context)
        {
            _context = context;
        }

        [Authorize(Roles = "Admin")]
        [HttpPost]
        public async Task<ActionResult<TeamResponseDto>> CreateTeam(CreateTeamDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Name))
                return BadRequest("Team name is required.");

            bool exists = await _context.Teams.AnyAsync(t => t.Name == dto.Name);
            if (exists)
                return BadRequest("Team name already exists.");

            var team = new TeamWorkload.API.Models.Team
            {
                Name = dto.Name,
                Description = dto.Description,
                CreatedAt = DateTime.UtcNow
            };

            _context.Teams.Add(team);
            await _context.SaveChangesAsync();

            var response = new TeamResponseDto
            {
                Id = team.Id,
                Name = team.Name,
                Description = team.Description,
                CreatedAt = team.CreatedAt
            };

            return CreatedAtAction(nameof(GetTeamById), new { id = team.Id }, response);
        }

        [Authorize(Roles = "Admin")]
        [HttpGet]
        public async Task<ActionResult<IEnumerable<TeamResponseDto>>> GetAllTeams()
        {
            var teams = await _context.Teams
                .Select(team => new TeamResponseDto
                {
                    Id = team.Id,
                    Name = team.Name,
                    Description = team.Description,
                    CreatedAt = team.CreatedAt
                })
                .ToListAsync();

            return Ok(teams);
        }

        [Authorize(Roles = "Admin")]
        [HttpGet("{id}")]
        public async Task<ActionResult<TeamResponseDto>> GetTeamById(int id)
        {
            var team = await _context.Teams.FindAsync(id);

            if (team == null)
                return NotFound("Team not found.");

            var response = new TeamResponseDto
            {
                Id = team.Id,
                Name = team.Name,
                Description = team.Description,
                CreatedAt = team.CreatedAt
            };

            return Ok(response);
        }

        [Authorize(Roles = "Admin")]
        [HttpPut("{id}")]
        public async Task<ActionResult<TeamResponseDto>> UpdateTeam(int id, UpdateTeamDto dto)
        {
            var team = await _context.Teams.FindAsync(id);

            if (team == null)
                return NotFound("Team not found.");

            if (string.IsNullOrWhiteSpace(dto.Name))
                return BadRequest("Team name is required.");

            bool exists = await _context.Teams.AnyAsync(t => t.Name == dto.Name && t.Id != id);
            if (exists)
                return BadRequest("Another team already uses this name.");

            team.Name = dto.Name;
            team.Description = dto.Description;

            await _context.SaveChangesAsync();

            var response = new TeamResponseDto
            {
                Id = team.Id,
                Name = team.Name,
                Description = team.Description,
                CreatedAt = team.CreatedAt
            };

            return Ok(response);
        }

        [Authorize(Roles = "Admin")]
        [HttpDelete("{id}")]
        public async Task<ActionResult> DeleteTeam(int id)
        {
            var team = await _context.Teams
                .Include(t => t.Users)
                .FirstOrDefaultAsync(t => t.Id == id);

            if (team == null)
                return NotFound("Team not found.");

            if (team.Users.Any())
                return BadRequest("Cannot delete team with users assigned.");

            _context.Teams.Remove(team);
            await _context.SaveChangesAsync();

            return Ok("Team deleted successfully.");
        }


        [Authorize(Roles = "Admin,TeamLeader")]
        [HttpGet("{teamId}/workload")]
        public async Task<IActionResult> GetTeamWorkload(
            int teamId,
            DateTime? startDate,
            DateTime? endDate)
        {
            var team = await _context.Teams.FindAsync(teamId);

            if (team == null)
                return NotFound("Team not found.");

            var today = DateTime.UtcNow.Date;
            int diff = (7 + (today.DayOfWeek - DayOfWeek.Monday)) % 7;
            DateTime start = startDate?.Date ?? today.AddDays(-diff);
            DateTime end = endDate?.Date ?? start.AddDays(6);

            var members = await _context.Users
                .Where(u => u.TeamId == teamId)
                .ToListAsync();

            var memberIds = members.Select(m => m.Id).ToList();

            var tasks = await _context.Tasks
                .Where(t =>
                    memberIds.Contains(t.AssignedMemberId) &&
                    t.StartDate <= end &&
                    t.DueDate >= start)
                .ToListAsync();

            var memberWorkloads = members.Select(member =>
            {
                var memberTasks = tasks
                    .Where(t => t.AssignedMemberId == member.Id)
                    .ToList();

                var totalWeight = memberTasks.Sum(t => t.Weight);

                string status = totalWeight switch
                {
                    <= 15 => "Available",
                    <= 25 => "Moderate",
                    _ => "Overloaded"
                };

                return new TeamMemberWorkloadDto
                {
                    UserId = member.Id,
                    Name = member.FullName,
                    TaskCount = memberTasks.Count,
                    TotalEffortHours = memberTasks.Sum(t => t.EstimatedEffortHours),
                    TotalWeight = totalWeight,
                    Status = status
                };
            }).ToList();

            var result = new TeamWorkloadDto
            {
                TeamId = team.Id,
                TeamName = team.Name,
                StartDate = start,
                EndDate = end,
                TotalTasks = tasks.Count,
                TotalEffortHours = tasks.Sum(t => t.EstimatedEffortHours),
                TotalWeight = tasks.Sum(t => t.Weight),
                Members = memberWorkloads
            };

            return Ok(result);
        }

        [Authorize(Roles = "Admin")]
        [HttpGet("{id}/details")]
        public async Task<IActionResult> GetTeamDetails(int id)
        {
            var team = await _context.Teams
                .FirstOrDefaultAsync(t => t.Id == id);

            if (team == null)
                return NotFound("Team not found");

            var members = await _context.Users
                .Where(u => u.TeamId == id)
                .Select(u => new TeamMemberDto
                {
                    Id = u.Id,
                    FullName = u.FullName,
                    Email = u.Email,
                    Role = (int)u.Role,
                    IsActive = u.IsActive
                })
                .ToListAsync();

            var result = new TeamDetailsDto
            {
                Id = team.Id,
                Name = team.Name,
                CreatedAt = team.CreatedAt,
                Members = members
            };

            return Ok(result);
        }
    }
}