namespace ASF.Core.Dtos
{

    // ===================================================
    //  الـ DTO الرئيسي - بيجمع كل الإحصائيات
    // ===================================================
    public class DashboardStatsDto
    {
        public DateTime GeneratedAt { get; set; } = DateTime.UtcNow;

        public OverallSummaryDto             OverallSummary             { get; set; } = new();
        public ConstructionStatsDto          Construction               { get; set; } = new();
        public MaintenanceStatsDto           Maintenance                { get; set; } = new();
        public EmergencyStatsDto             Emergency                  { get; set; } = new();
        public NewProjectStatsDto            NewProject                 { get; set; } = new();
        public PrivateProjectStatsDto        PrivateProject             { get; set; } = new();
        public LeaveRequestStatsDto          LeaveRequests              { get; set; } = new();
        public AttendanceStatsDto            Attendance                 { get; set; } = new();
        public CustodyStatsDto               Custody                    { get; set; } = new();
        public UsersStatsDto                 Users                      { get; set; } = new();
        public EmployeesStatsDto             Employees                  { get; set; } = new();
        public List<BranchBreakdownDto>      BranchBreakdown            { get; set; } = new();
        public List<ContractorBreakdownDto>  ContractorBreakdown        { get; set; } = new();
        public List<ConsultantBreakdownDto>  ConsultantBreakdown        { get; set; } = new();
        public List<MonthlyTrendDto>         MonthlyOrdersTrend         { get; set; } = new();
        public List<SituationBreakdownDto>   SituationBreakdown         { get; set; } = new();
        public SafetyStatsDto                Safety                     { get; set; } = new();
    }

    // ===================================================
    //  ملخص عام - إجمالي أوامر العمل والقيم المالية
    // ===================================================
    public class OverallSummaryDto
    {
        public int TotalWorkOrders          { get; set; }
        public int TotalActiveOrders        { get; set; }   // غير مؤرشفة
        public int TotalArchivedOrders      { get; set; }
        public int TotalApproved            { get; set; }
        public int TotalRejected            { get; set; }
        public int TotalPendingApproval     { get; set; }
        public int TotalWithSafetyViolation { get; set; }
        public int TotalDeleteRequests      { get; set; }

        // القيم المالية الإجمالية من بنود الأعمال
        public double TotalEstimatedValue   { get; set; }   // إجمالي القيمة التقديرية
        public double TotalActualValue      { get; set; }   // إجمالي القيمة الفعلية
    }

    // ===================================================
    //  الإنشاءات
    // ===================================================
    public class ConstructionStatsDto
    {
        public int    Total                   { get; set; }
        public int    Active                  { get; set; }
        public int    Archived                { get; set; }
        public int    Approved                { get; set; }
        public int    Rejected                { get; set; }
        public int    PendingApproval         { get; set; }
        public int    WithSafetyViolations    { get; set; }
        public int    DeletedCount            { get; set; }

        // القيم المالية
        public double EstimatedValue          { get; set; }   // القيمة التقديرية للإنشاءات
        public double ActualValue             { get; set; }   // القيمة الفعلية للإنشاءات

        // إحصائيات التنفيذ
        public double? TotalProjectCableLength      { get; set; }
        public double? TotalDailyCableLength        { get; set; }
        public double? TotalCableLength             { get; set; }
        public double? TotalProjectExcavationLength { get; set; }
        public double? TotalDailyExcavationLength   { get; set; }
        public double? TotalExcavationLength        { get; set; }
        public int?    TotalNumberOfEquipment        { get; set; }

        public List<string>    DistinctDistricts      { get; set; } = new();
        public List<string>    DistinctBranches       { get; set; } = new();
        public List<string>    DistinctOffices        { get; set; } = new();
        public List<StatusCountDto> SituationCounts   { get; set; } = new();
        public List<StatusCountDto> OrderTypeCounts   { get; set; } = new();
        public List<StatusCountDto> ImplementationPhaseCounts { get; set; } = new();
    }

