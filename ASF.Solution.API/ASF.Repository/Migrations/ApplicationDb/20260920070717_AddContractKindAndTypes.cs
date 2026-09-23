using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ASF.Repository.Migrations.ApplicationDb
{
    /// <inheritdoc />
    public partial class AddContractKindAndTypes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ClientName",
                table: "Contracts",
                type: "nvarchar(256)",
                maxLength: 256,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Kind",
                table: "Contracts",
                type: "nvarchar(16)",
                maxLength: 16,
                nullable: false,
                // العقود القائمة أُنشئت قبل وجود التصنيف، وهي عقود موحّدة.
                // نصّ فارغ كان سيجعلها بلا نوع معروف.
                defaultValue: "Unified");

            migrationBuilder.CreateTable(
                name: "ContractWorkOrderTypes",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ContractId = table.Column<int>(type: "int", nullable: false),
                    DepartmentId = table.Column<int>(type: "int", nullable: true),
                    Name = table.Column<string>(type: "nvarchar(128)", maxLength: 128, nullable: false),
                    Description = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    SortOrder = table.Column<int>(type: "int", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ContractWorkOrderTypes", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ContractWorkOrderTypes_Contracts_ContractId",
                        column: x => x.ContractId,
                        principalTable: "Contracts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ContractWorkOrderTypes_WorkflowDepartments_DepartmentId",
                        column: x => x.DepartmentId,
                        principalTable: "WorkflowDepartments",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "ContractTeamPermissions",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    UserId = table.Column<string>(type: "nvarchar(450)", maxLength: 450, nullable: false),
                    UserName = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: true),
                    ContractId = table.Column<int>(type: "int", nullable: false),
                    DepartmentId = table.Column<int>(type: "int", nullable: true),
                    WorkOrderTypeId = table.Column<int>(type: "int", nullable: true),
                    CanView = table.Column<bool>(type: "bit", nullable: false),
                    CanCreate = table.Column<bool>(type: "bit", nullable: false),
                    CanEdit = table.Column<bool>(type: "bit", nullable: false),
                    CanDelete = table.Column<bool>(type: "bit", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    GrantedByUserId = table.Column<string>(type: "nvarchar(450)", maxLength: 450, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ContractTeamPermissions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ContractTeamPermissions_ContractWorkOrderTypes_WorkOrderTypeId",
                        column: x => x.WorkOrderTypeId,
                        principalTable: "ContractWorkOrderTypes",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_ContractTeamPermissions_Contracts_ContractId",
                        column: x => x.ContractId,
                        principalTable: "Contracts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ContractTeamPermissions_WorkflowDepartments_DepartmentId",
                        column: x => x.DepartmentId,
                        principalTable: "WorkflowDepartments",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateIndex(
                name: "IX_ContractTeamPermissions_ContractId",
                table: "ContractTeamPermissions",
                column: "ContractId");

            migrationBuilder.CreateIndex(
                name: "IX_ContractTeamPermissions_DepartmentId",
                table: "ContractTeamPermissions",
                column: "DepartmentId");

            migrationBuilder.CreateIndex(
                name: "IX_ContractTeamPermissions_UserId",
                table: "ContractTeamPermissions",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_ContractTeamPermissions_UserId_ContractId_DepartmentId_WorkOrderTypeId",
                table: "ContractTeamPermissions",
                columns: new[] { "UserId", "ContractId", "DepartmentId", "WorkOrderTypeId" },
                unique: true,
                filter: "[DepartmentId] IS NOT NULL AND [WorkOrderTypeId] IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_ContractTeamPermissions_WorkOrderTypeId",
                table: "ContractTeamPermissions",
                column: "WorkOrderTypeId");

            migrationBuilder.CreateIndex(
                name: "IX_ContractWorkOrderTypes_ContractId_DepartmentId_Name",
                table: "ContractWorkOrderTypes",
                columns: new[] { "ContractId", "DepartmentId", "Name" },
                unique: true,
                filter: "[DepartmentId] IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_ContractWorkOrderTypes_DepartmentId",
                table: "ContractWorkOrderTypes",
                column: "DepartmentId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ContractTeamPermissions");

            migrationBuilder.DropTable(
                name: "ContractWorkOrderTypes");

            migrationBuilder.DropColumn(
                name: "ClientName",
                table: "Contracts");

            migrationBuilder.DropColumn(
                name: "Kind",
                table: "Contracts");
        }
    }
}
