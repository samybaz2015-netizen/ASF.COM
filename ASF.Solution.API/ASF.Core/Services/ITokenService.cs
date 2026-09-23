using Microsoft.AspNetCore.Identity;
using ASF.Core.Entities.Identity;
namespace ASF.Core.Services
{
    public interface ITokenService
    {
        public Task<string> CreateTokenAsync(AppUser appUser, UserManager<AppUser> userManager);

        /// <summary>يولّد Refresh Token عشوائي آمن (Base64).</summary>
        string GenerateRefreshToken();
    }
}