    // ===================================================
    //  الصيانة
    // ===================================================
    public class MaintenanceStatsDto
    {
        public int Total                { get; set; }
        public int Active               { get; set; }
        public int Archived             { get; set; }
        public int Approved             { get; set; }
        public int Rejected             { get; set; }
        public int PendingApproval      { get; set; }
        public int WithSafetyViolations { get; set; }
        public int DeletedCount         { get; set; }
        public int? TotalNumberOfEquipment { get; set; }

        // القيم المالية
        public double EstimatedValue    { get; set; }   // القيمة التقديرية للصيانة
        public double ActualValue       { get; set; }   // القيمة الفعلية للصيانة

        public List<string>         DistinctDistricts   { get; set; } = new();
        public List<string>         DistinctBranches    { get; set; } = new();
        public List<StatusCountDto> SituationCounts     { get; set; } = new();
        public List<StatusCountDto> OrderTypeCounts     { get; set; } = new();
    }

    // ===================================================
    //  الطوارئ
    // ===================================================
    public class EmergencyStatsDto
    {
        public int Total                { get; set; }
        public int Active               { get; set; }
        public int Archived             { get; set; }
        public int Approved             { get; set; }
        public int Rejected             { get; set; }
        public int PendingApproval      { get; set; }
        public int WithSafetyViolations { get; set; }
        public int DeletedCount         { get; set; }
        public int? TotalNumberOfEquipment { get; set; }

        // القيم المالية
        public double EstimatedValue    { get; set; }   // القيمة التقديرية للطوارئ
        public double ActualValue       { get; set; }   // القيمة الفعلية للطوارئ

        public List<string>         DistinctDistricts { get; set; } = new();
        public List<string>         DistinctBranches  { get; set; } = new();
        public List<StatusCountDto> SituationCounts   { get; set; } = new();
        public List<StatusCountDto> OrderTypeCounts   { get; set; } = new();
    }

    // ===================================================
    //  أعمال التأهيل (New Project)
    // ===================================================
    public class NewProjectStatsDto
    {
        public int Total                { get; set; }
        public int Active               { get; set; }
        public int Archived             { get; set; }
        public int Approved             { get; set; }
        public int Rejected             { get; set; }
        public int PendingApproval      { get; set; }
        public int WithSafetyViolations { get; set; }
        public int DeletedCount         { get; set; }

        // القيم المالية
        public double EstimatedValue    { get; set; }   // القيمة التقديرية لأعمال التأهيل
        public double ActualValue       { get; set; }   // القيمة الفعلية لأعمال التأهيل

        public List<string>         DistinctDistricts               { get; set; } = new();
        public List<string>         DistinctBranches                { get; set; } = new();
        public List<StatusCountDto> SituationCounts                 { get; set; } = new();
        public List<StatusCountDto> QualificationClassificationCounts { get; set; } = new();
    }

    // ===================================================
    //  المشاريع الخاصة
    // ===================================================
    public class PrivateProjectStatsDto
    {
        public int Total                { get; set; }
        public int Active               { get; set; }
        public int Archived             { get; set; }
        public int Approved             { get; set; }
        public int Rejected             { get; set; }
        public int PendingApproval      { get; set; }
        public int WithSafetyViolations { get; set; }
        public int DeletedCount         { get; set; }

        // القيم المالية
        public double EstimatedValue    { get; set; }   // القيمة التقديرية للمشاريع الخاصة
        public double ActualValue       { get; set; }   // القيمة الفعلية للمشاريع الخاصة

        public List<string>         DistinctProjectPlaces { get; set; } = new();
        public List<string>         DistinctBranches      { get; set; } = new();
        public List<StatusCountDto> CustomerCounts        { get; set; } = new();
    }

    // ===================================================
    //  طلبات الإجازة
    // ===================================================
    public class LeaveRequestStatsDto
    {
        public int Total    { get; set; }
        public int Approved { get; set; }
        public int Rejected { get; set; }
        public int Pending  { get; set; }

        public int TotalDaysApproved { get; set; }
        public int TotalDaysPending  { get; set; }

