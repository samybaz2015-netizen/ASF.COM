using ASF.Core.DTOs.Workflow;

namespace ASF.Core.Services
{
    /// <summary>
    /// حركة أمر العمل داخل مسار السلال.
    ///
    /// الموقع يُحفظ بالمفتاح الثابت للسلة، فاعتماد نسخة جديدة من المسار لا
    /// ينقل أمر عمل من سلته ولا يُلغي ما أُنجز من مهامه.
    /// </summary>
    public interface IWorkOrderFlowService
    {
        /// <summary>موقع أمر العمل، أو null إن لم يدخل المسار بعد.</summary>
        Task<PlacementDto?> GetPlacementAsync(string projectTypeCode, int workOrderId);

        /// <summary>يُدخل أمر العمل المسار ويضعه في أول سلة مفعّلة.</summary>
        Task<(PlacementDto? placement, string? error)> EnterWorkflowAsync(
            EnterWorkflowDto dto, string userId, string? userName);

        /// <summary>ينقل أمر العمل إلى سلة أخرى بعد التحقّق من شروط الخروج.</summary>
        Task<(PlacementDto? placement, string? error)> MoveAsync(
            string projectTypeCode, int workOrderId, MoveWorkOrderDto dto, string userId, string? userName);

        /// <summary>يعلّم مهمة منجزة أو يرفع الإنجاز عنها.</summary>
        Task<(PlacementDto? placement, string? error)> SetTaskStateAsync(
            string projectTypeCode, int workOrderId, SetTaskStateDto dto, string userId, string? userName);

        /// <summary>
        /// يُدخل أمر عمل أُنشئ للتوّ في أول سلة من مسار عقده، بلا أي تدخّل.
        ///
        /// لا ترمي هذه الدالة أبداً: تعذّر تحديد العقد أو غياب مسار معتمد لا يجوز
        /// أن يُفشل إنشاء أمر العمل. تعيد سبب التخطّي ليُسجَّل فقط.
        /// </summary>
        Task<string?> AutoEnterAsync(string projectTypeCode, int workOrderId,
            string? contractNumber, string userId, string? userName);

        Task<List<BasketHistoryDto>> GetHistoryAsync(string projectTypeCode, int workOrderId);

        // ───── متابعة التنفيذ ─────

        /// <summary>
        /// أقسام متابعة التنفيذ التي يراها هذا المستخدم، بسلالها وأعدادها.
        /// مقيَّدة بنطاق بياناته: مستخدم بلا نطاق يرى كل شيء.
        /// </summary>
        Task<List<TrackingDepartmentDto>> GetTrackingAsync(string userId, string? projectTypeCode);

        /// <summary>
        /// بحث أوامر العمل عبر كل السلال بفلتر عام: العقد والنوع وتاريخ الاستلام
        /// وبحث حر. مقيَّد بنطاق المستخدم.
        /// </summary>
        Task<List<TrackedWorkOrderDto>> SearchAsync(TrackingFilterDto filter, string userId);

        /// <summary>
        /// صفوف التصدير بكل تفاصيل أمر العمل.
        ///
        /// تُبنى من نفس الفلتر والصلاحية اللذين يبنيان الجدول، فلا يحمل الملف
        /// المصدَّر صفاً خارج ما يحقّ للمستخدم رؤيته.
        /// </summary>
        Task<List<WorkOrderExportRowDto>> ExportAsync(TrackingFilterDto filter, string userId);

        /// <summary>أوامر العمل داخل سلة، مقيَّدة بنطاق المستخدم.</summary>
        Task<(List<TrackedWorkOrderDto>? items, string? error)> GetBasketWorkOrdersAsync(
            int departmentId, int basketStableKey, string userId);

        // ───── نطاق بيانات المستخدم ─────

        Task<List<UserScopeDto>> GetUserScopesAsync(string targetUserId);

        Task<(UserScopeDto? scope, string? error)> AddUserScopeAsync(
            string targetUserId, SetUserScopeDto dto, string adminUserId);

        Task<bool> RemoveUserScopeAsync(int scopeId);

        /// <summary>هل يملك المستخدم صلاحية رؤية هذا القسم؟</summary>
        Task<bool> CanSeeDepartmentAsync(string userId, int departmentId);

        /// <summary>
        /// عدد أوامر عمل القسم التي لم تدخل أي سلة بعد.
        /// </summary>
        Task<int> CountUnplacedAsync(int departmentId);

        /// <summary>
        /// يضع كل أمر عمل للقسم لم يدخل سلة بعد في أول سلة من المسار المعتمد.
        /// يعيد عدد ما وُضع.
        /// </summary>
        Task<int> PlaceUnplacedAsync(int departmentId, bool includeUnassigned,
            string userId, string? userName);

        /// <summary>توزيع أوامر العمل على سلال قسم — لوحة التحميل.</summary>
        Task<List<BasketLoadDto>> GetBasketLoadAsync(int departmentId);

        /// <summary>
        /// ترحيل أوامر العمل القائمة من Situation النصّي إلى السلال.
        /// يُعاين أولاً ولا يكتب إلا حين DryRun = false.
        /// </summary>
        Task<(BackfillResultDto? result, string? error)> BackfillAsync(
            BackfillRequestDto dto, string userId, string? userName);
    }
}
