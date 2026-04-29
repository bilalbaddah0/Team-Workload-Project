using TeamWorkload.API.Data;
using TeamWorkload.API.Enums;
using TeamWorkload.API.Services.Interfaces;

namespace TeamWorkload.API.Services
{
    public class TaskWeightService : ITaskWeightService
    {
        private readonly AppDbContext _context;

        public TaskWeightService(AppDbContext context)
        {
            _context = context;
        }

        public double CalculateWeight(TaskPriority priority, TaskComplexity complexity, int estimatedEffortHours)
        {
            var priorityMultiplier = GetMultiplier("Priority", priority.ToString(), GetDefaultPriority(priority));
            var complexityMultiplier = GetMultiplier("Complexity", complexity.ToString(), GetDefaultComplexity(complexity));

            return estimatedEffortHours * complexityMultiplier * priorityMultiplier;
        }

        private double GetMultiplier(string type, string name, double defaultValue)
        {
            var setting = _context.WeightMultiplierSettings
                .FirstOrDefault(x => x.Type == type && x.Name == name);

            return setting?.Multiplier ?? defaultValue;
        }

        private static double GetDefaultPriority(TaskPriority priority)
        {
            return priority switch
            {
                TaskPriority.Low => 1.0,
                TaskPriority.Medium => 1.2,
                TaskPriority.High => 1.5,
                TaskPriority.Critical => 2.0,
                _ => 1.0
            };
        }

        private static double GetDefaultComplexity(TaskComplexity complexity)
        {
            return complexity switch
            {
                TaskComplexity.Simple => 1.0,
                TaskComplexity.Medium => 1.5,
                TaskComplexity.Complex => 2.0,
                _ => 1.0
            };
        }
    }
}