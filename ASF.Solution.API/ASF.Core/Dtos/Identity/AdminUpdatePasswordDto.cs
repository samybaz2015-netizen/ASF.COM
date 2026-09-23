namespace ASF.Core.Dtos.Identity
{
    public class AdminUpdatePasswordDto
    {
        public string UserId { get; set; }
        public string NewPassword { get; set; }
        public string ConfirmPassword { get; set; }
    }
}
