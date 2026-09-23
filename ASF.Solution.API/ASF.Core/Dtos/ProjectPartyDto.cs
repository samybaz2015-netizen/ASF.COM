namespace ASF.Core.Dtos
{
    public class ProjectPartyDto
    {
        public string Name { get; set; } = string.Empty;
        public string Type { get; set; } = string.Empty; // "مقاول" | "مهندس" | "مشرف"
        public int? BranchId { get; set; }
    }

    public class GetProjectPartyDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Type { get; set; } = string.Empty;
        public int? BranchId { get; set; }
        public string? BranchName { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
