using TeamWorkload.API.Enums;

namespace TeamWorkload.API.DTOs
{
    public class UserResponseDto
    {
        public int Id { get; set; }
        public string FullName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;

        public UserRole Role { get; set; }

        public int? TeamId { get; set; }
        public bool IsActive { get; set; }

        public DateTime CreatedAt { get; set; }
    }
}