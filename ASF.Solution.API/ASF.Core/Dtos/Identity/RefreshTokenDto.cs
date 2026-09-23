namespace ASF.Core.Dtos.Identity
{
    /// <summary>بيانات طلب تجديد Access Token.</summary>
    public class RefreshTokenDto
    {
        public string UserId { get; set; } = null!;
        public string RefreshToken { get; set; } = null!;
    }
}
