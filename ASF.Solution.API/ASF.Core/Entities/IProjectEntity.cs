namespace ASF.Core.Entities
{
    public interface IProjectEntity
    {
        int Id { get; set; }
        DateTime CreateAt { get; set; }
        bool IsArchived { get; set; }
        bool? IsApprove { get; set; }
        bool SafetyViolationsExist { get; set; }
    }
}
