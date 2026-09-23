using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ASF.Repository.Migrations.ApplicationDb
{
    /// <inheritdoc />
    public partial class LinkWorkOrdersToBaskets : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "StableKey",
                table: "BasketTasks",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateTable(
                name: "WorkOrderPlacements",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ProjectTypeCode = table.Column<string>(type: "nvarchar(32)", maxLength: 32, nullable: false),
                    WorkOrderId = table.Column<int>(type: "int", nullable: false),
                    ContractId = table.Column<int>(type: "int", nullable: false),
                    DepartmentId = table.Column<int>(type: "int", nullable: false),
                    BasketStableKey = table.Column<int>(type: "int", nullable: false),
                    EnteredBasketAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    MigratedFromSituation = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_WorkOrderPlacements", x => x.Id);
                    table.ForeignKey(
                        name: "FK_WorkOrderPlacements_Contracts_ContractId",
                        column: x => x.ContractId,
                        principalTable: "Contracts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_WorkOrderPlacements_WorkflowDepartments_DepartmentId",
                        column: x => x.DepartmentId,
                        principalTable: "WorkflowDepartments",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "WorkOrderBasketHistories",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    PlacementId = table.Column<int>(type: "int", nullable: false),
                    FromBasketStableKey = table.Column<int>(type: "int", nullable: true),
                    ToBasketStableKey = table.Column<int>(type: "int", nullable: false),
                    FromBasketName = table.Column<string>(type: "nvarchar(160)", maxLength: 160, nullable: true),
                    ToBasketName = table.Column<string>(type: "nvarchar(160)", maxLength: 160, nullable: true),
                    MovedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    MovedByUserId = table.Column<string>(type: "nvarchar(450)", maxLength: 450, nullable: false),
                    MovedByUserName = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: true),
                    Note = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_WorkOrderBasketHistories", x => x.Id);
                    table.ForeignKey(
                        name: "FK_WorkOrderBasketHistories_WorkOrderPlacements_PlacementId",
                        column: x => x.PlacementId,
                        principalTable: "WorkOrderPlacements",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "WorkOrderTaskStates",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    PlacementId = table.Column<int>(type: "int", nullable: false),
                    BasketStableKey = table.Column<int>(type: "int", nullable: false),
                    TaskStableKey = table.Column<int>(type: "int", nullable: false),
                    IsDone = table.Column<bool>(type: "bit", nullable: false),
                    DoneAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    DoneByUserId = table.Column<string>(type: "nvarchar(450)", maxLength: 450, nullable: true),
                    DoneByUserName = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: true),
                    Note = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_WorkOrderTaskStates", x => x.Id);
                    table.ForeignKey(
                        name: "FK_WorkOrderTaskStates_WorkOrderPlacements_PlacementId",
                        column: x => x.PlacementId,
                        principalTable: "WorkOrderPlacements",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            // المهام القائمة تأخذ StableKey = 0 من القيمة الافتراضية، فتتصادم على
            // الفهرس الفريد إن كان في السلة أكثر من مهمة. تُرقَّم هنا داخل كل
            // سلة بترتيبها قبل إنشاء الفهرس.
            migrationBuilder.Sql(@"
                UPDATE t
                SET t.StableKey = n.rn
                FROM BasketTasks AS t
                INNER JOIN (
                    SELECT Id,
                           ROW_NUMBER() OVER (PARTITION BY BasketId ORDER BY SortOrder, Id) AS rn
                    FROM BasketTasks
                ) AS n ON n.Id = t.Id;");

            migrationBuilder.CreateIndex(
                name: "IX_BasketTasks_BasketId_StableKey",
                table: "BasketTasks",
                columns: new[] { "BasketId", "StableKey" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_WorkOrderBasketHistories_PlacementId_MovedAt",
                table: "WorkOrderBasketHistories",
                columns: new[] { "PlacementId", "MovedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_WorkOrderPlacements_ContractId",
                table: "WorkOrderPlacements",
                column: "ContractId");

            migrationBuilder.CreateIndex(
                name: "IX_WorkOrderPlacements_DepartmentId_BasketStableKey",
                table: "WorkOrderPlacements",
                columns: new[] { "DepartmentId", "BasketStableKey" });

            migrationBuilder.CreateIndex(
                name: "IX_WorkOrderPlacements_ProjectTypeCode_WorkOrderId",
                table: "WorkOrderPlacements",
                columns: new[] { "ProjectTypeCode", "WorkOrderId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_WorkOrderTaskStates_PlacementId_BasketStableKey_TaskStableKey",
                table: "WorkOrderTaskStates",
                columns: new[] { "PlacementId", "BasketStableKey", "TaskStableKey" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "WorkOrderBasketHistories");

            migrationBuilder.DropTable(
                name: "WorkOrderTaskStates");

            migrationBuilder.DropTable(
                name: "WorkOrderPlacements");

            migrationBuilder.DropIndex(
                name: "IX_BasketTasks_BasketId_StableKey",
                table: "BasketTasks");

            migrationBuilder.DropColumn(
                name: "StableKey",
                table: "BasketTasks");
        }
    }
}
