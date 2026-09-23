using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ASF.Repository.Migrations.ApplicationDb
{
    /// <inheritdoc />
    public partial class AddUserDataScopes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "UserDataScopes",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    UserId = table.Column<string>(type: "nvarchar(450)", maxLength: 450, nullable: false),
                    ContractId = table.Column<int>(type: "int", nullable: false),
                    DepartmentId = table.Column<int>(type: "int", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    GrantedByUserId = table.Column<string>(type: "nvarchar(450)", maxLength: 450, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserDataScopes", x => x.Id);
                    table.ForeignKey(
                        name: "FK_UserDataScopes_Contracts_ContractId",
                        column: x => x.ContractId,
                        principalTable: "Contracts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_UserDataScopes_WorkflowDepartments_DepartmentId",
                        column: x => x.DepartmentId,
                        principalTable: "WorkflowDepartments",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateIndex(
                name: "IX_UserDataScopes_ContractId",
                table: "UserDataScopes",
                column: "ContractId");

            migrationBuilder.CreateIndex(
                name: "IX_UserDataScopes_DepartmentId",
                table: "UserDataScopes",
                column: "DepartmentId");

            migrationBuilder.CreateIndex(
                name: "IX_UserDataScopes_UserId",
                table: "UserDataScopes",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_UserDataScopes_UserId_ContractId_DepartmentId",
                table: "UserDataScopes",
                columns: new[] { "UserId", "ContractId", "DepartmentId" },
                unique: true,
                filter: "[DepartmentId] IS NOT NULL");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "UserDataScopes");
        }
    }
}
