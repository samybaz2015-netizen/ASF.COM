//namespace ASF.Api.Configurations.Cors;

//public static class CorsExtension
//{
//    private const string PolicyName = "ASF.Api";

//    /// <summary>
//    /// Add cors configurations
//    /// </summary>
//    /// <param name="services"></param>
//    /// <param name="configuration"></param>
//    /// <exception cref="Exception"></exception>
//    public static IServiceCollection AddCorsSetup(this IServiceCollection services, IConfiguration configuration)
//    {
//        var corsConfiguration = new CorsConfigurations();
//        configuration.Bind("Cors", corsConfiguration);

//        if (corsConfiguration is null)
//            throw new Exception("Couldn't load cors settings configuration");

//        services.AddCors(options =>
//        {
//            options.AddPolicy("AllowSpecificOrigin", builder =>
//            {
//                builder.WithOrigins("https://asf-consulting.com")
//                       .AllowAnyHeader()
//                       .AllowAnyMethod()
//                       .AllowCredentials(); // مهم لدعم المصادقة عبر الكوكيز
//            });
//        });


//        return services;
//    }

//    /// <summary>
//    /// setup cors origins
//    /// </summary>
//    /// <param name="app"></param>
//    public static void UseCorsSetup(this IApplicationBuilder app)
//    {
//        app.UseCors(PolicyName);
//    }
//}