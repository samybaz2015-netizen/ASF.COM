using Swashbuckle.AspNetCore.SwaggerGen;
using Microsoft.OpenApi.Models;

namespace ASF.Api
{
    public class BreakCircularReferencesSchemaFilter : ISchemaFilter
    {
        private static readonly (string TypeName, string PropertyName)[] PropertiesToHide = new[]
        {
            ("ProjectPricingItem", "pricingItem"),
            ("EmergencyPricingItem", "emergency"),
            ("MaintenancePricingItem", "maintenance"),
            ("NewProjectPricingItem", "newProject"),
        };

        public void Apply(OpenApiSchema schema, SchemaFilterContext context)
        {
            if (schema?.Properties == null || context?.Type == null)
                return;

            var typeName = context.Type.Name;

            foreach (var (targetType, propName) in PropertiesToHide)
            {
                if (typeName == targetType && schema.Properties.ContainsKey(propName))
                {
                    schema.Properties.Remove(propName);
                }
            }
        }
    }
}