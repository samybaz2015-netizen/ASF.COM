using ASF.Core.Dtos;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ASF.Core.Services
{
    public interface IDataIntegrityService
    {
        // threshold: أي قيمة أكبر منه تعتبر "مشبوهة" وتترجع للمراجعة (افتراضي: مليون)
        Task<List<SuspiciousValueDto>> GetSuspiciousValuesAsync(decimal threshold = 1_000_000m);

        // بتاخد بالظبط السجلات اللي اتراجعت واتأكد منها، وتحذفها واحدة واحدة
        // عن طريق الـ Delete method الأصلي لكل جدول (مش حذف خام)
        Task<DeleteSuspiciousResultDto> DeleteConfirmedAsync(List<SuspiciousValueRefDto> items);
    }

}
