using AutoMapper;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using ASF.Core.Dtos;
using ASF.Core.Dtos.ConstructionResponse;
using ASF.Core.DTOs.Pricing;
using ASF.Core.Entities;
using ASF.Core.Entities.Construction;
using ASF.Core.Entities.Identity;
using ASF.Core.HandleSpecification;
using ASF.Core.Repository;
using ASF.Core.Services;
using ASF.Repository.AppDbContext;
using System.Linq.Expressions;

namespace ASF.Service
{

    public class ConstructionService : BaseProjectService<Construction, OperationChangeForConstruction, ConstructionPricingItem, ConstructionPricingItemUpdateLog>, IConstructionService
    {
        protected override string ProjectTypeName => "الانشاءات";

        protected override Expression<Func<ConstructionPricingItem, bool>> PricingItemProjectFilter(int projectId)
            => x => x.ConstructionId == projectId;

        protected override void SetPricingItemProjectId(ConstructionPricingItem item, int projectId)
            => item.ConstructionId = projectId;

        protected override Expression<Func<ConstructionPricingItemUpdateLog, bool>> PricingLogProjectFilter(int projectId)
            => l => l.ConstructionId == projectId;

        protected override void SetPricingLogProjectId(ConstructionPricingItemUpdateLog log, int projectId)
            => log.ConstructionId = projectId;

        protected override IQueryable<Construction> FilterByOffice(string officeName)
            => Context.Constructions.Where(p => p.Office == officeName);

        public ConstructionService(IGenericRepository<Construction> constructionRepository,
            IGenericRepository<OperationChangeForConstruction> changeRepository,
                                 UserManager<AppUser> userManager,
                                 IMapper mapper,
                                 IHttpContextAccessor httpContextAccessor,
                                 INotificationRepository notificationRepository,
                                 IBranchService branchService,
                                 ApplicationDbContext context,
                                 GoogleDriveOAuthService googleDrive)
            : base(constructionRepository, changeRepository, userManager, mapper,
                   httpContextAccessor, notificationRepository, branchService, context, googleDrive)
        { }

        public async Task<Construction> CreateOrUpdateConstructionAsync(ConstructionDto constructionDto, bool isArchive)
        {
            var (userId, user) = await GetCurrentUserAsync();

            if (string.IsNullOrEmpty(constructionDto.District))
                throw new ArgumentException("يجب إدخال المنطقة (District).");
            if (string.IsNullOrEmpty(constructionDto.WorkOrderType))
                throw new ArgumentException("يجب إدخال نوع امر العمل (WorkOrderType).");
            if (string.IsNullOrEmpty(constructionDto.Contractor))
                throw new ArgumentException("يجب إدخال المقاول (Contractor).");
            if (string.IsNullOrEmpty(constructionDto.Consultant))
                throw new ArgumentException("يجب إدخال الاستشاري (Consultant).");
            var existWorkOrderType = await ProjectRepository.GetTableNoTracking()
              .Where(p => p.WorkOrderType == constructionDto.WorkOrderType)
              .FirstOrDefaultAsync();
            if (existWorkOrderType != null)
                return null;

            var existingProject = await ProjectRepository.GetTableNoTracking()
                .Where(p => p.FaultNumber == constructionDto.FaultNumber)
                .FirstOrDefaultAsync();
            var branch = await ResolveBranchAsync(user, constructionDto.BranchId, constructionDto.BranchName);

            if (existingProject != null)
            {
                if (!string.IsNullOrEmpty(constructionDto.District)) existingProject.District = constructionDto.District;
                if (!string.IsNullOrEmpty(constructionDto.Contractor)) existingProject.Contractor = constructionDto.Contractor;
                if (!string.IsNullOrEmpty(constructionDto.Consultant)) existingProject.Consultant = constructionDto.Consultant;
                if (constructionDto.SafetyViolationsExist.HasValue) existingProject.SafetyViolationsExist = constructionDto.SafetyViolationsExist.Value;
                if (!string.IsNullOrEmpty(constructionDto.Note)) existingProject.Note = constructionDto.Note;

                existingProject.IsArchived = isArchive;
                existingProject.AppUserId = userId;
                existingProject.BranchName = branch?.Name;
                existingProject.UserName = user.UserName;

                await AddChangeAsync(existingProject.Id, user.UserName, user.UserImage!, $"{user.UserName} :تم تغير في الطلب من خلال ");

                await ProjectRepository.UpdateAsync(existingProject);
                return existingProject;
            }
            else
            {
                var newProject = Mapper.Map<Construction>(constructionDto);
                newProject.IsArchived = isArchive;
                newProject.AppUserId = userId;
                newProject.BranchName = branch?.Name;
                newProject.UserName = user.UserName;

                await AddChangeAsync(newProject.Id, user.UserName, user.UserImage!, $"{user.UserName} :تم إنشاء الطلب من خلال ");
                await ProjectRepository.AddAsync(newProject);

                return newProject;
            }
        }


