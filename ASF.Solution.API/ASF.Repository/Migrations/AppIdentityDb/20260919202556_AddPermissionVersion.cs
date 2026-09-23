using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ASF.Repository.Migrations.AppIdentityDb
{
    /// <inheritdoc />
    public partial class AddPermissionVersion : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "PermissionVersion",
                table: "AspNetUsers",
                type: "int",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "PermissionVersion",
                table: "AspNetUsers");
        }
    }
}
