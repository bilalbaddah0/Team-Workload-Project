using TeamWorkload.API.Enums;

namespace TeamWorkload.API.DTOs
{
    public class CreateUserDto
    {
        public string FullName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;

        public string Password { get; set; } = string.Empty;

        public UserRole Role { get; set; }

        public int? TeamId { get; set; }
    }
}