        /// <summary>
        /// تاريخ التسليم المتوقّع = تاريخ الإسناد + مدة التنفيذ. يُحسب ولا يُدخَل
        /// يدوياً، فلا يتناقض مع المدة المعلنة.
        /// </summary>
        private static string ComputeExpectedDelivery(DateTime? orderDate, string? duration)
        {
            if (orderDate is not DateTime start) return "-";
            return int.TryParse(duration, out var days)
                ? start.AddDays(days).ToString("yyyy-MM-dd")
                : start.ToString("yyyy-MM-dd");
        }


        public async Task<Construction> CreateConstructionAsync(ConstructionDto constructionDto, bool? isArchive)
        {
            var (userId, user) = await GetCurrentUserAsync();

            var branch = await ResolveBranchAsync(user, constructionDto.BranchId, constructionDto.BranchName);
            await EnsureUniqueOrderTypeAsync(constructionDto.FaultNumber, constructionDto.WorkOrderType);

            var newProject = Mapper.Map<Construction>(constructionDto);
            newProject.ProjectOwner = constructionDto.ProjectOwner;
            newProject.ProjectParty = constructionDto.ProjectParty;
            newProject.IsArchived = isArchive ?? false;
            newProject.IsApprove = false;
            newProject.AppUserId = userId;
            newProject.BranchName = branch?.Name;
            newProject.UserName = user.UserName;
            newProject.OrderDate = constructionDto.OrderDate;
            newProject.UserImage = user.UserImage ?? "default-image.png";
            newProject.CreateAt = DateTime.Now;
            newProject.ContractNumber = ResolveContractNumber(
                constructionDto.ContractNumber, null,
                newProject.BranchName, constructionDto.Office, constructionDto.ProjectPlace,
                constructionDto.ReceiveDateTime, constructionDto.OrderDate);
            newProject.Coordinates = constructionDto.Coordinates;
            // ───── حقول قالب إنشاء أمر العمل ─────
            newProject.TaskNumber = constructionDto.TaskNumber;
            newProject.WorkOrderCode = constructionDto.WorkOrderCode;
            newProject.Priority = constructionDto.Priority;
            newProject.VoltageLevel = constructionDto.VoltageLevel;
            newProject.PlotNumber = constructionDto.PlotNumber;
            newProject.PlanNumber = constructionDto.PlanNumber;
            newProject.SubscriberName = constructionDto.SubscriberName;
            newProject.ApprovalDate = constructionDto.ApprovalDate;
            newProject.IsDraft = constructionDto.IsDraft;

            // أعمدة إلزامية في القاعدة لا يرسلها القالب الجديد. تأخذ قيماً محايدة
            // بدل أن يفشل الإنشاء، وتُصحَّح من شاشة أمر العمل أو التحديث اليومي.
            newProject.CompletionDate = string.IsNullOrWhiteSpace(constructionDto.CompletionDate)
                ? ComputeExpectedDelivery(constructionDto.OrderDate, constructionDto.DurationOfImplementation)
                : constructionDto.CompletionDate;

            newProject.Situation = string.IsNullOrWhiteSpace(constructionDto.Situation)
                ? "جديد"
                : constructionDto.Situation;

            newProject.NumberOfDaysDelayed ??= "0";
            newProject.NumberOfDaysRemaining ??= constructionDto.DurationOfImplementation ?? "0";

            // القيمة التقديرية تُحسب تلقائياً في CreatePricingItemsAsync من سعر الوحدة المخزن

            newProject.ImplementationPhase = constructionDto.ImplementationPhase;
            newProject.WorkDescription = constructionDto.WorkDescription;
            newProject.DescriptionViolation = constructionDto.DescriptionViolation;
            newProject.TypeOfStomachTest = constructionDto.TypeOfStomachTest;
            newProject.ExcavationLength = constructionDto.DailyExcavationLength;
            // ⚠️ Situation تم تعيينه بالفعل أعلاه (سطر 207) مع قيمة افتراضية "جديد"
            newProject.StationNumber = constructionDto.StationNumber;
            newProject.OrderType = constructionDto.OrderType;
            newProject.NumberOfEquipment = constructionDto.NumberOfEquipment;
            newProject.DailyExcavationLength = constructionDto.DailyExcavationLength;
            newProject.ProjectExcavationLength = constructionDto.ProjectExcavationLength;
            if (newProject.ExcavationLength.HasValue && constructionDto.ProjectExcavationLength > 0)
            {
                double completionRatio = (double)((double)newProject.ExcavationLength.Value / constructionDto.ProjectExcavationLength);
                newProject.CompletionStatusReport = completionRatio.ToString("P2"); // 25.00% مثلاً
            }
            else
            {
                newProject.CompletionStatusReport = "0%";
            }


            newProject.DailyCableLength = constructionDto.DailyCableLength;
            newProject.ProjectCableLength = constructionDto.ProjectCableLength;
            newProject.CableLength = constructionDto.DailyCableLength;

            if (newProject.CableLength.HasValue && constructionDto.ProjectCableLength > 0)
            {
                double completionRatio = (double)((double)newProject.CableLength.Value / constructionDto.ProjectCableLength);
                newProject.CableCompletion = completionRatio.ToString("P2"); // 25.00% مثلاً
            }
            else
            {
                newProject.CableCompletion = "0%";
            }

            if (DateTime.TryParse(constructionDto.CompletionDate, out DateTime completionDate) &&
                int.TryParse(constructionDto.DurationOfImplementation, out int durationOfImplementation))
            {
                // حساب تاريخ الانتهاء الفعلي بناءً على CompletionDate
                DateTime endDate = completionDate.AddDays(durationOfImplementation);
                DateTime today = DateTime.Today;

                if (today > endDate)
                {
                    // إذا تجاوزنا تاريخ الانتهاء، نحسب التأخير
                    newProject.NumberOfDaysDelayed = (today - endDate).Days.ToString();
                    newProject.NumberOfDaysRemaining = "0"; // لا توجد أيام متبقية لأن المشروع انتهى
                }
                else if (today < completionDate)
                {
                    // إذا لم نصل إلى تاريخ البدء بعد، نترك القيم كما هي
                    newProject.NumberOfDaysDelayed = "0";
                    newProject.NumberOfDaysRemaining = durationOfImplementation.ToString(); // المدة الأصلية
                }
                else
                {
                    // إذا بدأ المشروع ولكن لم ينتهِ، نحسب الأيام المتبقية
                    newProject.NumberOfDaysDelayed = "0";
                    newProject.NumberOfDaysRemaining = (endDate - today).Days.ToString();
                }
            }
            else
            {
                newProject.NumberOfDaysDelayed = "غير متوفر";
                newProject.NumberOfDaysRemaining = "غير متوفر";
            }

            // رفع الصور على Google Drive بالتوازي
            await UploadPhotosAsync<ModelPhotoForConstruction>(newProject.ModelPhotos, constructionDto.ModelPhotos, "ModelPhotosForConstruction");
            await UploadPhotosAsync<SafetyWastePhotoForConstruction>(newProject.SafetyWastePhotos, constructionDto.SafetyWastePhotos, "SafetyWastePhotosForConstruction");
            await UploadPhotosAsync<SitePhotoForConstruction>(newProject.SitePhotos, constructionDto.SitePhotos, "SitePhotosForConstruction");
            await UploadPhotosAsync<ModelTestForConstruction>(newProject.TestModels, constructionDto.TestModels, "ModelTestForConstruction");

            // الإشعارات
            await SendNotificationsAsync(user, constructionDto.FaultNumber, newProject.Office, newProject.BranchName, "إنشاء مشروع جديد");

            // 1. احفظ المشروع الأول عشان يتولد الـ Id
            await ProjectRepository.AddAsync(newProject);

            // 2. إضافة البنود التسعيرية مع الكميات والحسابات
            await CreatePricingItemsAsync(newProject, constructionDto.PricingItems);

            // 3. بعدين أضف الـ Change مع الـ Id الصحيح وقيمة افتراضية للصورة
            await AddChangeAsync(
                newProject.Id,
                user.UserName,
                user.UserImage ?? "default-image.png",  // ✅ حل الـ NULL
                $"{user.UserName} :تم انشاء في الطلب من خلال "
            );
            return newProject;
        }

