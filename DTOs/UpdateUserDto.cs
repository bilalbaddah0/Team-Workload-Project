using TeamWorkload.API.Enums;

namespace TeamWorkload.API.DTOs
{
    public class UpdateUserDto
    {
        public string FullName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string? Password { get; set; } 
        public UserRole Role { get; set; }
        public int? TeamId { get; set; }
        public bool IsActive { get; set; }
    }
}