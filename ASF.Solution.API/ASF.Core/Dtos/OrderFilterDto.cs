using ASF.Core.Dtos.ConstructionResponse;
using ASF.Core.Dtos.EmergencyResponse;
using ASF.Core.Dtos.MaintenanceResponse;
using ASF.Core.Dtos.NewProjectResponse;

public class OrderFilterDto
{
    public string? BranchName { get; set; }
    public string? OfficeName { get; set; }
    public string? Situation { get; set; }
    public string? Contractor { get; set; }
    public string? Consultant { get; set; }
    public string? District { get; set; }
    public string? WorkOrderType { get; set; }
    public string? FaultNumber { get; set; }
    public string? StationNumber { get; set; }      // ✅ int مش string
    public string? ContractNumber { get; set; }
    public List<string>? ContractNumbers { get; set; }
    public bool? SafetyViolationsExist { get; set; }
    public bool? IsArchived { get; set; }
    public DateTime? OrderDateFrom { get; set; }
    public DateTime? OrderDateTo { get; set; }
    public string? ProjectType { get; set; }     // rehabilitationworks | constructionProjects | emergencyProjects | maintenanceProjects
    public double? CableLength { get; set; }
    public double? CableCompletionPercentage { get; set; }
    public int PageIndex { get; set; } = 1;
    public int PageSize { get; set; } = 10;
}
public class AllOrdersPaginatedDto
{
    public PaginatedResult<NewProjectResponse>? RehabilitationWorks { get; set; }
    public PaginatedResult<ConstructionResponse>? Constructions { get; set; }
    public PaginatedResult<EmergencyResponse>? Emergencies { get; set; }
    public PaginatedResult<MaintenanceResponse>? Maintenances { get; set; }
}