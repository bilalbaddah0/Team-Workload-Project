using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using TeamWorkload.API.Data;
using TeamWorkload.API.Dtos.Users;
using TeamWorkload.API.DTOs;
using TeamWorkload.API.Enums;
using TeamWorkload.API.Extensions;
using TeamWorkload.API.Models;

namespace TeamWorkload.API.Controllers
{
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class UsersController : ControllerBase
    {
        private readonly AppDbContext _context;
            
        public UsersController(AppDbContext context)
        {
            _context = context;
        }

        [Authorize(Roles = "Admin")]
        [HttpPost]
        public async Task<ActionResult<UserResponseDto>> CreateUser(CreateUserDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.FullName))
                return BadRequest("Full name is required.");

            if (string.IsNullOrWhiteSpace(dto.Email))
                return BadRequest("Email is required.");

            if (string.IsNullOrWhiteSpace(dto.Password))
                return BadRequest("Password is required.");

            bool emailExists = await _context.Users.AnyAsync(u => u.Email == dto.Email);
            if (emailExists)
                return BadRequest("Email already exists.");

            if (dto.TeamId.HasValue)
            {
                var teamExists = await _context.Teams.AnyAsync(t => t.Id == dto.TeamId.Value);
                if (!teamExists)
                    return BadRequest("Team not found.");
            }

            var user = new User
            {
                FullName = dto.FullName,
                Email = dto.Email,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
                Role = dto.Role,
                TeamId = dto.TeamId,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            var response = new UserResponseDto
            {
                Id = user.Id,
                FullName = user.FullName,
                Email = user.Email,
                Role = user.Role,
                TeamId = user.TeamId,
                IsActive = user.IsActive,
                CreatedAt = user.CreatedAt
            };

            return CreatedAtAction(nameof(GetUserById), new { id = user.Id }, response);
        }

        [Authorize(Roles = "Admin,TeamLeader,Member")]
        [HttpGet]
        public async Task<ActionResult<IEnumerable<UserResponseDto>>> GetAllUsers()
        {
            var users = await _context.Users
                .Select(user => new UserResponseDto
                {
                    Id = user.Id,
                    FullName = user.FullName,
                    Email = user.Email,
                    Role = user.Role,
                    TeamId = user.TeamId,
                    IsActive = user.IsActive,
                    CreatedAt = user.CreatedAt
                })
                .ToListAsync();

            return Ok(users);
        }

        [Authorize(Roles = "Admin,TeamLeader")]
        [HttpGet("{id}")]
        public async Task<ActionResult<UserResponseDto>> GetUserById(int id)
        {
            var user = await _context.Users.FindAsync(id);

            if (user == null)
                return NotFound("User not found.");

            var response = new UserResponseDto
            {
                Id = user.Id,
                FullName = user.FullName,
                Email = user.Email,
                Role = user.Role,
                TeamId = user.TeamId,
                IsActive = user.IsActive,
                CreatedAt = user.CreatedAt
            };

            return Ok(response);
        }

        [Authorize(Roles = "Admin")]
        [HttpPut("{id}")]
        public async Task<ActionResult<UserResponseDto>> UpdateUser(int id, UpdateUserDto dto)
        {
            var user = await _context.Users.FindAsync(id);

            if (user == null)
                return NotFound("User not found.");

            if (string.IsNullOrWhiteSpace(dto.FullName))
                return BadRequest("Full name is required.");

            if (string.IsNullOrWhiteSpace(dto.Email))
                return BadRequest("Email is required.");


            bool emailExists = await _context.Users.AnyAsync(u => u.Email == dto.Email && u.Id != id);
            if (emailExists)
                return BadRequest("Another user already uses this email.");

            if (dto.TeamId.HasValue)
            {
                var teamExists = await _context.Teams.AnyAsync(t => t.Id == dto.TeamId.Value);
                if (!teamExists)
                    return BadRequest("Team not found.");
            }

            user.FullName = dto.FullName;
            user.Email = dto.Email;
            if (!string.IsNullOrWhiteSpace(dto.Password))
            {
                user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password);
            }
            user.Role = dto.Role;
            user.TeamId = dto.TeamId;
            user.IsActive = dto.IsActive;

            await _context.SaveChangesAsync();

            var response = new UserResponseDto
            {
                Id = user.Id,
                FullName = user.FullName,
                Email = user.Email,
                Role = user.Role,
                TeamId = user.TeamId,
                IsActive = user.IsActive,
                CreatedAt = user.CreatedAt
            };

            return Ok(response);
        }
        [Authorize(Roles = "Admin")]
        [HttpDelete("{id}")][Authorize(Roles = "Admin")]
        public async Task<ActionResult> DeleteUser(int id)
        {
            var user = await _context.Users.FindAsync(id);

            if (user == null)
                return NotFound("User not found.");

            var hasAssignedTasks = await _context.Tasks
                .AnyAsync(t => t.AssignedMemberId == id);

            var hasCreatedTasks = await _context.Tasks
                .AnyAsync(t => t.CreatedById == id);

            if (hasAssignedTasks || hasCreatedTasks)
            {
                user.IsActive = false;
                await _context.SaveChangesAsync();

                return Ok("User has task history, so they were deactivated instead of deleted.");
            }

            _context.Users.Remove(user);
            await _context.SaveChangesAsync();

            return Ok("User deleted successfully.");
        }

        [Authorize(Roles = "Admin,TeamLeader,Member")]
        [HttpGet("{id}/workload")]
        public async Task<IActionResult> GetUserWorkload(int id, DateTime? startDate, DateTime? endDate)
        {
            var currentUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var isAdminOrLeader =
                User.IsInRole(UserRole.Admin.ToString()) ||
                User.IsInRole(UserRole.TeamLeader.ToString());

            if (!isAdminOrLeader && currentUserId != id.ToString())
                return Forbid();

            var user = await _context.Users
                .Include(u => u.AssignedTasks)
                .FirstOrDefaultAsync(u => u.Id == id);

            if (user == null)
                return NotFound("User not found.");

            var start = startDate?.Date ?? DateTime.UtcNow.Date.StartOfWeek(DayOfWeek.Monday);
            var end = endDate?.Date ?? start.AddDays(6);

            var tasksInRange = user.AssignedTasks
                .Where(t => t.StartDate <= end && t.DueDate >= start)
                .ToList();

            var totalWeight = tasksInRange.Sum(t => t.Weight);
            var totalEffort = tasksInRange.Sum(t => t.EstimatedEffortHours);
            var totalTasks = tasksInRange.Count;

            string workloadStatus = totalWeight switch
            {
                <= 15 => "Available",
                <= 25 => "Moderate",
                _ => "Overloaded"
            };

            return Ok(new
            {
                user.Id,
                user.FullName,
                user.Email,
                TotalTasks = totalTasks,
                TotalEffortHours = totalEffort,
                TotalWeight = totalWeight,
                WorkloadStatus = workloadStatus,
                Tasks = tasksInRange.Select(t => new
                {
                    t.Id,
                    t.Title,
                    t.Status,
                    t.EstimatedEffortHours,
                    t.Weight,
                    t.StartDate,
                    t.DueDate
                })
            });
        }
    }
}