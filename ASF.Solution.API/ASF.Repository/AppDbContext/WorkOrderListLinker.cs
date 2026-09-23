using ASF.Core.Helpers;
using ASF.Core.Entities;
using ASF.Core.Entities.Workflow;
using Microsoft.EntityFrameworkCore;

namespace ASF.Repository.AppDbContext
{
    /// <summary>
    /// يربط أمر العمل بقيم القوائم عند الحفظ.
    ///
    /// أوامر العمل تُنشأ من مسارات كثيرة — خمس خدمات ومستودع عام واستيراد
    /// إكسل — وكلّها تمرّ بـ <c>SaveChanges</c>. الربط هنا يعني أن لا مسار
    /// يُنسى، ولا يحتاج مسارٌ جديد أن يتذكّر شيئاً.
    ///
    /// ما يجري: الحقل النصّي (الحي، المقاول، نوع أمر العمل) يُطابَق باسمه على
    /// قوائم العقد، ويُحفظ معرّف القيمة بجانبه. فإذا أُعيدت تسمية القيمة لاحقاً
    /// سرى الاسم الجديد على أمر العمل — وهو ما يجعل الشاشات والتقارير متّسقة.
    ///
    /// ما لا يقابله صفٌّ في القائمة يبقى معرّفه فارغاً: النصّ لا يُمسّ ولا
    /// يُخترع له صفّ.
    /// </summary>
    internal static class WorkOrderListLinker
    {
        /// <summary>الحقول الثلاثة وقوائمها.</summary>
        private static readonly (string Category,
            Func<IListLinkedWorkOrder, string?> Read,
            Func<IListLinkedWorkOrder, int?> ReadId,
            Action<IListLinkedWorkOrder, int?> WriteId)[] Links =
        {
            (ContractListCategories.District,
                e => e.District, e => e.DistrictRefId, (e, v) => e.DistrictRefId = v),

            (ContractListCategories.Contractor,
                e => e.Contractor, e => e.ContractorRefId, (e, v) => e.ContractorRefId = v),

            (ContractListCategories.WorkOrderType,
                e => e.WorkOrderType, e => e.WorkOrderTypeRefId, (e, v) => e.WorkOrderTypeRefId = v),
        };

        public static async Task LinkAsync(ApplicationDbContext db, CancellationToken token)
        {
            var pending = db.ChangeTracker.Entries<IListLinkedWorkOrder>()
                .Where(e => e.State == EntityState.Added || e.State == EntityState.Modified)
                .Select(e => e.Entity)
                .ToList();

            if (pending.Count == 0) return;

            // القيم المالية تُقرأ رقماً أولاً — لا تحتاج استعلاماً.
            foreach (var entity in pending)
            {
                entity.EstimatedAmount = AmountText.Parse(entity.EstimatedValue);
                entity.ActualAmount = AmountText.Parse(entity.ActualValue);
            }

            // الأسماء المطلوبة تُجمع أولاً ثم تُقرأ باستعلام واحد: استعلامٌ لكل
            // حقل في كل صف يجعل استيراد ألف أمر عمل ثلاثة آلاف رحلة.
            var wanted = new HashSet<(string Category, string Name)>();

            foreach (var entity in pending)
            {
                foreach (var link in Links)
                {
                    var name = link.Read(entity)?.Trim();
                    if (!string.IsNullOrEmpty(name)) wanted.Add((link.Category, name));
                }
            }

            if (wanted.Count == 0) return;

            var categories = wanted.Select(w => w.Category).Distinct().ToList();
            var names = wanted.Select(w => w.Name).Distinct().ToList();

            var candidates = await db.ContractWorkOrderTypes.AsNoTracking()
                .Where(t => categories.Contains(t.Category) && names.Contains(t.Name))
                .Select(t => new { t.Id, t.Category, t.Name, t.ContractId })
                .ToListAsync(token);

            // عند تشابه الاسم تُفضَّل قيمة العقد على القيمة العامة: الأخصّ أولى.
            var lookup = candidates
                .GroupBy(c => (c.Category, c.Name))
                .ToDictionary(
                    g => g.Key,
                    g => g.OrderBy(c => c.ContractId == null ? 1 : 0).ThenBy(c => c.Id).First().Id);

            foreach (var entity in pending)
            {
                foreach (var link in Links)
                {
                    var name = link.Read(entity)?.Trim();

                    // نصٌّ فارغ لا يُطابَق، ومعرّفه يُمسح: إبقاؤه يربط أمر العمل
                    // بقيمة لم تعد مكتوبة فيه.
                    if (string.IsNullOrEmpty(name))
                    {
                        link.WriteId(entity, null);
                        continue;
                    }

                    if (lookup.TryGetValue((link.Category, name), out var id))
                        link.WriteId(entity, id);
                    else
                        link.WriteId(entity, null);
                }
            }
        }
    }
}
