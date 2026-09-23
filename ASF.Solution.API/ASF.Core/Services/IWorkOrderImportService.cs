using ASF.Core.DTOs.Workflow;

namespace ASF.Core.Services
{
    /// <summary>
    /// استيراد أوامر العمل من إكسل.
    ///
    /// التحقّق يسبق الكتابة دائماً: يرى المستخدم ما سيُنشأ وما سيُرفض ولماذا
    /// قبل أن يُكتب أي صف.
    /// </summary>
    public interface IWorkOrderImportService
    {
        Task<(WorkOrderImportResultDto? result, string? error)> ImportAsync(
            WorkOrderImportRequestDto request, string userId, string? userName);
    }
}
