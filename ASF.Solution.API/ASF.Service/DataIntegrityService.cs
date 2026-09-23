using Microsoft.EntityFrameworkCore;
using ASF.Core.Dtos;
using ASF.Core.Services;
using ASF.Repository.AppDbContext;
using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ASF.Service
{
    public class DataIntegrityService : IDataIntegrityService
    {
        private readonly ApplicationDbContext _context;
        private readonly IConstructionService _constructionService;
        private readonly IMaintenanceService _maintenanceService;
        private readonly IEmergencyService _emergencyService;
        private readonly INewProjectService _newProjectService;
        private readonly IPrivateProject _privateProjectService;

        public DataIntegrityService(
            ApplicationDbContext context,
            IConstructionService constructionService,
            IMaintenanceService maintenanceService,
            IEmergencyService emergencyService,
            INewProjectService newProjectService,
            IPrivateProject privateProjectService)
        {
            _context = context;
            _constructionService = constructionService;
            _maintenanceService = maintenanceService;
            _emergencyService = emergencyService;
            _newProjectService = newProjectService;
            _privateProjectService = privateProjectService;
        }

        public async Task<List<SuspiciousValueDto>> GetSuspiciousValuesAsync(decimal threshold = 1_000_000m)
        {
            var results = new List<SuspiciousValueDto>();

            // ---------- Constructions ----------
            var constructions = await _context.Constructions.AsNoTracking()
                .Select(c => new { c.Id, c.FaultNumber, c.BranchName, c.Office, c.Situation, c.OrderType, c.EstimatedValue, c.ActualValue })
                .ToListAsync();

            results.AddRange(constructions
                .Select(c => new { c, est = ParseDecimal(c.EstimatedValue), act = ParseDecimal(c.ActualValue) })
                .Where(x => x.act > threshold)
                .Select(x => new SuspiciousValueDto
                {
                    SourceTable = "Constructions",
                    Id = x.c.Id,
                    ContractNumber = x.c.FaultNumber,
                    BranchName = x.c.BranchName,
                    Office = x.c.Office,
                    Situation = x.c.Situation,
                    OrderType = x.c.OrderType,
                    EstimatedValue = x.est,
                    ActualValue = x.act,
                    FlaggedValue = x.act
                }));

            // ---------- Maintenances ----------
            var maintenances = await _context.Maintenances.AsNoTracking()
                .Select(c => new { c.Id, c.FaultNumber, c.BranchName, c.Office, c.Situation, c.OrderType, c.EstimatedValue, c.ActualValue })
                .ToListAsync();

            results.AddRange(maintenances
                .Select(c => new { c, est = ParseDecimal(c.EstimatedValue), act = ParseDecimal(c.ActualValue) })
                .Where(x => x.act > threshold)
                .Select(x => new SuspiciousValueDto
                {
                    SourceTable = "Maintenances",
                    Id = x.c.Id,
                    ContractNumber = x.c.FaultNumber,
                    BranchName = x.c.BranchName,
                    Office = x.c.Office,
                    Situation = x.c.Situation,
                    OrderType = x.c.OrderType,
                    EstimatedValue = x.est,
                    ActualValue = x.act,
                    FlaggedValue = x.act
                }));

            // ---------- Emergencys ----------
            var emergencies = await _context.Emergencys.AsNoTracking()
                .Select(c => new { c.Id, c.FaultNumber, c.BranchName, c.Office, c.Situation, c.OrderType, c.EstimatedValue, c.ActualValue })
                .ToListAsync();

            results.AddRange(emergencies
                .Select(c => new { c, est = ParseDecimal(c.EstimatedValue), act = ParseDecimal(c.ActualValue) })
                .Where(x => x.act > threshold)
                .Select(x => new SuspiciousValueDto
                {
                    SourceTable = "Emergencys",
                    Id = x.c.Id,
                    ContractNumber = x.c.FaultNumber,
                    BranchName = x.c.BranchName,
                    Office = x.c.Office,
                    Situation = x.c.Situation,
                    OrderType = x.c.OrderType,
                    EstimatedValue = x.est,
                    ActualValue = x.act,
                    FlaggedValue = x.act
                }));

            // ---------- NewProjects ----------
            var newProjects = await _context.NewProjects.AsNoTracking()
                .Select(c => new { c.Id, c.StationNumber, c.BranchName, c.Office, c.Situation, c.OrderType, c.EstimatedValue, c.ActualValue })
                .ToListAsync();

            results.AddRange(newProjects
                .Select(c => new { c, est = ParseDecimal(c.EstimatedValue), act = ParseDecimal(c.ActualValue) })
                .Where(x => x.act > threshold)
                .Select(x => new SuspiciousValueDto
                {
                    SourceTable = "NewProjects",
                    Id = x.c.Id,
                    ContractNumber = x.c.StationNumber,
                    BranchName = x.c.BranchName,
                    Office = x.c.Office,
                    Situation = x.c.Situation,
                    OrderType = x.c.OrderType,
                    EstimatedValue = x.est,
                    ActualValue = x.act,
                    FlaggedValue = x.act
                }));

            // ملحوظة: PrivateProjects مفيهاش عمود ActualValue أصلاً (بيتحط 0 دايماً في الـ DTO الموحّد)،
            // فمش بتتفحص هنا لأننا بقينا بنفلتر على القيمة الفعلية بس.

            return results.OrderByDescending(r => r.FlaggedValue).ToList();
        }

        public async Task<DeleteSuspiciousResultDto> DeleteConfirmedAsync(List<SuspiciousValueRefDto> items)
        {
            var result = new DeleteSuspiciousResultDto();

            if (items == null || !items.Any())
                return result;

            foreach (var item in items)
            {
                try
                {
                    bool deleted = item.SourceTable switch
                    {
                        "Constructions" => await _constructionService.DeleteConstructionAsync(item.Id),
                        "Maintenances" => await _maintenanceService.DeleteMaintenanceAsync(item.Id),
                        "Emergencys" => await _emergencyService.DeleteEmergencyAsync(item.Id),
                        "NewProjects" => await _newProjectService.DeleteNewProjectAsync(item.Id),
                        // ملحوظة: الميثود في PrivateProjectService اسمها DeleteConstructionAsync
                        // (تسمية موروثة من الكود الأصلي)، وبتحذف PrivateProject فعلياً
                        "PrivateProjects" => await _privateProjectService.DeleteConstructionAsync(item.Id),
                        _ => throw new ArgumentException($"جدول غير معروف: {item.SourceTable}")
                    };

                    if (deleted)
                        result.Deleted.Add(item);
                    else
                        result.Errors.Add($"{item.SourceTable} #{item.Id}: السجل غير موجود أو فشل الحذف");
                }
                catch (Exception ex)
                {
                    result.Errors.Add($"{item.SourceTable} #{item.Id}: {ex.Message}");
                }
            }

            return result;
        }

        private static decimal ParseDecimal(string? value)
        {
            if (string.IsNullOrWhiteSpace(value)) return 0m;
            var cleaned = value.Replace(",", "").Trim();
            return decimal.TryParse(cleaned, NumberStyles.Any, CultureInfo.InvariantCulture, out var result) ? result : 0m;
        }
    }
}
