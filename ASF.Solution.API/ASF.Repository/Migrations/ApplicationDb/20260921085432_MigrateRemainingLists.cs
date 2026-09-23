using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ASF.Repository.Migrations.ApplicationDb
{
    /// <inheritdoc />
    public partial class MigrateRemainingLists : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // ترحيل بقية القوائم العامة إلى المصدر الموحّد.
            //
            // نفس ما جرى للأحياء والمقاولين وأنواع أوامر العمل: تُنسخ الصفوف
            // قيماً عامة (بلا عقد) فتُرى في كل العقود، وتبقى الجداول القديمة
            // كما هي للقراءة — لا حذف.
            //
            // التجميع بالاسم يمنع المكرّر، و NOT EXISTS يجعلها قابلة للإعادة.

            migrationBuilder.Sql(@"
                INSERT INTO ContractWorkOrderTypes
                    (ContractId, DepartmentId, Category, Name, SortOrder, IsActive, CreatedAt)
                SELECT NULL, NULL, 'Consultant', src.Name,
                       ROW_NUMBER() OVER (ORDER BY src.Name), 1, GETUTCDATE()
                FROM (
                    SELECT LTRIM(RTRIM(c.Name)) AS Name
                    FROM Consultants c
                    WHERE LTRIM(RTRIM(ISNULL(c.Name,''))) <> ''
                    GROUP BY LTRIM(RTRIM(c.Name))
                ) src
                WHERE NOT EXISTS (
                        SELECT 1 FROM ContractWorkOrderTypes x
                        WHERE x.Category = 'Consultant'
                          AND x.ContractId IS NULL AND x.DepartmentId IS NULL
                          AND x.Name = src.Name);");

            migrationBuilder.Sql(@"
                INSERT INTO ContractWorkOrderTypes
                    (ContractId, DepartmentId, Category, Name, SortOrder, IsActive, CreatedAt)
                SELECT NULL, NULL, 'Office', src.Name,
                       ROW_NUMBER() OVER (ORDER BY src.Name), 1, GETUTCDATE()
                FROM (
                    SELECT LTRIM(RTRIM(o.Name)) AS Name
                    FROM Offices o
                    WHERE LTRIM(RTRIM(ISNULL(o.Name,''))) <> ''
                    GROUP BY LTRIM(RTRIM(o.Name))
                ) src
                WHERE NOT EXISTS (
                        SELECT 1 FROM ContractWorkOrderTypes x
                        WHERE x.Category = 'Office'
                          AND x.ContractId IS NULL AND x.DepartmentId IS NULL
                          AND x.Name = src.Name);");

            migrationBuilder.Sql(@"
                INSERT INTO ContractWorkOrderTypes
                    (ContractId, DepartmentId, Category, Name, SortOrder, IsActive, CreatedAt)
                SELECT NULL, NULL, 'ProjectOwner', src.Name,
                       ROW_NUMBER() OVER (ORDER BY src.Name), 1, GETUTCDATE()
                FROM (
                    SELECT LTRIM(RTRIM(w.Name)) AS Name
                    FROM ProjectOwners w
                    WHERE LTRIM(RTRIM(ISNULL(w.Name,''))) <> ''
                    GROUP BY LTRIM(RTRIM(w.Name))
                ) src
                WHERE NOT EXISTS (
                        SELECT 1 FROM ContractWorkOrderTypes x
                        WHERE x.Category = 'ProjectOwner'
                          AND x.ContractId IS NULL AND x.DepartmentId IS NULL
                          AND x.Name = src.Name);");

            migrationBuilder.Sql(@"
                INSERT INTO ContractWorkOrderTypes
                    (ContractId, DepartmentId, Category, Name, SortOrder, IsActive, CreatedAt)
                SELECT NULL, NULL, 'ProjectParty', src.Name,
                       ROW_NUMBER() OVER (ORDER BY src.Name), 1, GETUTCDATE()
                FROM (
                    SELECT LTRIM(RTRIM(y.Name)) AS Name
                    FROM ProjectParties y
                    WHERE LTRIM(RTRIM(ISNULL(y.Name,''))) <> ''
                    GROUP BY LTRIM(RTRIM(y.Name))
                ) src
                WHERE NOT EXISTS (
                        SELECT 1 FROM ContractWorkOrderTypes x
                        WHERE x.Category = 'ProjectParty'
                          AND x.ContractId IS NULL AND x.DepartmentId IS NULL
                          AND x.Name = src.Name);");

        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {

        }
    }
}
