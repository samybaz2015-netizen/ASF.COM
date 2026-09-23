using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ASF.Repository.Migrations.ApplicationDb
{
    /// <inheritdoc />
    public partial class AddContractListCategory : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Category",
                table: "ContractWorkOrderTypes",
                type: "nvarchar(32)",
                maxLength: 32,
                nullable: false,
                // الصفوف القائمة كلّها أنواع أوامر عمل. الافتراضي الفارغ الذي
                // ولّدته الأداة كان سيُخرجها من كل قائمة فتبدو محذوفة.
                defaultValue: "WorkOrderType");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Category",
                table: "ContractWorkOrderTypes");
        }
    }
}
