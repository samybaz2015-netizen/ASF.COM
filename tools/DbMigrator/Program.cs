using System.Reflection;
using Microsoft.EntityFrameworkCore;

// ينشئ جداول قاعدة البيانات المحلية بتطبيق الترحيلات المدمجة في RASM.Repository.dll.
// لا يلمس الإنتاج: سلاسل الاتصال تُمرَّر صراحةً وكلها محلية.

var apiDir = args.Length > 0
    ? args[0]
    : Path.Combine(AppContext.BaseDirectory, "..", "..", "..", "..", "..", "local", "api");
apiDir = Path.GetFullPath(apiDir);

var defaultCs = args.Length > 1
    ? args[1]
    : @"Data Source=.\SQLEXPRESS;Initial Catalog=AsfDefault_Local;Integrated Security=True;Encrypt=False;TrustServerCertificate=True;Connection Timeout=60;";
var identityCs = args.Length > 2
    ? args[2]
    : @"Data Source=.\SQLEXPRESS;Initial Catalog=AsfIdentity_Local;Integrated Security=True;Encrypt=False;TrustServerCertificate=True;Connection Timeout=60;";

foreach (var cs in new[] { defaultCs, identityCs })
{
    if (cs.Contains("site4now", StringComparison.OrdinalIgnoreCase))
    {
        Console.Error.WriteLine("رُفض: سلسلة الاتصال تشير إلى خادم الإنتاج. هذه الأداة للبيئة المحلية فقط.");
        return 2;
    }
}

Console.WriteLine($"مجلد البرنامج : {apiDir}");
if (!Directory.Exists(apiDir))
{
    Console.Error.WriteLine("المجلد غير موجود.");
    return 2;
}

// تبعيات RASM.* تُحمَّل من مجلد البرنامج المنشور.
AppDomain.CurrentDomain.AssemblyResolve += (_, e) =>
{
    var simpleName = new AssemblyName(e.Name).Name;
    var candidate = Path.Combine(apiDir, simpleName + ".dll");
    return File.Exists(candidate) ? Assembly.LoadFrom(candidate) : null;
};

var repository = Assembly.LoadFrom(Path.Combine(apiDir, "RASM.Repository.dll"));

Type[] types;
try
{
    types = repository.GetTypes();
}
catch (ReflectionTypeLoadException ex)
{
    types = ex.Types.Where(t => t is not null).ToArray()!;
    Console.WriteLine($"تحذير: تعذّر تحميل {ex.LoaderExceptions.Length} نوعاً، سنكمل بما تحمّل.");
}

var contexts = types
    .Where(t => t is { IsAbstract: false, IsGenericTypeDefinition: false } && typeof(DbContext).IsAssignableFrom(t))
    .OrderBy(t => t.Name)
    .ToList();

if (contexts.Count == 0)
{
    Console.Error.WriteLine("لم أجد أي DbContext في RASM.Repository.dll");
    return 3;
}

Console.WriteLine($"عدد سياقات قاعدة البيانات: {contexts.Count}");
var failures = 0;

foreach (var contextType in contexts)
{
    var isIdentity = contextType.Name.Contains("Identity", StringComparison.OrdinalIgnoreCase);
    var connectionString = isIdentity ? identityCs : defaultCs;
    var databaseName = isIdentity ? "AsfIdentity_Local" : "AsfDefault_Local";

    Console.WriteLine();
    Console.WriteLine($"=== {contextType.Name} -> {databaseName} ===");

    try
    {
        var builderType = typeof(DbContextOptionsBuilder<>).MakeGenericType(contextType);
        var builder = (DbContextOptionsBuilder)Activator.CreateInstance(builderType)!;
        builder.UseSqlServer(connectionString);

        using var context = (DbContext)Activator.CreateInstance(contextType, builder.Options)!;

        var pending = context.Database.GetPendingMigrations().ToList();
        Console.WriteLine($"ترحيلات معلّقة: {pending.Count}");

        if (pending.Count == 0)
        {
            Console.WriteLine("لا جديد.");
            continue;
        }

        context.Database.Migrate();

        var tables = context.Model.GetEntityTypes()
            .Select(e => e.GetTableName())
            .Where(n => n is not null)
            .Distinct()
            .Count();
        Console.WriteLine($"تم. عدد الجداول في النموذج: {tables}");
    }
    catch (MissingMethodException)
    {
        Console.Error.WriteLine($"تخطّي {contextType.Name}: لا يقبل DbContextOptions في بانيه.");
        failures++;
    }
    catch (Exception ex)
    {
        Console.Error.WriteLine($"فشل {contextType.Name}: {ex.GetType().Name}: {ex.Message}");
        failures++;
    }
}

Console.WriteLine();
Console.WriteLine(failures == 0 ? "اكتمل بنجاح." : $"اكتمل مع {failures} فشلاً.");
return failures == 0 ? 0 : 1;