        public List<StatusCountDto> PerEmployeeCount { get; set; } = new();
        public List<MonthlyLeaveDto> MonthlyLeaveStats { get; set; } = new();
    }

    // ===================================================
    //  الحضور والانصراف
    // ===================================================
    public class AttendanceStatsDto
    {
        public int TotalRecords        { get; set; }
        public int CurrentlyCheckedIn  { get; set; }   // CheckOutTime == null
        public int TotalDistinctUsers  { get; set; }

        public List<MonthlyAttendanceDto> MonthlyAttendance { get; set; } = new();
        public List<StatusCountDto>       AttendancePerUser  { get; set; } = new();
    }

    // ===================================================
    //  العهدات
    // ===================================================
    public class CustodyStatsDto
    {
        public int     Total           { get; set; }
        public int     Open            { get; set; }
        public int     Closed          { get; set; }

        public decimal TotalAdvanceAmount    { get; set; }
        public decimal OpenAdvanceAmount     { get; set; }
        public decimal ClosedAdvanceAmount   { get; set; }

        public int     TotalInvoices         { get; set; }
        public decimal TotalInvoicesAmount   { get; set; }  // مجموع LineTotal
        public decimal TotalVatAmount        { get; set; }  // مجموع الضريبة المحسوبة
    }

    // ===================================================
    //  المستخدمون (AppUser)
    // ===================================================
    public class UsersStatsDto
    {
        public int Total                      { get; set; }
        public int WithCanCreateOutsideCity   { get; set; }
        public List<BranchedStatusCountDto> PerUserTypeBranched { get; set; } = new();
        public List<StatusCountDto> PerUserType   { get; set; } = new();
        public List<StatusCountDto> PerBranch     { get; set; } = new();
        public List<StatusCountDto> PerOffice     { get; set; } = new();
    }

    // ===================================================
    //  الموظفون
    // ===================================================
    public class EmployeesStatsDto
    {
        public int Total                { get; set; }
        public List<StatusCountDto> PerProfession { get; set; } = new();
        public List<StatusCountDto> PerCity       { get; set; } = new();

        // مهندسون (EngineerProfile)
        public int EngineersTotal                    { get; set; }
        public int EngineersWithExpiredResidence     { get; set; }  // ResidenceExpiryDate < اليوم
        public int EngineersWithExpiringResidence    { get; set; }  // ResidenceExpiryDate خلال 30 يوم
        public List<StatusCountDto> EngineersPerSpecialization { get; set; } = new();
        public List<StatusCountDto> EngineersPerJobTitle       { get; set; } = new();
    }

    // ===================================================
    //  توزيع الأوامر على الفروع
    // ===================================================
    public class BranchBreakdownDto
    {
        public string BranchName      { get; set; } = string.Empty;
        public int    Construction    { get; set; }
        public int    Maintenance     { get; set; }
        public int    Emergency       { get; set; }
        public int    NewProject      { get; set; }
        public int    PrivateProject  { get; set; }
        public int    Total           { get; set; }
        // القيم المالية من بنود الأعمال
        public double EstimatedValue  { get; set; }   // إجمالي قيمة الأعمال (TotalPrice)
        public double ActualValue     { get; set; }   // إجمالي الأعمال المنفذة (ExecutedWorksValue)
        public int Year { get; set; }
        public int Month { get; set; }
        public int Day { get; set; }

    }

    // ===================================================
    //  المقاولون
    // ===================================================
    public class ContractorBreakdownDto
    {
        public string BranchName { get; set; } = "غير محدد";
        public string ContractorName { get; set; } = string.Empty;
        public int    Construction   { get; set; }
        public int    Maintenance    { get; set; }
        public int    Emergency      { get; set; }
        public int    NewProject     { get; set; }
        public int    PrivateProject { get; set; }
        public int    Total          { get; set; }
        // القيم المالية من بنود الأعمال
        public double EstimatedValue { get; set; }   // إجمالي قيمة الأعمال
        public double ActualValue    { get; set; }   // إجمالي الأعمال المنفذة
        public int Year { get; set; }
        public int Month { get; set; }
        public int Day { get; set; }
        public string? MonthName { get; set; }

    }

