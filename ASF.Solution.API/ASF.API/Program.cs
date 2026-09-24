using Microsoft.AspNetCore.Http.Features;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using ASF.Api.Configurations.Cors;
using ASF.Api.Extentions;
using ASF.Core.Entities.Identity;
using ASF.Repository.AppDbContext;
using ASF.Repository.Identity;
using Microsoft.AspNetCore.Server.Kestrel.Core;
using Microsoft.AspNetCore.Authorization;
using ASF.Api.Configurations.Swagger;
using Microsoft.Extensions.Configuration;
using ASF.Repository.Data.Seed;
using ASF.Core.Services;
using ASF.Service;

namespace ASF.Api
{
    public class Program
    {
        private const long MaxRequestBodySizeBytes = 30 * 1024 * 1024;

        public static async Task Main(string[] args)
        {
            var builder = WebApplication.CreateBuilder(args);

            builder.Services.AddControllers();
            builder.Services.AddEndpointsApiExplorer();
            builder.Services.AddSwagger();
            builder.Services.AddAuthorization();
            builder.Services.AddSingleton<GoogleDriveOAuthService>();
            builder.Services.AddScoped<IDataIntegrityService, DataIntegrityService>();
            #region ConnectionDatabase

            builder.Services.AddDbContext<ApplicationDbContext>(options =>
                options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

            builder.Services.AddDbContext<AppIdentityDbContext>(options =>
                options.UseSqlServer(builder.Configuration.GetConnectionString("IdentityConnection")));

            builder.Services.AddCors(options =>
            {
                options.AddPolicy("AllowAll", builder =>
                {
                    builder
                        .WithOrigins("http://localhost:3000", "http://localhost:3001", "https://asf-consulting.com", "https://asfconsult-002-site1.ftempurl.com", "https://www.asf-consulting.com", "https://asf-com.onrender.com")
                        .AllowAnyHeader()
                        .AllowAnyMethod()
                        .AllowCredentials();
                });
            });

            builder.Services.AddControllers()
                .AddJsonOptions(options =>
                {
                    options.JsonSerializerOptions.ReferenceHandler =
                        System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
                });

            builder.WebHost.ConfigureKestrel(options =>
            {
                options.Limits.MaxRequestBodySize = MaxRequestBodySizeBytes;
            });

            #endregion

            #region Extension Services

            builder.Services.AddIdentityServices(builder.Configuration);
            builder.Services.AddApplicationServices();

            #endregion

            var app = builder.Build();

            // مزامنة بصمات كلمات المرور قبل استقبال أي طلب: الدخول صار يتحقّق
            // من البصمة، ومن غيّر كلمته من شاشة تعديل الحساب بصمته قديمة.
            await ASF.Api.Startup.PasswordHashResync.RunAsync(
                app.Services, app.Logger);

            if (app.Environment.IsDevelopment())
            {
                app.UseDeveloperExceptionPage();
            }
            else
            {
                app.UseExceptionHandler("/error");
            }

            app.UseSwagger();
            app.UseSwaggerUI();

            app.UseHttpsRedirection();

            app.UseRouting();
            app.UseCors("AllowAll");

            app.UseAuthentication();
            app.UseAuthorization();
            app.UseStaticFiles();

            app.Use(async (context, next) =>
            {
                var maxRequestBodySizeFeature = context.Features.Get<IHttpMaxRequestBodySizeFeature>();
                if (maxRequestBodySizeFeature is not null && !maxRequestBodySizeFeature.IsReadOnly)
                {
                    maxRequestBodySizeFeature.MaxRequestBodySize = MaxRequestBodySizeBytes;
                }
                await next.Invoke();
            });

            app.MapControllers();

            // ── الواجهة الأمامية على نفس المنفذ ───────────────────────────────
            // يجعل البرنامج رابطاً واحداً: الجذر يفتح التطبيق، و/api للخدمات،
            // و/swagger للتوثيق. ويجب أن يأتي بعد MapControllers حتى لا يبتلع
            // مسارات الـ API.
            //
            // مسارات React داخلية (مثل /access-management) لا يعرفها الخادم،
            // فتُعاد إليها index.html ليتولاها الموجّه في المتصفح.
            app.MapFallback(async context =>
            {
                var path = context.Request.Path.Value ?? string.Empty;

                // لا تبتلع الـ API ولا التوثيق ولا الملفات الثابتة
                if (path.StartsWith("/api", StringComparison.OrdinalIgnoreCase) ||
                    path.StartsWith("/swagger", StringComparison.OrdinalIgnoreCase) ||
                    path.StartsWith("/Photos", StringComparison.OrdinalIgnoreCase) ||
                    Path.HasExtension(path))
                {
                    context.Response.StatusCode = StatusCodes.Status404NotFound;
                    return;
                }

                var indexPath = Path.Combine(app.Environment.WebRootPath ?? "wwwroot", "index.html");

                if (!File.Exists(indexPath))
                {
                    context.Response.StatusCode = StatusCodes.Status404NotFound;
                    await context.Response.WriteAsync(
                        "الواجهة الأمامية غير منشورة. شغّل tools\\build-frontend.ps1 لبنائها.");
                    return;
                }

                context.Response.ContentType = "text/html; charset=utf-8";
                await context.Response.SendFileAsync(indexPath);
            });

            // ✅ لازم يكون آخر سطر في Main، وإلا البرنامج هيقفل فورًا (exit code 0)
            // من غير ما يستقبل أي Request أصلاً
            await app.RunAsync();
        }
    }
}