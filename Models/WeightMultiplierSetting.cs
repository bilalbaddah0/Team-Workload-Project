namespace TeamWorkload.API.Models
{
    public class WeightMultiplierSetting
    {
        public int Id { get; set; }
        public string Type { get; set; } = string.Empty; // Priority or Complexity
        public string Name { get; set; } = string.Empty; // Low, Medium, High...
        public double Multiplier { get; set; }
    }
}