-- =====================================================
-- Script: إضافة عمود ContractNumber لجميع الجداول المطلوبة
-- تاريخ: 2026-09-10
-- ملاحظة: استخدم هذا الـ Script إذا لم تُطبَّق الـ Migration تلقائياً
-- =====================================================

-- 1. جدول Constructions
IF NOT EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME = 'Constructions' AND COLUMN_NAME = 'ContractNumber'
)
BEGIN
    ALTER TABLE [dbo].[Constructions] ADD [ContractNumber] NVARCHAR(MAX) NULL;
    PRINT 'Added ContractNumber to Constructions';
END
ELSE
    PRINT 'ContractNumber already exists in Constructions';

-- 2. جدول ConstructionDeleted
IF NOT EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME = 'ConstructionDeleted' AND COLUMN_NAME = 'ContractNumber'
)
BEGIN
    ALTER TABLE [dbo].[ConstructionDeleted] ADD [ContractNumber] NVARCHAR(MAX) NULL;
    PRINT 'Added ContractNumber to ConstructionDeleted';
END
ELSE
    PRINT 'ContractNumber already exists in ConstructionDeleted';

-- 3. جدول Emergencys
IF NOT EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME = 'Emergencys' AND COLUMN_NAME = 'ContractNumber'
)
BEGIN
    ALTER TABLE [dbo].[Emergencys] ADD [ContractNumber] NVARCHAR(MAX) NULL;
    PRINT 'Added ContractNumber to Emergencys';
END
ELSE
    PRINT 'ContractNumber already exists in Emergencys';

-- 4. جدول EmergencyDeleted
IF NOT EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME = 'EmergencyDeleted' AND COLUMN_NAME = 'ContractNumber'
)
BEGIN
    ALTER TABLE [dbo].[EmergencyDeleted] ADD [ContractNumber] NVARCHAR(MAX) NULL;
    PRINT 'Added ContractNumber to EmergencyDeleted';
END
ELSE
    PRINT 'ContractNumber already exists in EmergencyDeleted';

-- 5. جدول Maintenances
IF NOT EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME = 'Maintenances' AND COLUMN_NAME = 'ContractNumber'
)
BEGIN
    ALTER TABLE [dbo].[Maintenances] ADD [ContractNumber] NVARCHAR(MAX) NULL;
    PRINT 'Added ContractNumber to Maintenances';
END
ELSE
    PRINT 'ContractNumber already exists in Maintenances';

-- 6. جدول MaintenanceDeleted
IF NOT EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME = 'MaintenanceDeleted' AND COLUMN_NAME = 'ContractNumber'
)
BEGIN
    ALTER TABLE [dbo].[MaintenanceDeleted] ADD [ContractNumber] NVARCHAR(MAX) NULL;
    PRINT 'Added ContractNumber to MaintenanceDeleted';
END
ELSE
    PRINT 'ContractNumber already exists in MaintenanceDeleted';

-- 7. جدول NewProjects
IF NOT EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME = 'NewProjects' AND COLUMN_NAME = 'ContractNumber'
)
BEGIN
    ALTER TABLE [dbo].[NewProjects] ADD [ContractNumber] NVARCHAR(MAX) NULL;
    PRINT 'Added ContractNumber to NewProjects';
END
ELSE
    PRINT 'ContractNumber already exists in NewProjects';

-- 8. جدول NewProjectDeleted
IF NOT EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME = 'NewProjectDeleted' AND COLUMN_NAME = 'ContractNumber'
)
BEGIN
    ALTER TABLE [dbo].[NewProjectDeleted] ADD [ContractNumber] NVARCHAR(MAX) NULL;
    PRINT 'Added ContractNumber to NewProjectDeleted';
END
ELSE
    PRINT 'ContractNumber already exists in NewProjectDeleted';

-- 9. جدول PrivateProjects
IF NOT EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME = 'PrivateProjects' AND COLUMN_NAME = 'ContractNumber'
)
BEGIN
    ALTER TABLE [dbo].[PrivateProjects] ADD [ContractNumber] NVARCHAR(MAX) NULL;
    PRINT 'Added ContractNumber to PrivateProjects';
END
ELSE
    PRINT 'ContractNumber already exists in PrivateProjects';

-- 10. جدول PrivateProjectDeleted
IF NOT EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME = 'PrivateProjectDeleted' AND COLUMN_NAME = 'ContractNumber'
)
BEGIN
    ALTER TABLE [dbo].[PrivateProjectDeleted] ADD [ContractNumber] NVARCHAR(MAX) NULL;
    PRINT 'Added ContractNumber to PrivateProjectDeleted';
END
ELSE
    PRINT 'ContractNumber already exists in PrivateProjectDeleted';

-- =====================================================
-- تحقق من النتائج
-- =====================================================
SELECT 
    TABLE_NAME,
    COLUMN_NAME,
    DATA_TYPE,
    IS_NULLABLE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE COLUMN_NAME = 'ContractNumber'
ORDER BY TABLE_NAME;
