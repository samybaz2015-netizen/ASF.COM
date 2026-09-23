namespace ASF.Core.Entities
{
    /// <summary>
    /// واجهة مشتركة لجميع كيانات الصور والنماذج عبر أنواع المشاريع.
    /// تمكّن كتابة كود مشترك للتعامل مع الصور (رفع، حذف، عرض).
    /// </summary>
    public interface IProjectPhoto
    {
        int Id { get; set; }
        string Url { get; set; }
    }
}