        public async Task<IReadOnlyCollection<Construction>> GetAllConstructionAsync()
        {
            var spec = new ConstructionSpecification();
            return await ProjectRepository.GetAllWithSpecAsync(spec);
        }

        public async Task<ConstructionResponse> GetConstructionByIdAsync(int Id)
        {
            var project = await Context.Constructions
                .Include(d => d.TestModels)
                .Include(d => d.SitePhotos)
                .Include(d => d.SafetyWastePhotos)
                .Include(d => d.ModelPhotos)
                .Include(d => d.ConstructionPricingItems)
                    .ThenInclude(cp => cp.PricingItem)
                .FirstOrDefaultAsync(d => d.Id == Id);

            if (project == null) return null;

            var dto = new ConstructionResponse
            {
                Id = project.Id,
                WorkOrderType = project.WorkOrderType,
                WorkDescription = project.WorkDescription,
                DurationOfImplementation = project.DurationOfImplementation,
                ImplementationPhase = project.ImplementationPhase,
                OrderType = project.OrderType,
                FaultNumber = project.FaultNumber,
                District = project.District,
                Contractor = project.Contractor,
                Consultant = project.Consultant,
                ProjectOwner = project.ProjectOwner,
                ProjectParty = project.ProjectParty,
                AppUserId = project.AppUserId,
                UserName = project.UserName,
                UserImage = project.UserImage,
                BranchName = project.BranchName,
                Situation = project.Situation,
                Note = project.Note,
                IsArchived = project.IsArchived,
                IsApprove = project.IsApprove,
                OrderDate = project.OrderDate,
                CompletionDate = project.CompletionDate,
                NumberOfDaysDelayed = project.NumberOfDaysDelayed,
                NumberOfDaysRemaining = project.NumberOfDaysRemaining,
                CompletionStatusReport = project.CompletionStatusReport,
                SafetyViolationsExist = project.SafetyViolationsExist,
                DescriptionViolation = project.DescriptionViolation,
                TypeOfStomachTest = project.TypeOfStomachTest,
                NumberOfEquipment = project.NumberOfEquipment,
                ProjectExcavationLength = project.ProjectExcavationLength,
                DailyExcavationLength = project.DailyExcavationLength,
                ExcavationLength = project.ExcavationLength,
                ProjectCableLength = project.ProjectCableLength,
                DailyCableLength = project.DailyCableLength,
                CableLength = project.CableLength,
                CableCompletion = project.CableCompletion,
                EstimatedValue = project.EstimatedValue,
                ActualValue = project.ActualValue,
                ExtractNumber = project.ExtractNumber,
                ProjectPlace = project.ProjectPlace,
                Office = project.Office,
                ProjectValue = project.ProjectValue,
                ProjectType = project.Type,
                OrderNumber = project.OrderCode,
                ReceiveDateTime = project.ReceiveDateTime,
                StationNumber = project.StationNumber,
                Coordinates = project.Coordinates,

                // ✅ Photos & Models — بدون circular reference
                TestModels = project.TestModels?.ToList(),
                ModelPhotos = project.ModelPhotos?.ToList(),
                SitePhotos = project.SitePhotos?.ToList(),
                SafetyWastePhotos = project.SafetyWastePhotos?.ToList(),

                // ✅ PricingItems — فصلناها عن الـ Construction
                PricingItems = project.ConstructionPricingItems?
                .Where(cp => cp.PricingItem != null)
                .Select(cp => new PricingItemResponseDto
                {
                    Id = cp.PricingItem.Id,
                    ItemNumber = cp.PricingItem.ItemNumber,
                    ShortDescription = cp.PricingItem.ShortDescription,
                    LongDescription = cp.PricingItem.LongDescription,
                    Uom = cp.PricingItem.UOM,
                    UnitPrice = (double)cp.PricingItem.UnitPrice,
                    Currency = cp.PricingItem.Currency,

                    // الحقول الجديدة
                    EstimatedQuantity = cp.EstimatedQuantity,
                    ExecutedQuantity = cp.ExecutedQuantity,
                    TotalPrice = cp.TotalPrice,
                    ExecutionPercentage = cp.ExecutionPercentage,
                    ExecutedWorksValue = cp.ExecutedWorksValue
                }).ToList() ?? new()
            };

            return dto;
        }

