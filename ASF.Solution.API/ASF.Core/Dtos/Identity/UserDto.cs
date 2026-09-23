

namespace ASF.Core.Dtos.Identity
{public class UserDto
    {
        public string Id { get; set; }    
        public string UserName { get; set; }

        public string Email { get; set; }
        public string? DisplayName { get; set; }

        public string Token { get; set; }
        public string? RefreshToken { get; set; }
        public DateTime? RefreshTokenExpiry { get; set; }
        public string UserImage { get; set; } 
        public string Role { get; set; }  
        public string Phone {  get; set; }
        public int? BranchId { get; set; }
        public int AnnualLeaveBalance { get; set; }
        public string? BranchName { get; set; }
        public string UserType { get; set; }
        public int? OfficeId { get; set; }

        public bool UserCanCreateProjectOutsideCityType { get; set; }
        public bool EmailConfirmed { get; set; }
        public List<string> Permissions { get; set; } = new();

    }
}
