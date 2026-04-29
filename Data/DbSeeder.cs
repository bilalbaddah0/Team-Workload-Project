using Microsoft.EntityFrameworkCore;
using TeamWorkload.API.Enums;
using TeamWorkload.API.Models;
using TeamWorkload.API.Services.Interfaces;

namespace TeamWorkload.API.Data
{
    public static class DbSeeder
    {
        public static async Task SeedAsync(AppDbContext context, ITaskWeightService taskWeightService)
        {
            var today = DateTime.UtcNow.Date;

            var backendTeam = await EnsureTeamAsync(
                context,
                "Backend Team",
                "Handles API and backend development");

            var qaTeam = await EnsureTeamAsync(
                context,
                "QA Team",
                "Handles testing and validation");

            var admin = await EnsureUserAsync(
                context,
                "System Admin",
                "admin@teamworkload.local",
                "Admin123!",
                UserRole.Admin,
                backendTeam.Id);

            var leader = await EnsureUserAsync(
                context,
                "Sarah Leader",
                "leader@teamworkload.local",
                "Leader123!",
                UserRole.TeamLeader,
                backendTeam.Id);

            var ali = await EnsureUserAsync(
                context,
                "Ali Member",
                "ali@teamworkload.local",
                "Member123!",
                UserRole.Member,
                backendTeam.Id);

            var maya = await EnsureUserAsync(
                context,
                "Maya Member",
                "maya@teamworkload.local",
                "Member123!",
                UserRole.Member,
                backendTeam.Id);

            var omar = await EnsureUserAsync(
                context,
                "Omar QA",
                "omar@teamworkload.local",
                "Member123!",
                UserRole.Member,
                qaTeam.Id);

            await EnsureWeightMultipliersAsync(context);

            var task1 = await EnsureTaskAsync(context, taskWeightService, new TaskItem
            {
                Title = "Build login API response cleanup",
                Description = "Return cleaner auth payload and validation messages.",
                AssignedMemberId = ali.Id,
                CreatedById = leader.Id,
                Priority = TaskPriority.High,
                Complexity = TaskComplexity.Medium,
                EstimatedEffortHours = 6,
                StartDate = today.AddDays(-1),
                DueDate = today.AddDays(2),
                Status = WorkTaskStatus.InProgress,
                IsAcknowledged = true,
                AcknowledgedAt = DateTime.UtcNow.AddDays(-1),
                CreatedAt = DateTime.UtcNow.AddDays(-2)
            });

            var task2 = await EnsureTaskAsync(context, taskWeightService, new TaskItem
            {
                Title = "Implement team workload summary",
                Description = "Add team totals, member rows, and date filtering.",
                AssignedMemberId = maya.Id,
                CreatedById = leader.Id,
                Priority = TaskPriority.Critical,
                Complexity = TaskComplexity.Complex,
                EstimatedEffortHours = 8,
                StartDate = today,
                DueDate = today.AddDays(4),
                Status = WorkTaskStatus.New,
                IsAcknowledged = false,
                CreatedAt = DateTime.UtcNow
            });

            await EnsureTaskAsync(context, taskWeightService, new TaskItem
            {
                Title = "Prepare regression checklist",
                Description = "Prepare QA checklist for current sprint tasks.",
                AssignedMemberId = omar.Id,
                CreatedById = leader.Id,
                Priority = TaskPriority.Medium,
                Complexity = TaskComplexity.Simple,
                EstimatedEffortHours = 5,
                StartDate = today,
                DueDate = today.AddDays(5),
                Status = WorkTaskStatus.Blocked,
                IsAcknowledged = true,
                AcknowledgedAt = DateTime.UtcNow,
                CreatedAt = DateTime.UtcNow
            });

            await EnsureTaskAsync(context, taskWeightService, new TaskItem
            {
                Title = "Refine task details endpoint",
                Description = "Prepare richer payload for task detail page.",
                AssignedMemberId = ali.Id,
                CreatedById = leader.Id,
                Priority = TaskPriority.High,
                Complexity = TaskComplexity.Medium,
                EstimatedEffortHours = 4,
                StartDate = today.AddDays(7),
                DueDate = today.AddDays(10),
                Status = WorkTaskStatus.New,
                IsAcknowledged = false,
                CreatedAt = DateTime.UtcNow
            });

            await EnsurePendingChangeRequestAsync(context, task2, maya);
        }

