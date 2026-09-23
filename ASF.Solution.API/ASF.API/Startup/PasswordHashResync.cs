using ASF.Core.Entities.Identity;
using ASF.Repository.Identity;
using Microsoft.AspNetCore.Identity;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;

namespace ASF.Api.Startup
{
    /// <summary>
    /// مزامنة بصمات كلمات المرور مرّةً واحدة عند الإقلاع.
    ///
    /// كان تسجيل الدخول يقارن كلمة المرور بعمود نصّي (<c>AspNetUsers.Password</c>)
    /// لا ببصمة Identity، وكانت شاشة تعديل الحساب تكتب في ذلك العمود وحده. فمن
    /// غيّر كلمة مروره من تلك الشاشة صار عموده يحمل كلمته الحالية بينما بصمته
    /// تحمل كلمةً أقدم.
    ///
    /// بعد تحويل الدخول إلى التحقّق بالبصمة، كان أولئك سيُحرمون الدخول بكلمتهم
    /// الحالية — وتعمل كلمتهم القديمة بدلاً منها. فتُعاد البصمة هنا من العمود
    /// النصّي قبل حذفه، فيبقى ما يعمل اليوم عاملاً غداً.
    ///
    /// تُنفَّذ إن وُجد العمود فقط، فبعد حذفه تصير لا عمل لها.
    /// </summary>
    public static class PasswordHashResync
    {
        public static async Task RunAsync(IServiceProvider services, ILogger logger)
        {
            using var scope = services.CreateScope();
            var provider = scope.ServiceProvider;

            var db = provider.GetRequiredService<AppIdentityDbContext>();
            var users = provider.GetRequiredService<UserManager<AppUser>>();
            var hasher = provider.GetRequiredService<IPasswordHasher<AppUser>>();

            List<(string Id, string Plain)> pending;

            try
            {
                if (!await ColumnExistsAsync(db))
                {
                    logger.LogInformation("مزامنة البصمات: العمود النصّي محذوف — لا عمل.");
                    return;
                }

                pending = await ReadPlaintextAsync(db);
            }
            catch (Exception ex)
            {
                // فشل الفحص لا يمنع الإقلاع: الخدمة أهمّ من مهمّة لمرّة واحدة.
                logger.LogError(ex, "مزامنة البصمات: تعذّر فحص العمود النصّي.");
                return;
            }

            var fixedCount = 0;

            foreach (var (id, plain) in pending)
            {
                var user = await users.FindByIdAsync(id);
                if (user is null) continue;

                // من بصمته صحيحة أصلاً يُترك: إعادة التجزئة بلا سبب تبديلٌ
                // لبيانات اعتماد سليمة.
                if (user.PasswordHash is not null &&
                    hasher.VerifyHashedPassword(user, user.PasswordHash, plain)
                        != PasswordVerificationResult.Failed)
                {
                    continue;
                }

                user.PasswordHash = hasher.HashPassword(user, plain);
                await users.UpdateAsync(user);
                fixedCount++;
            }

            logger.LogWarning(
                "مزامنة البصمات: فُحص {Total} حساباً، أُصلح {Fixed}. " +
                "شغّل ترحيل DropPlaintextPassword الآن لحذف العمود النصّي.",
                pending.Count, fixedCount);
        }

        /// <summary>هل ما زال العمود النصّي موجوداً؟</summary>
        private static async Task<bool> ColumnExistsAsync(AppIdentityDbContext db)
        {
            var connection = db.Database.GetDbConnection();
            if (connection.State != System.Data.ConnectionState.Open)
                await connection.OpenAsync();

            await using var command = connection.CreateCommand();
            command.CommandText =
                "SELECT CASE WHEN COL_LENGTH('AspNetUsers','Password') IS NULL THEN 0 ELSE 1 END";

            var result = await command.ExecuteScalarAsync();
            return Convert.ToInt32(result) == 1;
        }

        /// <summary>
        /// القراءة بـ SQL خام: الخاصيّة أُزيلت من الكيان، فلا يعرف EF العمود.
        /// </summary>
        private static async Task<List<(string, string)>> ReadPlaintextAsync(AppIdentityDbContext db)
        {
            var rows = new List<(string, string)>();

            var connection = db.Database.GetDbConnection();
            if (connection.State != System.Data.ConnectionState.Open)
                await connection.OpenAsync();

            await using var command = connection.CreateCommand();
            command.CommandText =
                "SELECT Id, Password FROM AspNetUsers WHERE Password IS NOT NULL AND LEN(Password) > 0";

            await using var reader = await command.ExecuteReaderAsync();
            while (await reader.ReadAsync())
            {
                rows.Add((reader.GetString(0), reader.GetString(1)));
            }

            return rows;
        }
    }
}
