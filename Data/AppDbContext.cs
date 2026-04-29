using Microsoft.EntityFrameworkCore;
using TeamWorkload.API.Models;

namespace TeamWorkload.API.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
        {
        }

        public DbSet<User> Users { get; set; }
        public DbSet<Team> Teams { get; set; }
        public DbSet<TaskItem> Tasks { get; set; }
        public DbSet<TaskChangeRequest> TaskChangeRequests { get; set; }
        public DbSet<TaskStatusHistory> TaskStatusHistories { get; set; }
        public DbSet<WeightMultiplierSetting> WeightMultiplierSettings { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<User>().ToTable("Users");
            modelBuilder.Entity<Team>().ToTable("Teams");
            modelBuilder.Entity<TaskItem>().ToTable("Tasks");
            modelBuilder.Entity<TaskChangeRequest>().ToTable("TaskChangeRequests");
            modelBuilder.Entity<TaskStatusHistory>().ToTable("TaskStatusHistories");

            modelBuilder.Entity<WeightMultiplierSetting>().ToTable("WeightMultiplierSettings");

            modelBuilder.Entity<WeightMultiplierSetting>()
                .HasIndex(x => new { x.Type, x.Name })
                .IsUnique();

            modelBuilder.Entity<User>()
                .HasOne(u => u.Team)
                .WithMany(t => t.Users)
                .HasForeignKey(u => u.TeamId)
                .OnDelete(DeleteBehavior.SetNull);

            modelBuilder.Entity<TaskItem>()
                .HasOne(t => t.AssignedMember)
                .WithMany(u => u.AssignedTasks)
                .HasForeignKey(t => t.AssignedMemberId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<TaskItem>()
                .HasOne(t => t.CreatedBy)
                .WithMany(u => u.CreatedTasks)
                .HasForeignKey(t => t.CreatedById)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<TaskChangeRequest>()
                .HasOne(tcr => tcr.Task)
                .WithMany(t => t.ChangeRequests)
                .HasForeignKey(tcr => tcr.TaskId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<TaskChangeRequest>()
                .HasOne(tcr => tcr.RequestedBy)
                .WithMany()
                .HasForeignKey(tcr => tcr.RequestedById)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<TaskChangeRequest>()
                .HasOne(tcr => tcr.CurrentAssignedMember)
                .WithMany()
                .HasForeignKey(tcr => tcr.CurrentAssignedMemberId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<TaskChangeRequest>()
                .HasOne(tcr => tcr.NewAssignedMember)
                .WithMany()
                .HasForeignKey(tcr => tcr.NewAssignedMemberId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<TaskChangeRequest>()
                .HasOne(tcr => tcr.ReviewedBy)
                .WithMany()
                .HasForeignKey(tcr => tcr.ReviewedById)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<TaskStatusHistory>()
                .HasOne(h => h.Task)
                .WithMany(t => t.StatusHistories)
                .HasForeignKey(h => h.TaskId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<TaskStatusHistory>()
                .HasOne(h => h.ChangedBy)
                .WithMany()
                .HasForeignKey(h => h.ChangedById)
                .OnDelete(DeleteBehavior.Restrict);
        }
    }
}