        private static async Task<Team> EnsureTeamAsync(
            AppDbContext context,
            string name,
            string? description)
        {
            var existing = await context.Teams.FirstOrDefaultAsync(t => t.Name == name);
            if (existing != null)
                return existing;

            var team = new Team
            {
                Name = name,
                Description = description,
                CreatedAt = DateTime.UtcNow
            };

            context.Teams.Add(team);
            await context.SaveChangesAsync();
            return team;
        }

        private static async Task<User> EnsureUserAsync(
            AppDbContext context,
            string fullName,
            string email,
            string password,
            UserRole role,
            int? teamId)
        {
            var existing = await context.Users.FirstOrDefaultAsync(u => u.Email == email);
            if (existing != null)
                return existing;

            var user = new User
            {
                FullName = fullName,
                Email = email,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(password),
                Role = role,
                TeamId = teamId,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };

            context.Users.Add(user);
            await context.SaveChangesAsync();
            return user;
        }

        private static async Task<TaskItem> EnsureTaskAsync(
            AppDbContext context,
            ITaskWeightService taskWeightService,
            TaskItem task)
        {
            var existing = await context.Tasks.FirstOrDefaultAsync(t => t.Title == task.Title);
            if (existing != null)
                return existing;

            task.Weight = taskWeightService.CalculateWeight(
                task.Priority,
                task.Complexity,
                task.EstimatedEffortHours);

            context.Tasks.Add(task);
            await context.SaveChangesAsync();
            return task;
        }

        private static async Task EnsurePendingChangeRequestAsync(
            AppDbContext context,
            TaskItem task,
            User requestedBy)
        {
            var exists = await context.TaskChangeRequests.AnyAsync(r =>
                r.TaskId == task.Id &&
                r.Status == ChangeRequestStatus.Pending);

            if (exists)
                return;

            var changeRequest = new TaskChangeRequest
            {
                TaskId = task.Id,
                RequestedById = requestedBy.Id,
                CurrentAssignedMemberId = task.AssignedMemberId,
                NewAssignedMemberId = null,
                CurrentDueDate = task.DueDate,
                NewDueDate = task.DueDate.AddDays(2),
                CurrentEstimatedEffortHours = task.EstimatedEffortHours,
                NewEstimatedEffortHours = task.EstimatedEffortHours + 2,
                Reason = "Need more time to finish dashboard filtering and totals.",
                Status = ChangeRequestStatus.Pending,
                CreatedAt = DateTime.UtcNow
            };

            context.TaskChangeRequests.Add(changeRequest);
            await context.SaveChangesAsync();



        }
        private static async Task EnsureWeightMultipliersAsync(AppDbContext context)
        {
            var defaults = new[]
            {
        new WeightMultiplierSetting { Type = "Priority", Name = "Low", Multiplier = 1.0 },
        new WeightMultiplierSetting { Type = "Priority", Name = "Medium", Multiplier = 1.2 },
        new WeightMultiplierSetting { Type = "Priority", Name = "High", Multiplier = 1.5 },
        new WeightMultiplierSetting { Type = "Priority", Name = "Critical", Multiplier = 2.0 },

        new WeightMultiplierSetting { Type = "Complexity", Name = "Simple", Multiplier = 1.0 },
        new WeightMultiplierSetting { Type = "Complexity", Name = "Medium", Multiplier = 1.5 },
        new WeightMultiplierSetting { Type = "Complexity", Name = "Complex", Multiplier = 2.0 },
    };

            foreach (var item in defaults)
            {
                var exists = await context.WeightMultiplierSettings.AnyAsync(x =>
                    x.Type == item.Type && x.Name == item.Name);

                if (!exists)
                {
                    context.WeightMultiplierSettings.Add(item);
                }
            }

            await context.SaveChangesAsync();
        }
    }

}



