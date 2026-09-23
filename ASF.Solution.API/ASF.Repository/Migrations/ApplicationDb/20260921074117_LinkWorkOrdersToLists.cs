using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ASF.Repository.Migrations.ApplicationDb
{
    /// <inheritdoc />
    public partial class LinkWorkOrdersToLists : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "ContractorRefId",
                table: "NewProjects",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "DistrictRefId",
                table: "NewProjects",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "WorkOrderTypeRefId",
                table: "NewProjects",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "ContractorRefId",
                table: "Maintenances",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "DistrictRefId",
                table: "Maintenances",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "WorkOrderTypeRefId",
                table: "Maintenances",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "ContractorRefId",
                table: "Emergencys",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "DistrictRefId",
                table: "Emergencys",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "WorkOrderTypeRefId",
                table: "Emergencys",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "ContractorRefId",
                table: "Constructions",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "DistrictRefId",
                table: "Constructions",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "WorkOrderTypeRefId",
                table: "Constructions",
                type: "int",
                nullable: true);

            // تعبئة المعرّفات من الأسماء المكتوبة.
            //
            // المطابقة بالاسم بعد تشذيب المسافات، ومرّة واحدة فقط: بعدها تصير
            // المطابقة بالمعرّف. ما لا يقابله صفٌّ في القائمة يبقى فارغاً —
            // لا يُخترع له صفّ ولا يُحذف نصّه.
            //
            // تُفضَّل قيمة العقد على القيمة العامة عند تشابه الاسم، لأن الأولى
            // أخصّ. و TOP 1 يمنع سقوط التحديث عند وجود أكثر من مرشّح.
            migrationBuilder.Sql(@"
                UPDATE t SET t.DistrictRefId = (
                    SELECT TOP 1 x.Id FROM ContractWorkOrderTypes x
                    WHERE x.Category = 'District'
                      AND x.Name = LTRIM(RTRIM(t.District))
                    ORDER BY CASE WHEN x.ContractId IS NULL THEN 1 ELSE 0 END, x.Id)
                FROM Constructions t
                WHERE t.DistrictRefId IS NULL
                  AND LTRIM(RTRIM(ISNULL(t.District,''))) <> '';");

            migrationBuilder.Sql(@"
                UPDATE t SET t.ContractorRefId = (
                    SELECT TOP 1 x.Id FROM ContractWorkOrderTypes x
                    WHERE x.Category = 'Contractor'
                      AND x.Name = LTRIM(RTRIM(t.Contractor))
                    ORDER BY CASE WHEN x.ContractId IS NULL THEN 1 ELSE 0 END, x.Id)
                FROM Constructions t
                WHERE t.ContractorRefId IS NULL
                  AND LTRIM(RTRIM(ISNULL(t.Contractor,''))) <> '';");

            migrationBuilder.Sql(@"
                UPDATE t SET t.WorkOrderTypeRefId = (
                    SELECT TOP 1 x.Id FROM ContractWorkOrderTypes x
                    WHERE x.Category = 'WorkOrderType'
                      AND x.Name = LTRIM(RTRIM(t.WorkOrderType))
                    ORDER BY CASE WHEN x.ContractId IS NULL THEN 1 ELSE 0 END, x.Id)
                FROM Constructions t
                WHERE t.WorkOrderTypeRefId IS NULL
                  AND LTRIM(RTRIM(ISNULL(t.WorkOrderType,''))) <> '';");

            migrationBuilder.Sql(@"
                UPDATE t SET t.DistrictRefId = (
                    SELECT TOP 1 x.Id FROM ContractWorkOrderTypes x
                    WHERE x.Category = 'District'
                      AND x.Name = LTRIM(RTRIM(t.District))
                    ORDER BY CASE WHEN x.ContractId IS NULL THEN 1 ELSE 0 END, x.Id)
                FROM Emergencys t
                WHERE t.DistrictRefId IS NULL
                  AND LTRIM(RTRIM(ISNULL(t.District,''))) <> '';");

            migrationBuilder.Sql(@"
                UPDATE t SET t.ContractorRefId = (
                    SELECT TOP 1 x.Id FROM ContractWorkOrderTypes x
                    WHERE x.Category = 'Contractor'
                      AND x.Name = LTRIM(RTRIM(t.Contractor))
                    ORDER BY CASE WHEN x.ContractId IS NULL THEN 1 ELSE 0 END, x.Id)
                FROM Emergencys t
                WHERE t.ContractorRefId IS NULL
                  AND LTRIM(RTRIM(ISNULL(t.Contractor,''))) <> '';");

            migrationBuilder.Sql(@"
                UPDATE t SET t.WorkOrderTypeRefId = (
                    SELECT TOP 1 x.Id FROM ContractWorkOrderTypes x
                    WHERE x.Category = 'WorkOrderType'
                      AND x.Name = LTRIM(RTRIM(t.WorkOrderType))
                    ORDER BY CASE WHEN x.ContractId IS NULL THEN 1 ELSE 0 END, x.Id)
                FROM Emergencys t
                WHERE t.WorkOrderTypeRefId IS NULL
                  AND LTRIM(RTRIM(ISNULL(t.WorkOrderType,''))) <> '';");

            migrationBuilder.Sql(@"
                UPDATE t SET t.DistrictRefId = (
                    SELECT TOP 1 x.Id FROM ContractWorkOrderTypes x
                    WHERE x.Category = 'District'
                      AND x.Name = LTRIM(RTRIM(t.District))
                    ORDER BY CASE WHEN x.ContractId IS NULL THEN 1 ELSE 0 END, x.Id)
                FROM Maintenances t
                WHERE t.DistrictRefId IS NULL
                  AND LTRIM(RTRIM(ISNULL(t.District,''))) <> '';");

            migrationBuilder.Sql(@"
                UPDATE t SET t.ContractorRefId = (
                    SELECT TOP 1 x.Id FROM ContractWorkOrderTypes x
                    WHERE x.Category = 'Contractor'
                      AND x.Name = LTRIM(RTRIM(t.Contractor))
                    ORDER BY CASE WHEN x.ContractId IS NULL THEN 1 ELSE 0 END, x.Id)
                FROM Maintenances t
                WHERE t.ContractorRefId IS NULL
                  AND LTRIM(RTRIM(ISNULL(t.Contractor,''))) <> '';");

            migrationBuilder.Sql(@"
                UPDATE t SET t.WorkOrderTypeRefId = (
                    SELECT TOP 1 x.Id FROM ContractWorkOrderTypes x
                    WHERE x.Category = 'WorkOrderType'
                      AND x.Name = LTRIM(RTRIM(t.WorkOrderType))
                    ORDER BY CASE WHEN x.ContractId IS NULL THEN 1 ELSE 0 END, x.Id)
                FROM Maintenances t
                WHERE t.WorkOrderTypeRefId IS NULL
                  AND LTRIM(RTRIM(ISNULL(t.WorkOrderType,''))) <> '';");

            migrationBuilder.Sql(@"
                UPDATE t SET t.DistrictRefId = (
                    SELECT TOP 1 x.Id FROM ContractWorkOrderTypes x
                    WHERE x.Category = 'District'
                      AND x.Name = LTRIM(RTRIM(t.District))
                    ORDER BY CASE WHEN x.ContractId IS NULL THEN 1 ELSE 0 END, x.Id)
                FROM NewProjects t
                WHERE t.DistrictRefId IS NULL
                  AND LTRIM(RTRIM(ISNULL(t.District,''))) <> '';");

            migrationBuilder.Sql(@"
                UPDATE t SET t.ContractorRefId = (
                    SELECT TOP 1 x.Id FROM ContractWorkOrderTypes x
                    WHERE x.Category = 'Contractor'
                      AND x.Name = LTRIM(RTRIM(t.Contractor))
                    ORDER BY CASE WHEN x.ContractId IS NULL THEN 1 ELSE 0 END, x.Id)
                FROM NewProjects t
                WHERE t.ContractorRefId IS NULL
                  AND LTRIM(RTRIM(ISNULL(t.Contractor,''))) <> '';");

            migrationBuilder.Sql(@"
                UPDATE t SET t.WorkOrderTypeRefId = (
                    SELECT TOP 1 x.Id FROM ContractWorkOrderTypes x
                    WHERE x.Category = 'WorkOrderType'
                      AND x.Name = LTRIM(RTRIM(t.WorkOrderType))
                    ORDER BY CASE WHEN x.ContractId IS NULL THEN 1 ELSE 0 END, x.Id)
                FROM NewProjects t
                WHERE t.WorkOrderTypeRefId IS NULL
                  AND LTRIM(RTRIM(ISNULL(t.WorkOrderType,''))) <> '';");

        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ContractorRefId",
                table: "NewProjects");

            migrationBuilder.DropColumn(
                name: "DistrictRefId",
                table: "NewProjects");

            migrationBuilder.DropColumn(
                name: "WorkOrderTypeRefId",
                table: "NewProjects");

            migrationBuilder.DropColumn(
                name: "ContractorRefId",
                table: "Maintenances");

            migrationBuilder.DropColumn(
                name: "DistrictRefId",
                table: "Maintenances");

            migrationBuilder.DropColumn(
                name: "WorkOrderTypeRefId",
                table: "Maintenances");

            migrationBuilder.DropColumn(
                name: "ContractorRefId",
                table: "Emergencys");

            migrationBuilder.DropColumn(
                name: "DistrictRefId",
                table: "Emergencys");

            migrationBuilder.DropColumn(
                name: "WorkOrderTypeRefId",
                table: "Emergencys");

            migrationBuilder.DropColumn(
                name: "ContractorRefId",
                table: "Constructions");

            migrationBuilder.DropColumn(
                name: "DistrictRefId",
                table: "Constructions");

            migrationBuilder.DropColumn(
                name: "WorkOrderTypeRefId",
                table: "Constructions");
        }
    }
}
