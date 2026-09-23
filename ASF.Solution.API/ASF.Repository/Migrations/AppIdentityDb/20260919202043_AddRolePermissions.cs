using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ASF.Repository.Migrations.AppIdentityDb
{
    /// <inheritdoc />
    public partial class AddRolePermissions : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_UserPermissions_UserId",
                table: "UserPermissions");

            migrationBuilder.CreateTable(
                name: "RolePermissions",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    RoleId = table.Column<string>(type: "nvarchar(450)", maxLength: 450, nullable: false),
                    RoleName = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: false),
                    PermissionName = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    GrantedByAdminId = table.Column<string>(type: "nvarchar(450)", maxLength: 450, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RolePermissions", x => x.Id);
                });

            // الفهرس الفريد يفشل إن وُجدت صفوف مكررة لنفس المستخدم ونفس الصلاحية،
            // وهو احتمال قائم في قاعدة الإنتاج لأن الجدول لم يكن يمنع التكرار.
            // نُبقي الأحدث ونحذف ما قبله قبل إنشاء الفهرس.
            migrationBuilder.Sql(@"
                WITH Ranked AS (
                    SELECT Id,
                           ROW_NUMBER() OVER (
                               PARTITION BY UserId, PermissionName
                               ORDER BY CreatedAt DESC, Id DESC
                           ) AS RowNum
                    FROM UserPermissions
                )
                DELETE FROM UserPermissions
                WHERE Id IN (SELECT Id FROM Ranked WHERE RowNum > 1);
            ");

            migrationBuilder.CreateIndex(
                name: "IX_UserPermissions_UserId_PermissionName",
                table: "UserPermissions",
                columns: new[] { "UserId", "PermissionName" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_RolePermissions_RoleId_PermissionName",
                table: "RolePermissions",
                columns: new[] { "RoleId", "PermissionName" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "RolePermissions");

            migrationBuilder.DropIndex(
                name: "IX_UserPermissions_UserId_PermissionName",
                table: "UserPermissions");

            migrationBuilder.CreateIndex(
                name: "IX_UserPermissions_UserId",
                table: "UserPermissions",
                column: "UserId");
        }
    }
}
