-- ============================================
-- إضافة جداول سجل نشاط أمر العمل
-- Migration: Work Order Activity Log Tables
-- ============================================

-- جدول النشاطات الرئيسي
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[WorkOrderActivities]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[WorkOrderActivities] (
        [Id] INT NOT NULL IDENTITY(1,1),
        [WorkOrderId] INT NOT NULL,
        [ActivityType] INT NOT NULL,
        [Description] NVARCHAR(MAX) NULL,
        [OldValues] NVARCHAR(MAX) NULL,
        [NewValues] NVARCHAR(MAX) NULL,
        [UserId] NVARCHAR(450) NOT NULL,
        [CreatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        [IsDeleted] BIT NOT NULL DEFAULT 0,

        PRIMARY KEY CLUSTERED ([Id] ASC),

        CONSTRAINT [FK_WorkOrderActivities_AspNetUsers_UserId]
            FOREIGN KEY ([UserId]) REFERENCES [AspNetUsers]([Id]) ON DELETE RESTRICT
    );

    -- الفهارس
    CREATE NONCLUSTERED INDEX [IX_WorkOrderActivity_WorkOrderId_CreatedAt]
        ON [dbo].[WorkOrderActivities]([WorkOrderId] ASC, [CreatedAt] DESC);

    CREATE NONCLUSTERED INDEX [IX_WorkOrderActivity_UserId_CreatedAt]
        ON [dbo].[WorkOrderActivities]([UserId] ASC, [CreatedAt] DESC);

    CREATE NONCLUSTERED INDEX [IX_WorkOrderActivity_ActivityType]
        ON [dbo].[WorkOrderActivities]([ActivityType] ASC);
END;

-- جدول التعليقات
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[WorkOrderComments]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[WorkOrderComments] (
        [Id] INT NOT NULL IDENTITY(1,1),
        [WorkOrderId] INT NOT NULL,
        [ParentCommentId] INT NULL,
        [Content] NVARCHAR(MAX) NOT NULL,
        [CreatedByUserId] NVARCHAR(450) NOT NULL,
        [CreatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        [UpdatedByUserId] NVARCHAR(450) NULL,
        [UpdatedAt] DATETIME2 NULL,
        [IsDeleted] BIT NOT NULL DEFAULT 0,
        [IsPinned] BIT NOT NULL DEFAULT 0,
        [LikesCount] INT NOT NULL DEFAULT 0,

        PRIMARY KEY CLUSTERED ([Id] ASC),

        CONSTRAINT [FK_WorkOrderComments_AspNetUsers_CreatedByUserId]
            FOREIGN KEY ([CreatedByUserId]) REFERENCES [AspNetUsers]([Id]) ON DELETE RESTRICT,
        CONSTRAINT [FK_WorkOrderComments_AspNetUsers_UpdatedByUserId]
            FOREIGN KEY ([UpdatedByUserId]) REFERENCES [AspNetUsers]([Id]) ON DELETE RESTRICT,
        CONSTRAINT [FK_WorkOrderComments_WorkOrderComments_ParentCommentId]
            FOREIGN KEY ([ParentCommentId]) REFERENCES [WorkOrderComments]([Id]) ON DELETE CASCADE
    );

    -- الفهارس
    CREATE NONCLUSTERED INDEX [IX_WorkOrderComment_WorkOrderId_CreatedAt]
        ON [dbo].[WorkOrderComments]([WorkOrderId] ASC, [CreatedAt] DESC);

    CREATE NONCLUSTERED INDEX [IX_WorkOrderComment_CreatedByUserId]
        ON [dbo].[WorkOrderComments]([CreatedByUserId] ASC);

    CREATE NONCLUSTERED INDEX [IX_WorkOrderComment_ParentCommentId]
        ON [dbo].[WorkOrderComments]([ParentCommentId] ASC);
END;

-- جدول الذكرات
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[WorkOrderMentions]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[WorkOrderMentions] (
        [Id] INT NOT NULL IDENTITY(1,1),
        [CommentId] INT NOT NULL,
        [WorkOrderId] INT NOT NULL,
        [MentionedUserId] NVARCHAR(450) NOT NULL,
        [CreatedByUserId] NVARCHAR(450) NOT NULL,
        [CreatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        [NotificationId] INT NULL,
        [IsRead] BIT NOT NULL DEFAULT 0,
        [ReadAt] DATETIME2 NULL,

        PRIMARY KEY CLUSTERED ([Id] ASC),

        CONSTRAINT [FK_WorkOrderMentions_WorkOrderComments_CommentId]
            FOREIGN KEY ([CommentId]) REFERENCES [WorkOrderComments]([Id]) ON DELETE CASCADE,
        CONSTRAINT [FK_WorkOrderMentions_AspNetUsers_MentionedUserId]
            FOREIGN KEY ([MentionedUserId]) REFERENCES [AspNetUsers]([Id]) ON DELETE RESTRICT,
        CONSTRAINT [FK_WorkOrderMentions_AspNetUsers_CreatedByUserId]
            FOREIGN KEY ([CreatedByUserId]) REFERENCES [AspNetUsers]([Id]) ON DELETE RESTRICT,
        CONSTRAINT [FK_WorkOrderMentions_Notifications_NotificationId]
            FOREIGN KEY ([NotificationId]) REFERENCES [Notifications]([Id]) ON DELETE SET NULL
    );

    -- الفهارس
    CREATE NONCLUSTERED INDEX [IX_WorkOrderMention_WorkOrderId_MentionedUserId]
        ON [dbo].[WorkOrderMentions]([WorkOrderId] ASC, [MentionedUserId] ASC);

    CREATE NONCLUSTERED INDEX [IX_WorkOrderMention_CommentId]
        ON [dbo].[WorkOrderMentions]([CommentId] ASC);

    CREATE NONCLUSTERED INDEX [IX_WorkOrderMention_MentionedUserId]
        ON [dbo].[WorkOrderMentions]([MentionedUserId] ASC);
END;

-- جدول المرفقات
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[WorkOrderCommentAttachments]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[WorkOrderCommentAttachments] (
        [Id] INT NOT NULL IDENTITY(1,1),
        [CommentId] INT NOT NULL,
        [WorkOrderId] INT NOT NULL,
        [FileName] NVARCHAR(MAX) NOT NULL,
        [FileType] NVARCHAR(100) NOT NULL,
        [FileSize] BIGINT NOT NULL,
        [FilePath] NVARCHAR(MAX) NOT NULL,
        [FileUrl] NVARCHAR(MAX) NULL,
        [CreatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        [IsDeleted] BIT NOT NULL DEFAULT 0,

        PRIMARY KEY CLUSTERED ([Id] ASC),

        CONSTRAINT [FK_WorkOrderCommentAttachments_WorkOrderComments_CommentId]
            FOREIGN KEY ([CommentId]) REFERENCES [WorkOrderComments]([Id]) ON DELETE CASCADE
    );

    -- الفهارس
    CREATE NONCLUSTERED INDEX [IX_WorkOrderCommentAttachment_CommentId]
        ON [dbo].[WorkOrderCommentAttachments]([CommentId] ASC);

    CREATE NONCLUSTERED INDEX [IX_WorkOrderCommentAttachment_WorkOrderId]
        ON [dbo].[WorkOrderCommentAttachments]([WorkOrderId] ASC);
END;

-- جدول حالة القراءة
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[WorkOrderActivityReadStatuses]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[WorkOrderActivityReadStatuses] (
        [Id] INT NOT NULL IDENTITY(1,1),
        [ActivityId] INT NOT NULL,
        [WorkOrderId] INT NOT NULL,
        [UserId] NVARCHAR(450) NOT NULL,
        [ReadAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),

        PRIMARY KEY CLUSTERED ([Id] ASC),

        CONSTRAINT [FK_WorkOrderActivityReadStatuses_WorkOrderActivities_ActivityId]
            FOREIGN KEY ([ActivityId]) REFERENCES [WorkOrderActivities]([Id]) ON DELETE CASCADE,
        CONSTRAINT [FK_WorkOrderActivityReadStatuses_AspNetUsers_UserId]
            FOREIGN KEY ([UserId]) REFERENCES [AspNetUsers]([Id]) ON DELETE CASCADE,

        CONSTRAINT [UQ_WorkOrderActivityReadStatus_ActivityId_UserId]
            UNIQUE ([ActivityId], [UserId])
    );

    -- الفهارس
    CREATE NONCLUSTERED INDEX [IX_WorkOrderActivityReadStatus_WorkOrderId_UserId]
        ON [dbo].[WorkOrderActivityReadStatuses]([WorkOrderId] ASC, [UserId] ASC);
END;

-- رسالة التأكيد
PRINT 'تم إضافة جداول سجل نشاط أمر العمل بنجاح';
