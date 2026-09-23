using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.IdentityModel.Tokens;
using ASF.Core.Entities.Identity;
using ASF.Core.Services;
using ASF.Repository.Identity;
using ASF.Service;
using System.Text;

namespace ASF.Api.Extentions
{
    public static class IdentityServicesExtention
    {
        public static IServiceCollection AddIdentityServices(this IServiceCollection Services, IConfiguration configuration)
        {
            Services.AddScoped(typeof(ITokenService), typeof(TokenService));

            Services.AddIdentity<AppUser, IdentityRole>(option =>
            {
                // سياسة كلمة مرور قوية — الحد الأدنى المقبول لبيئة إنتاج
                option.Password.RequiredLength = 8;
                option.Password.RequireDigit = true;
                option.Password.RequireLowercase = true;
                option.Password.RequireUppercase = true;
                option.Password.RequireNonAlphanumeric = true;

                // قفل الحساب بعد 5 محاولات فاشلة لمدة 15 دقيقة
                option.Lockout.MaxFailedAccessAttempts = 5;
                option.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(15);
                option.Lockout.AllowedForNewUsers = true;
            }).AddEntityFrameworkStores<AppIdentityDbContext>().AddDefaultTokenProviders();

            Services.AddAuthentication(option =>
            {
                option.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
                option.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
            }).AddJwtBearer(option =>
            {
                option.Events = new JwtBearerEvents
                {
                    OnMessageReceived = context =>
                    {
                        var accessToken = context.Request.Query["access_token"];
                        if (!string.IsNullOrEmpty(accessToken))
                        {
                            context.Token = accessToken;
                        }
                        return Task.CompletedTask;
                    }
                };

                option.TokenValidationParameters = new TokenValidationParameters()
                {
                    ValidateIssuer = true,
                    ValidIssuer = configuration["JWT:ValidIssuer"],
                    ValidateAudience = true,
                    ValidAudience = configuration["JWT:ValidAudience"],
                    ValidateLifetime = true,
                    ValidateIssuerSigningKey = true,
                    IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(configuration["JWT:Secret"]))
                };
            });

            Services.AddAuthorization(options =>
            {
                options.AddPolicy("AdminPolicy", policy => policy.RequireRole("admin"));
                options.AddPolicy("SecretaryPolicy", policy => policy.RequireRole("eng"));
                options.AddPolicy("ENGPolicy", policy => policy.RequireRole("eng"));
            });

            // ملحوظة: تم حذف كود BuildServiceProvider() و RoleManager القديم
            // لأنه كان بينشئ DI Container إضافي بلا فايدة (الكود اللي بيستخدمه كان متعلّق أصلاً)
            // لو محتاج تضيف Roles تلقائيًا وقت الإقلاع، الأفضل تعمل ده في Program.cs
            // جوه نفس الـ scope بتاع الـ Migrations، مش هنا

            return Services;
        }
    }
}