    // ===================================================
    //  الاستشاريون
    // ===================================================
    public class ConsultantBreakdownDto
    {
        public string BranchName { get; set; } = "غير محدد";
        public string ConsultantName { get; set; } = string.Empty;
        public int    Construction   { get; set; }
        public int    Maintenance    { get; set; }
        public int    Emergency      { get; set; }
        public int    NewProject     { get; set; }
        public int    PrivateProject { get; set; }
        public int    Total          { get; set; }
        // القيم المالية من بنود الأعمال
        public double EstimatedValue { get; set; }   // إجمالي قيمة الأعمال
        public double ActualValue    { get; set; }   // إجمالي الأعمال المنفذة
        public int Year { get; set; }
        public int Month { get; set; }
        public int Day { get; set; }
        public string? MonthName { get; set; }

    }

    // ===================================================
    //  اتجاه الأوامر الشهري
    // ===================================================
    public class MonthlyTrendDto
    {
        public int Year { get; set; }
        public int Month { get; set; }
        public int Day { get; set; }
        public string MonthName { get; set; } = string.Empty;
        public int Construction { get; set; }
        public int Maintenance { get; set; }
        public int Emergency { get; set; }
        public int NewProject { get; set; }
        public int PrivateProject { get; set; }
        public int Total { get; set; }
        public string BranchName { get; set; } = "غير محدد";
        public string Office { get; set; } = "غير محدد";
        public string Contractor { get; set; } = "غير محدد";
        public string Consultant { get; set; } = "غير محدد";
    }

    // ===================================================
    //  توزيع حالات أوامر العمل (Situation) الكلي
    // ===================================================
    public class SituationBreakdownDto
    {
        public string Situation      { get; set; } = string.Empty;
        public string ProjectType    { get; set; } = string.Empty;
        public int    Count          { get; set; }
        public double EstimatedValue { get; set; }
        public double ActualValue    { get; set; }
    }
    public class BranchedStatusCountDto
    {
        public int Year { get; set; }
        public int Month { get; set; }
        public int Day { get; set; }
        public string? MonthName { get; set; }
        public string BranchName { get; set; } = "غير محدد";
        public string Label { get; set; } = "غير محدد";
        public int Count { get; set; }
        public double EstimatedValue { get; set; }
        public double ActualValue { get; set; }
    }

    // ===================================================
    //  إحصائيات السلامة (مخالفات السلامة)
    // ===================================================
    public class SafetyStatsDto
    {
        public int TotalViolations         { get; set; }
        public int ConstructionViolations  { get; set; }
        public int MaintenanceViolations   { get; set; }
        public int EmergencyViolations     { get; set; }
        public int NewProjectViolations    { get; set; }
        public int PrivateProjectViolations{ get; set; }
        public List<StatusCountDto> ViolationsPerBranch { get; set; } = new();
    }

    // ===================================================
    //  Helper DTOs
    // ===================================================
    public class StatusCountDto
    {
        public int Year { get; set; }
        public int Month { get; set; }
        public int Day { get; set; }
        public string? MonthName { get; set; }
        public string Label          { get; set; } = string.Empty;
        public int    Count          { get; set; }
        public double EstimatedValue { get; set; }   // قيمة الأعمال (اختيارية — بتتملى لما بتكون متاحة)
        public double ActualValue    { get; set; }   // قيمة الأعمال المنفذة
    }

    public class MonthlyLeaveDto
    {
        public int    Year      { get; set; }
        public int    Month     { get; set; }
        public string MonthName { get; set; } = string.Empty;
        public int    Approved  { get; set; }
        public int    Rejected  { get; set; }
        public int    Pending   { get; set; }
        public int    TotalDays { get; set; }
    }

    public class MonthlyAttendanceDto
    {
        public int    Year        { get; set; }
        public int    Month       { get; set; }
        public string MonthName   { get; set; } = string.Empty;
        public int    CheckIns    { get; set; }
        public int    CheckOuts   { get; set; }
    }
}




