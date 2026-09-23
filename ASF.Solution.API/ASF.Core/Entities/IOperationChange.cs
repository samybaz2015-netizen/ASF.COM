namespace ASF.Core.Entities
{
    /// <summary>
    /// واجهة مشتركة لجميع كيانات تتبع التغييرات (OperationChangeFor*).
    /// تُمكّن BaseProjectService من التعامل مع التغييرات بشكل عام.
    /// </summary>
    public interface IOperationChange
    {
        int Id { get; set; }
        int OperationId { get; set; }
        string UserName { get; set; }
        DateTime ChangeDate { get; set; }
        string UserProfileImage { get; set; }
        string ChangeDescription { get; set; }
        string? ItemNumber { get; set; }
        string? ItemDescription { get; set; }
    }
}
