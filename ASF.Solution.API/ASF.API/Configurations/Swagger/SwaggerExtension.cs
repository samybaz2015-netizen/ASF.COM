using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.OpenApi.Models;
using Swashbuckle.AspNetCore.SwaggerUI;

namespace ASF.Api.Configurations.Swagger;

/// <summary>
/// this extension support swagger implementation across project
/// </summary>
public static class SwaggerExtension
{
    /// <summary>
    /// the service layer of swagger implementation
    /// </summary>
    /// <param name="services"></param>
    public static void AddSwagger(this IServiceCollection services)
    {
        services.AddSwaggerGen(options =>
        {
            options.SwaggerDoc("v1", new OpenApiInfo { Title = "ASF.Api", Version = "V1" });
            options.CustomSchemaIds(type => type.FullName);
            options.SchemaFilter<BreakCircularReferencesSchemaFilter>();
            options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
            {
                In = ParameterLocation.Header,
                Name = "Authorization",
                Type = SecuritySchemeType.Http,
                BearerFormat = "JWT",
                Scheme = JwtBearerDefaults.AuthenticationScheme,
            });
            options.AddSecurityRequirement(new OpenApiSecurityRequirement
            {
                {
                    new OpenApiSecurityScheme
                    {
                        Reference=new OpenApiReference
                        {
                            Type=ReferenceType.SecurityScheme,
                            Id="Bearer"
                        }
                    },
                    new string[]{}
                }
            });
        });
    }

    /// <summary>
    /// the custom swagger middleware
    /// </summary>
    /// <param name="app"></param>
    /// <param name="swaggerConfigurationSectionName">it's optional with a default value called 'Swagger'
    /// then it will load the default setting form appsettings.json</param>
    public static void UseSwaggerTool(this IApplicationBuilder app, string swaggerConfigurationSectionName = "Swagger")
    {
        //var serviceProvider = app.ApplicationServices;
        //var configurations = serviceProvider.GetService<IConfiguration>();
        //var swaggerConfiguration =
        //    configurations!.GetSection(swaggerConfigurationSectionName).Get<SwaggerConfiguration>();

        //if (!swaggerConfiguration.Enabled)
        //    return;

        //app.UseSwagger(opt => opt.RouteTemplate = "/swagger/v1/{documentName}.json");

        //app.UseSwaggerUI(opt =>
        //{
        //    opt.DocExpansion(DocExpansion.None);
        //    opt.DefaultModelsExpandDepth(-1);
        //    opt.AddHierarchySupport();
        //    opt.EnableDeepLinking();
        //    opt.DocumentTitle = swaggerConfiguration.Title;
        //    opt.SwaggerEndpoint($"/swagger/v1/{swaggerConfiguration.Name}.json", swaggerConfiguration.Title);
        //    opt.EnablePersistAuthorization();
        //    opt.OAuthClientId(swaggerConfiguration.ClientId);
        //    opt.OAuthScopes("profile", "openid");
        //    opt.OAuthUsePkce();
        //    opt.DefaultModelRendering(ModelRendering.Example);
        //    opt.DisplayOperationId();
        //    opt.DisplayRequestDuration();
        //    opt.EnableTryItOutByDefault();
        //});
    }
}