        public async Task<IReadOnlyCollection<Construction>> GetConstructionWithBranchNameAsync(string? branchName)
        {
            IQueryable<Construction> query = ProjectRepository.GetTableNoTracking()
                .Include(d => d.TestModels)
                .Include(d => d.SafetyWastePhotos)
                .Include(d => d.ModelPhotos)
                .Include(d => d.SitePhotos);

            if (!string.IsNullOrEmpty(branchName))
                query = query.Where(p => p.BranchName == branchName);

            return await query.ToListAsync();
        }

        public async Task<IReadOnlyCollection<Construction>> GetConstructionWithPaginationAsync(bool? isArchive, int? sortByOrderNumber, int pageSize, int pageIndex)
        {
            var spec = new ConstructionSpecification(isArchive, sortByOrderNumber, pageSize, pageIndex);
            return await ProjectRepository.GetAllWithSpecAsync(spec);
        }

        public Task<IReadOnlyCollection<Construction>> FilterConstructionByNameBranchAndIsArchive(string? branchName, bool? isArchive)
        {
            var spec = new ConstructionSpecification(branchName, isArchive);
            return ProjectRepository.GetAllWithSpecAsync(spec);
        }

        public async Task<Construction> UpdateConstructionAsync(int constructionId, UpdateConstructionDto constructionDto, bool isArchive)
        {
            var (userId, user) = await GetCurrentUserAsync();

            var existingProject = await ProjectRepository.GetTableNoTracking()
                .FirstOrDefaultAsync(p => p.Id == constructionId);
            if (existingProject == null)
                throw new KeyNotFoundException("المشروع غير موجود");

            await EnsureUniqueOrderTypeAsync(constructionDto.FaultNumber, constructionDto.WorkOrderType, existingProject.Id);

            // تحديث البيانات
            existingProject.IsArchived = isArchive;
            existingProject.Consultant = constructionDto.Consultant ?? existingProject.Consultant;
            existingProject.Contractor = constructionDto.Contractor ?? existingProject.Contractor;
            existingProject.ProjectOwner = constructionDto.ProjectOwner ?? existingProject.ProjectOwner;
            existingProject.ProjectParty = constructionDto.ProjectParty ?? existingProject.ProjectParty;
            existingProject.District = constructionDto.District ?? existingProject.District;
            existingProject.ExtractNumber = constructionDto.ExtractNumber ?? existingProject.ExtractNumber;
            existingProject.ProjectValue = constructionDto.ProjectValue ?? existingProject.ProjectValue;
            existingProject.Office = constructionDto.Office ?? existingProject.Office;
            existingProject.ProjectPlace = constructionDto.ProjectPlace ?? existingProject.ProjectPlace;
            existingProject.WorkOrderType = constructionDto.WorkOrderType ?? existingProject.WorkOrderType;
            existingProject.Situation = constructionDto.Situation ?? existingProject.Situation;
            existingProject.Note = constructionDto.Note ?? existingProject.Note;
            existingProject.SafetyViolationsExist = constructionDto.SafetyViolationsExist ?? existingProject.SafetyViolationsExist;
            existingProject.Coordinates = constructionDto.Coordinates ?? existingProject.Coordinates;
            existingProject.WorkDescription = constructionDto.WorkDescription ?? existingProject.WorkDescription;
            existingProject.DescriptionViolation = constructionDto.DescriptionViolation ?? existingProject.DescriptionViolation;
            existingProject.TypeOfStomachTest = constructionDto.TypeOfStomachTest ?? existingProject.TypeOfStomachTest;
            existingProject.OrderType = constructionDto.OrderType ?? existingProject.OrderType;
            // Situation تم تعيينه بالفعل أعلاه (سطر 522)
            existingProject.NumberOfEquipment = constructionDto.NumberOfEquipment ?? existingProject.NumberOfEquipment;
            existingProject.FaultNumber = constructionDto.FaultNumber ?? existingProject.FaultNumber;
            existingProject.StationNumber = constructionDto.StationNumber ?? existingProject.StationNumber;
            existingProject.CompletionDate = constructionDto.CompletionDate ?? existingProject.CompletionDate;
            existingProject.NumberOfDaysDelayed = constructionDto.NumberOfDaysDelayed ?? existingProject.NumberOfDaysDelayed;
            existingProject.NumberOfDaysRemaining = constructionDto.NumberOfDaysRemaining ?? existingProject.NumberOfDaysRemaining;
            existingProject.ProjectExcavationLength = constructionDto.ProjectExcavationLength ?? existingProject.ProjectExcavationLength;
            existingProject.ProjectCableLength = constructionDto.ProjectCableLength ?? existingProject.ProjectCableLength;
            existingProject.ImplementationPhase = constructionDto.ImplementationPhase ?? existingProject.ImplementationPhase;

            if (constructionDto.ReceiveDateTime != null)
            {
                existingProject.ReceiveDateTime = constructionDto.ReceiveDateTime.Value;
            }
            if (constructionDto.OrderDate != null)
            {
                existingProject.OrderDate = constructionDto.OrderDate.Value;
            }

            existingProject.ContractNumber = ResolveContractNumber(
                constructionDto.ContractNumber, existingProject.ContractNumber,
                existingProject.BranchName, existingProject.Office, existingProject.ProjectPlace,
                existingProject.ReceiveDateTime, existingProject.OrderDate);

            // معالجة الصور
            if (constructionDto.ModelPhotos?.Count > 0)
            {
                existingProject.ModelPhotos = new List<ModelPhotoForConstruction>();
                await UploadPhotosAsync<ModelPhotoForConstruction>(existingProject.ModelPhotos, constructionDto.ModelPhotos, "ModelPhotosForConstruction");
            }
            if (constructionDto.TestModels?.Count > 0)
            {
                existingProject.TestModels = new List<ModelTestForConstruction>();
                await UploadPhotosAsync<ModelTestForConstruction>(existingProject.TestModels, constructionDto.TestModels, "ModelTestForConstruction");
            }
            if (constructionDto.SafetyWastePhotos?.Count > 0)
            {
                existingProject.SafetyWastePhotos = new List<SafetyWastePhotoForConstruction>();
                await UploadPhotosAsync<SafetyWastePhotoForConstruction>(existingProject.SafetyWastePhotos, constructionDto.SafetyWastePhotos, "SafetyWastePhotosForConstruction");
            }
            if (constructionDto.SitePhotos?.Count > 0)
            {
                existingProject.SitePhotos = new List<SitePhotoForConstruction>();
                await UploadPhotosAsync<SitePhotoForConstruction>(existingProject.SitePhotos, constructionDto.SitePhotos, "SitePhotosForConstruction");
            }

            // 1. حفظ تحديث المشروع الأساسي
            await ProjectRepository.UpdateAsync(existingProject);

            // 2. تحديث البنود التسعيرية
            await ReplacePricingItemsAsync(existingProject, constructionDto.PricingItems);

            // 3. تسجيل التغيير مع التفاصيل الكاملة للتعديلات (مين وعمل ايه)
            var changesList = BuildCommonChangesList(
                isArchive, existingProject.IsArchived,
                constructionDto.SafetyViolationsExist, existingProject.SafetyViolationsExist,
                constructionDto.OrderDate, existingProject.OrderDate,
                constructionDto.PricingItems?.Count,
                constructionDto.ModelPhotos?.Count > 0,
                constructionDto.SitePhotos?.Count > 0,
                constructionDto.SafetyWastePhotos?.Count > 0,
                ("الاستشاري", constructionDto.Consultant, existingProject.Consultant),
                ("مالك المشروع", constructionDto.ProjectOwner, existingProject.ProjectOwner),
                ("الطرف المسؤول", constructionDto.ProjectParty, existingProject.ProjectParty),
                ("المقاول", constructionDto.Contractor, existingProject.Contractor),
                ("الحي", constructionDto.District, existingProject.District),
                ("المكتب", constructionDto.Office, existingProject.Office),
                ("نوع أمر العمل", constructionDto.WorkOrderType, existingProject.WorkOrderType),
                ("الحالة", constructionDto.Situation, existingProject.Situation),
                ("رقم العطل", constructionDto.FaultNumber, existingProject.FaultNumber),
                ("وصف العمل", constructionDto.WorkDescription, existingProject.WorkDescription),
                ("ملاحظات", constructionDto.Note, existingProject.Note),
                ("تاريخ الإنجاز", constructionDto.CompletionDate, existingProject.CompletionDate),
                ("مرحلة التنفيذ", constructionDto.ImplementationPhase, existingProject.ImplementationPhase));

            if (constructionDto.TestModels?.Count > 0) changesList.Add("تحديث نماذج الاختبار");

            await RecordUpdateChangesAsync(existingProject.Id, user.UserName, user.UserImage, changesList);

            // 4. الإشعارات
            if (existingProject.IsApprove == false)
            {
                await SendUpdateNotificationsAsync(user, constructionDto.FaultNumber, existingProject.Office, existingProject.Id);
            }

            return existingProject;
        }


        public async Task SaveChangesAsync()
        {
            await Context.SaveChangesAsync();
        }

        public async Task<bool> DeleteConstructionAsync(int projectId)
        {
            var project = await Context.Constructions
                .Include(d => d.TestModels)
                .Include(d => d.SitePhotos)
                .Include(d => d.SafetyWastePhotos)
                .Include(d => d.ModelPhotos)
                .Include(d => d.ConstructionPricingItems)
                .FirstOrDefaultAsync(d => d.Id == projectId);

            if (project == null)
                throw new KeyNotFoundException("المشروع غير موجود");

            return await DeleteProjectCoreAsync(project, project.ConstructionPricingItems,
                project.TestModels, project.SitePhotos,
                project.SafetyWastePhotos, project.ModelPhotos);
        }
    }
}