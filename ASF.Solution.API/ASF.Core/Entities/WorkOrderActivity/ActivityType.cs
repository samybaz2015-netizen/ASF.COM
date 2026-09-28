namespace ASF.Core.Entities.WorkOrderActivity
{
    /// <summary>
    /// أنواع الأنشطة المسجلة لأمر العمل
    /// </summary>
    public enum ActivityType
    {
        // أحداث الإنشاء والحذف
        CREATED = 1,
        DELETED = 2,
        RESTORED = 3,

        // تغيير الحالة
        STATUS_CHANGED = 10,
        PRIORITY_CHANGED = 11,
        DESCRIPTION_CHANGED = 12,
        WORK_TYPE_CHANGED = 13,

        // العمليات المالية
        FINANCIAL_VALUES_UPDATED = 20,
        PRICING_ITEM_ADDED = 21,
        PRICING_ITEM_REMOVED = 22,
        PRICING_ITEM_QUANTITY_CHANGED = 23,

        // سير العمل
        BASKET_MOVED = 30,
        TASK_COMPLETED = 31,
        TASK_REOPENED = 32,

        // التنفيذ اليومي
        DAILY_EXECUTION_ADDED = 40,
        DAILY_EXECUTION_UPDATED = 41,
        DAILY_EXECUTION_REMOVED = 42,

        // التصريحات والموارد
        RESOURCE_ASSIGNED = 50,
        RESOURCE_UNASSIGNED = 51,
        APPROVAL_GRANTED = 52,
        APPROVAL_REVOKED = 53,

        // التعليقات والذكر
        COMMENT_ADDED = 60,
        COMMENT_EDITED = 61,
        COMMENT_DELETED = 62,
        MENTION_ADDED = 63,

        // المرفقات
        ATTACHMENT_ADDED = 70,
        ATTACHMENT_REMOVED = 71,

        // التنبيهات
        NOTIFICATION_SENT = 80,

        // أخرى
        EXPORTED = 90,
        IMPORTED = 91
    }
}
