using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ASF.Repository.Migrations.ApplicationDb
{
    /// <inheritdoc />
    public partial class WorkOrderAmounts : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "ActualAmount",
                table: "NewProjects",
                type: "decimal(18,2)",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "EstimatedAmount",
                table: "NewProjects",
                type: "decimal(18,2)",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "ActualAmount",
                table: "Maintenances",
                type: "decimal(18,2)",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "EstimatedAmount",
                table: "Maintenances",
                type: "decimal(18,2)",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "ActualAmount",
                table: "Emergencys",
                type: "decimal(18,2)",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "EstimatedAmount",
                table: "Emergencys",
                type: "decimal(18,2)",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "ActualAmount",
                table: "Constructions",
                type: "decimal(18,2)",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "EstimatedAmount",
                table: "Constructions",
                type: "decimal(18,2)",
                nullable: true);

            // تعبئة القيم الرقمية من النصوص القائمة.
            //
            // التنظيف يطابق ما يفعله الكود عند الحفظ: تُحوَّل الأرقام العربية،
            // وتُزال فواصل الآلاف والمسافات والحروف، وتبقى فاصلة عشرية واحدة.
            //
            // ما لا يُقرأ رقماً يبقى NULL لا صفراً: الصفر قيمةٌ معروفة تدخل في
            // المتوسّطات، والفارغ يعني «غير معروفة» فيُستثنى منها.
            migrationBuilder.Sql(@"
                UPDATE t SET t.EstimatedAmount = TRY_CONVERT(decimal(18,2), REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(t.EstimatedValue, N'٬', ''), N',', ''), N' ', ''), N'٠','0'), N'١','1'), N'٢','2'), N'٣','3'), N'٤','4'), N'٥','5'), N'٦','6'), N'٧','7'), N'٨','8'), N'٩','9'), N'٫', '.'))
                FROM Constructions t
                WHERE t.EstimatedValue IS NOT NULL AND LTRIM(RTRIM(t.EstimatedValue)) <> '';");

            migrationBuilder.Sql(@"
                UPDATE t SET t.ActualAmount = TRY_CONVERT(decimal(18,2), REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(t.ActualValue, N'٬', ''), N',', ''), N' ', ''), N'٠','0'), N'١','1'), N'٢','2'), N'٣','3'), N'٤','4'), N'٥','5'), N'٦','6'), N'٧','7'), N'٨','8'), N'٩','9'), N'٫', '.'))
                FROM Constructions t
                WHERE t.ActualValue IS NOT NULL AND LTRIM(RTRIM(t.ActualValue)) <> '';");

            migrationBuilder.Sql(@"
                UPDATE t SET t.EstimatedAmount = TRY_CONVERT(decimal(18,2), REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(t.EstimatedValue, N'٬', ''), N',', ''), N' ', ''), N'٠','0'), N'١','1'), N'٢','2'), N'٣','3'), N'٤','4'), N'٥','5'), N'٦','6'), N'٧','7'), N'٨','8'), N'٩','9'), N'٫', '.'))
                FROM Emergencys t
                WHERE t.EstimatedValue IS NOT NULL AND LTRIM(RTRIM(t.EstimatedValue)) <> '';");

            migrationBuilder.Sql(@"
                UPDATE t SET t.ActualAmount = TRY_CONVERT(decimal(18,2), REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(t.ActualValue, N'٬', ''), N',', ''), N' ', ''), N'٠','0'), N'١','1'), N'٢','2'), N'٣','3'), N'٤','4'), N'٥','5'), N'٦','6'), N'٧','7'), N'٨','8'), N'٩','9'), N'٫', '.'))
                FROM Emergencys t
                WHERE t.ActualValue IS NOT NULL AND LTRIM(RTRIM(t.ActualValue)) <> '';");

            migrationBuilder.Sql(@"
                UPDATE t SET t.EstimatedAmount = TRY_CONVERT(decimal(18,2), REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(t.EstimatedValue, N'٬', ''), N',', ''), N' ', ''), N'٠','0'), N'١','1'), N'٢','2'), N'٣','3'), N'٤','4'), N'٥','5'), N'٦','6'), N'٧','7'), N'٨','8'), N'٩','9'), N'٫', '.'))
                FROM Maintenances t
                WHERE t.EstimatedValue IS NOT NULL AND LTRIM(RTRIM(t.EstimatedValue)) <> '';");

            migrationBuilder.Sql(@"
                UPDATE t SET t.ActualAmount = TRY_CONVERT(decimal(18,2), REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(t.ActualValue, N'٬', ''), N',', ''), N' ', ''), N'٠','0'), N'١','1'), N'٢','2'), N'٣','3'), N'٤','4'), N'٥','5'), N'٦','6'), N'٧','7'), N'٨','8'), N'٩','9'), N'٫', '.'))
                FROM Maintenances t
                WHERE t.ActualValue IS NOT NULL AND LTRIM(RTRIM(t.ActualValue)) <> '';");

            migrationBuilder.Sql(@"
                UPDATE t SET t.EstimatedAmount = TRY_CONVERT(decimal(18,2), REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(t.EstimatedValue, N'٬', ''), N',', ''), N' ', ''), N'٠','0'), N'١','1'), N'٢','2'), N'٣','3'), N'٤','4'), N'٥','5'), N'٦','6'), N'٧','7'), N'٨','8'), N'٩','9'), N'٫', '.'))
                FROM NewProjects t
                WHERE t.EstimatedValue IS NOT NULL AND LTRIM(RTRIM(t.EstimatedValue)) <> '';");

            migrationBuilder.Sql(@"
                UPDATE t SET t.ActualAmount = TRY_CONVERT(decimal(18,2), REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(t.ActualValue, N'٬', ''), N',', ''), N' ', ''), N'٠','0'), N'١','1'), N'٢','2'), N'٣','3'), N'٤','4'), N'٥','5'), N'٦','6'), N'٧','7'), N'٨','8'), N'٩','9'), N'٫', '.'))
                FROM NewProjects t
                WHERE t.ActualValue IS NOT NULL AND LTRIM(RTRIM(t.ActualValue)) <> '';");

        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ActualAmount",
                table: "NewProjects");

            migrationBuilder.DropColumn(
                name: "EstimatedAmount",
                table: "NewProjects");

            migrationBuilder.DropColumn(
                name: "ActualAmount",
                table: "Maintenances");

            migrationBuilder.DropColumn(
                name: "EstimatedAmount",
                table: "Maintenances");

            migrationBuilder.DropColumn(
                name: "ActualAmount",
                table: "Emergencys");

            migrationBuilder.DropColumn(
                name: "EstimatedAmount",
                table: "Emergencys");

            migrationBuilder.DropColumn(
                name: "ActualAmount",
                table: "Constructions");

            migrationBuilder.DropColumn(
                name: "EstimatedAmount",
                table: "Constructions");
        }
    }
}
