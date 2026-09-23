using ASF.Core.DTOs.Workflow;

namespace ASF.Core.Services
{
    /// <summary>
    /// إدارة الأقسام والسلال من إعدادات العقد.
    ///
    /// كل تعديل يجري على مسودة المسار، ولا يراه التشغيل حتى تُعتمد (Publish).
    /// أوامر العمل ترتبط بمعرّف السلة لا باسمها، فإعادة التسمية أو الترتيب لا
    /// تغيّر موقع أمر عمل قائم.
    /// </summary>
    public interface IContractWorkflowService
    {
        // العقود
        Task<List<ContractDto>> GetContractsAsync(bool includeInactive);
        Task<ContractDto?> GetContractAsync(int contractId);
        Task<ContractDto> CreateContractAsync(ContractUpsertDto dto, string userId, string? userName);
        Task<ContractDto?> UpdateContractAsync(int contractId, ContractUpsertDto dto, string userId, string? userName);

        // الأقسام
        Task<List<DepartmentDto>> GetDepartmentsAsync(int contractId, bool includeInactive);
        Task<DepartmentDto> CreateDepartmentAsync(int contractId, DepartmentUpsertDto dto, string userId, string? userName);
        Task<DepartmentDto?> UpdateDepartmentAsync(int departmentId, DepartmentUpsertDto dto, string userId, string? userName);
        Task<bool> ReorderDepartmentsAsync(int contractId, ReorderDto dto, string userId, string? userName);

        // المسار
        /// <summary>
        /// يعيد مسودة القسم، وينشئها من النسخة المنشورة إن لم تكن موجودة.
        /// </summary>
        Task<WorkflowDto?> GetOrCreateDraftAsync(int departmentId, string userId, string? userName);

        /// <summary>النسخة المنشورة — هي المسار الذي يعمل عليه النظام.</summary>
        Task<WorkflowDto?> GetPublishedAsync(int departmentId);

        Task<WorkflowPreviewDto?> PreviewAsync(int workflowId);

        /// <summary>يعتمد المسودة: تصير منشورة وتُؤرشف النسخة السابقة.</summary>
        Task<WorkflowDto?> PublishAsync(int workflowId, string userId, string? userName, string? note);

        // السلال المقترحة
        /// <summary>قالب السلال المقترحة للقسم، أو null إن لم يكن لنوعه قالب.</summary>
        Task<BasketTemplateDto?> GetTemplateAsync(int departmentId);

        /// <summary>يطبّق القالب على مسودة فارغة. يرفض إن كانت المسودة تحمل سلالاً.</summary>
        Task<(WorkflowDto? workflow, string? error)> ApplyTemplateAsync(
            int departmentId, string userId, string? userName);

        // السلال
        Task<BasketDto?> AddBasketAsync(int workflowId, BasketUpsertDto dto, string userId, string? userName);
        /// <summary>
        /// يعدّل سلة. يرفض تعطيل سلة تحمل أوامر عمل (البند 6).
        /// </summary>
        Task<(BasketDto? basket, string? error)> UpdateBasketAsync(
            int basketId, BasketUpsertDto dto, string userId, string? userName);
        Task<bool> ReorderBasketsAsync(int workflowId, ReorderDto dto, string userId, string? userName);
        Task<(bool ok, string? error)> DeleteBasketAsync(int basketId, string userId, string? userName);

        // مهام السلة
        Task<BasketTaskDto?> AddTaskAsync(int basketId, BasketTaskUpsertDto dto, string userId, string? userName);
        Task<BasketTaskDto?> UpdateTaskAsync(int taskId, BasketTaskUpsertDto dto, string userId, string? userName);
        Task<bool> ReorderTasksAsync(int basketId, ReorderDto dto, string userId, string? userName);
        Task<bool> DeleteTaskAsync(int taskId, string userId, string? userName);

        // سجل التغييرات
        Task<List<WorkflowAuditLogDto>> GetAuditLogAsync(int contractId, int? departmentId, int take);
    }
}
