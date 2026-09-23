using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ASF.Repository.Migrations.ApplicationDb
{
    /// <inheritdoc />
    public partial class GlobalContractLists : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_ContractWorkOrderTypes_ContractId_DepartmentId_Name",
                table: "ContractWorkOrderTypes");

            migrationBuilder.AlterColumn<int>(
                name: "ContractId",
                table: "WorkflowAuditLogs",
                type: "int",
                nullable: true,
                oldClrType: typeof(int),
                oldType: "int");

            migrationBuilder.AlterColumn<int>(
                name: "ContractId",
                table: "ContractWorkOrderTypes",
                type: "int",
                nullable: true,
                oldClrType: typeof(int),
                oldType: "int");

            // ترحيل القوائم العامة القائمة إلى مصدر واحد.
            //
            // كانت الأحياء والمقاولون وأنواع أوامر العمل في جداول منفصلة تقرأ
            // منها شاشات الإدخال، بينما تُدار القوائم في إعدادات العقد — فما
            // يُضاف هناك لا يظهر هنا. تُنسخ الصفوف قيماً عامة (بلا عقد) فتُرى
            // في كل العقود، وتبقى الجداول القديمة كما هي للقراءة.
            //
            // NOT EXISTS يجعلها قابلة للتكرار: إعادة تشغيلها لا تُضاعف صفاً.
            migrationBuilder.Sql(@"
                INSERT INTO ContractWorkOrderTypes
                    (ContractId, DepartmentId, Category, Name, SortOrder, IsActive, CreatedAt)
                SELECT NULL, NULL, 'District', src.Name,
                       ROW_NUMBER() OVER (ORDER BY src.Name), 1, GETUTCDATE()
                FROM (
                    -- التجميع بالاسم: الجدول القديم قد يحمل الاسم مرّتين
                    -- بفروق مسافات، والفهرس الفريد يرفض المكرّر.
                    SELECT LTRIM(RTRIM(n.Name)) AS Name
                    FROM Neighborhoods n
                    WHERE LTRIM(RTRIM(ISNULL(n.Name,''))) <> ''
                    GROUP BY LTRIM(RTRIM(n.Name))
                ) src
                WHERE NOT EXISTS (
                        SELECT 1 FROM ContractWorkOrderTypes x
                        WHERE x.Category = 'District'
                          AND x.ContractId IS NULL AND x.DepartmentId IS NULL
                          AND x.Name = src.Name);");

            migrationBuilder.Sql(@"
                INSERT INTO ContractWorkOrderTypes
                    (ContractId, DepartmentId, Category, Name, SortOrder, IsActive, CreatedAt)
                SELECT NULL, NULL, 'Contractor', src.Name,
                       ROW_NUMBER() OVER (ORDER BY src.Name), 1, GETUTCDATE()
                FROM (
                    -- التجميع بالاسم: الجدول القديم قد يحمل الاسم مرّتين
                    -- بفروق مسافات، والفهرس الفريد يرفض المكرّر.
                    SELECT LTRIM(RTRIM(c.Name)) AS Name
                    FROM Contractors c
                    WHERE LTRIM(RTRIM(ISNULL(c.Name,''))) <> ''
                    GROUP BY LTRIM(RTRIM(c.Name))
                ) src
                WHERE NOT EXISTS (
                        SELECT 1 FROM ContractWorkOrderTypes x
                        WHERE x.Category = 'Contractor'
                          AND x.ContractId IS NULL AND x.DepartmentId IS NULL
                          AND x.Name = src.Name);");

            migrationBuilder.Sql(@"
                INSERT INTO ContractWorkOrderTypes
                    (ContractId, DepartmentId, Category, Name, SortOrder, IsActive, CreatedAt)
                SELECT NULL, NULL, 'WorkOrderType', src.Name,
                       ROW_NUMBER() OVER (ORDER BY src.Name), 1, GETUTCDATE()
                FROM (
                    -- التجميع بالاسم: الجدول القديم قد يحمل الاسم مرّتين
                    -- بفروق مسافات، والفهرس الفريد يرفض المكرّر.
                    SELECT LTRIM(RTRIM(w.Name)) AS Name
                    FROM WorkOrderTypes w
                    WHERE LTRIM(RTRIM(ISNULL(w.Name,''))) <> ''
                    GROUP BY LTRIM(RTRIM(w.Name))
                ) src
                WHERE NOT EXISTS (
                        SELECT 1 FROM ContractWorkOrderTypes x
                        WHERE x.Category = 'WorkOrderType'
                          AND x.ContractId IS NULL AND x.DepartmentId IS NULL
                          AND x.Name = src.Name);");

            migrationBuilder.CreateIndex(
                name: "IX_ContractWorkOrderTypes_ContractId_DepartmentId_Category_Name",
                table: "ContractWorkOrderTypes",
                columns: new[] { "ContractId", "DepartmentId", "Category", "Name" },
                unique: true,
                filter: "[ContractId] IS NOT NULL AND [DepartmentId] IS NOT NULL");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_ContractWorkOrderTypes_ContractId_DepartmentId_Category_Name",
                table: "ContractWorkOrderTypes");

            migrationBuilder.AlterColumn<int>(
                name: "ContractId",
                table: "WorkflowAuditLogs",
                type: "int",
                nullable: false,
                defaultValue: 0,
                oldClrType: typeof(int),
                oldType: "int",
                oldNullable: true);

            migrationBuilder.AlterColumn<int>(
                name: "ContractId",
                table: "ContractWorkOrderTypes",
                type: "int",
                nullable: false,
                defaultValue: 0,
                oldClrType: typeof(int),
                oldType: "int",
                oldNullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_ContractWorkOrderTypes_ContractId_DepartmentId_Name",
                table: "ContractWorkOrderTypes",
                columns: new[] { "ContractId", "DepartmentId", "Name" },
                unique: true,
                filter: "[DepartmentId] IS NOT NULL");
        }
    }
}
