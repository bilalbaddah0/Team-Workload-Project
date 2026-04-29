using TeamWorkload.API.Enums;

namespace TeamWorkload.API.Services.Interfaces
{
    public interface ITaskWeightService
    {
        double CalculateWeight(TaskPriority priority, TaskComplexity complexity, int estimatedEffortHours);
    }
}