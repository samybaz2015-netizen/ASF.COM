using ASF.Core.Entities;

public class ProjectParty
{
    public int Id { get; set; }

    public string Name { get; set; } = string.Empty;

    public string Type { get; set; } = string.Empty;

    public int? BranchId { get; set; }     // Nullable

    public Branchs? Branch { get; set; }   // Navigation Property

    public DateTime CreatedAt { get; set; } = DateTime.Now;
}