using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;

namespace ASF.Core
{
    public static class TokenHelper
    {
        public static string GetUserIdFromToken(string token)
        {
            var handler = new JwtSecurityTokenHandler();

            // تحقق مما إذا كان التوكن صالحاً
            if ( handler.CanReadToken(token) )
            {
                var jwtToken = handler.ReadToken(token) as JwtSecurityToken;

                if ( jwtToken!=null )
                {
                    // البحث عن الـ Claim الذي يحتوي على الـ AppUserId
                    var userIdClaim = jwtToken.Claims.FirstOrDefault(c => c.Type=="nameid"||c.Type==ClaimTypes.NameIdentifier);

                    return userIdClaim?.Value; // إرجاع الـ AppUserId
                }
            }

            return null; // إذا لم يكن هناك توكن صالح أو لم يتم العثور على الـ Claim
        }
    }
}
