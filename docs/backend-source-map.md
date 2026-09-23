# خريطة الكود المصدري للواجهة الخلفية

استُخرجت من ملفات PDB المرفقة مع النشر، وهي تحمل أسماء ملفات المصدر
ومساراتها وقت البناء.

---

## مكان المصدر الأصلي

ظهر المسار كاملاً في أثر استثناء من الخادم المحلي:

```
F:\api.net projects\Asff\Asff\rasm\RASM.Solution.API\RASM.Service\BranchService.cs
```

إذن جذر الحل:

```
F:\api.net projects\Asff\Asff\rasm\RASM.Solution.API\
```

**القرص `F:` غير متصل بجهازك** — فالمصدر على جهاز المطور أو قرص خارجي لديه.
هذا هو ما يجب طلبه منه بالضبط.
---

## بنية الحل

| المشروع | الدور |
|---------|-------|
| `RASM.Api` | التحكمات ونقاط النهاية |
| `RASM.Core` | الكيانات و DTOs والواجهات |
| `RASM.Repository` | الوصول للبيانات و DbContext والترحيلات |
| `RASM.Service` | منطق التطبيق |

---

## ملفات المصدر المستخرجة (277 ملفاً)

### Controllers — 31

```
AccountController.cs                        AdminController.cs                          AttendanceController.cs
BranchController.cs                         ConstructionController.cs                   ConsultantController.cs
ContactController.cs                        ContractorController.cs                     CustodiesController.cs
DashboardController.cs                      DashboardPowerBiController.cs               DataIntegrityController.cs
DownloadController.cs                       EmergencyController.cs                      EmployeesController.cs
FilesController.cs                          JobDescriptionController.cs                 LeaveRequestController.cs
MaintenanceController.cs                    NeighborhoodController.cs                   NewProjectController.cs
NotificationController.cs                   OfficeController.cs                         OrdersinHomeController.cs
PermissionsController.cs                    PricingItemsController.cs                   PrivateProjectController.cs
ProjectOwnerController.cs                   ProjectPartyController.cs                   SearchController.cs
WorkOrderTypeController.cs
```

### Services — 56

```
AdminService.cs                             AttendanceService.cs                        BranchService.cs
ConstructionService.cs                      ConstructionUpdateService.cs                ConsultantService.cs
ContactService.cs                           ContractorService.cs                        CustodyService.cs
DashboardPowerBiService.cs                  DashboardService.cs                         DataIntegrityService.cs
EmailService.cs                             EmergencyService.cs                         EmployeeService.cs
EngineerService.cs                          GoogleDriveOAuthService.cs                  IAdminService.cs
IAttendanceService.cs                       IBranchService.cs                           IConstructionService.cs
IConsultantService.cs                       IContactService.cs                          IContractorService.cs
ICustodyService.cs                          IDashboardPowerBiService.cs                 IDashboardService.cs
IDataIntegrityService.cs                    IEmergencyService.cs                        IEmployeeService.cs
IJobDescriptionService.cs                   ILeaveRequestService.cs                     IMaintenanceService.cs
INeighborhoodService.cs                     INewProjectService.cs                       IOfficeService.cs
IPermissionService.cs                       IPricingItemService.cs                      IPrivateProjectService.cs
IProjectOwnerService.cs                     IProjectPartyService.cs                     ITokenService.cs
LeaveCarryOverService.cs                    LeaveEndReminderHostedService.cs            LeaveRequestService.cs
MaintenanceService.cs                       NeighborhoodService.cs                      NewProjectService.cs
OfficeService.cs                            PermissionService.cs                        PricingItemService.cs
PrivateProjectService.cs                    ProjectOwnerService.cs                      ProjectPartyService.cs
ResidenceExpiryCheckService.cs              TokenService.cs
```

### Repositories — 14

```
ConstructionDeletedRepository.cs            EmergencyDeletedRepository.cs               GenericRepository.cs
IConstructionDeletedRepository.cs           IEmergancyDeletedRepository.cs              IGenericRepository.cs
IMaintenanceDeletedRepository.cs            INewProjectDeletedRepository.cs             INotificationRepository.cs
IPrivateProjectDeletedRepository.cs         MaintenanceDeletedRepository.cs             NewProjectDeletedRepository.cs
NotificationRepository.cs                   PrivateProjectDeletedRepository.cs
```

### DTOs — 44

```
AttendanceDto.cs                            BranchsDTO.cs                               ConstructionDto.cs
ConsultantDTO.cs                            ContactDto.cs                               ContractorsDTO.cs
DashboardFilterDto.cs                       DashboardPowerBiFilterDto.cs                DashboardStatsDto.cs
EmergencyDto.cs                             EmployeeDto.cs                              EngineerProfileDto.cs
JobDescriptionDTO.cs                        LastOrdersDto.cs                            LeaveRequestDto.cs
LoginDto.cs                                 MaintenanceDto.cs                           NeighborhoodDto.cs
NewProjectDto.cs                            OfficeDTO.cs                                OperationChangeDto.cs
OrderCompleteOrNoDto.cs                     OrderCountInBranchDto.cs                    OrderCountInBranchchartDto.cs
OrderDto.cs                                 OrderFilterDto.cs                           PermissionsDto.cs
PricingItemDto.cs                           PrivateProjectDto.cs                        ProjectDto.cs
ProjectOwnerDto.cs                          ProjectPartyDto.cs                          ProjectSituationFilterDto.cs
RegisterDto.cs                              RoleDto.cs                                  SuspiciousValueDto.cs
UpdateConstructionDto.cs                    UpdateEmergencyDto.cs                       UpdateEngineerPermissionDto.cs
UpdateMaintenanceDto.cs                     UpdateNewProjectDto.cs                      UpdatePrivateProjectDto.cs
UserDto.cs                                  WorkOrderTypeDTO.cs
```

### Specifications — 7

```
BaseSpecification.cs                        ConstructionSpecification.cs                EmergencySpecification.cs
ISpecification.cs                           MaintenanceSpecification.cs                 NewProjectSpecification.cs
PrivateProjectSpecification.cs
```

### Data — 4

```
AppIdentityDbContext.cs                     AppIdentityDbContextModelSnapshot.cs        ApplicationDbContext.cs
ApplicationDbContextModelSnapshot.cs
```

### Entities & Other — 121

```
ApiResponse.cs                              AppUser.cs                                  ApplicationServicesExtention.cs
Attendance.cs                               Branchs.cs                                  BreakCircularReferencesSchemaFilter.cs
Construction.cs                             ConstructionDeleted.cs                      ConstructionPricingItemUpdateLog.cs
ConstructionResponse.cs                     Consultants.cs                              Contact.cs
ContractHelper.cs                           Contractors.cs                              CorsConfigurations.cs
CorsExtension.cs                            CreateCustody.cs                            Custody.cs
DeleteRequest.cs                            DeletedProjectsResponse.cs                  EmailSender.cs
Emergency.cs                                EmergencyDeleted.cs                         EmergencyPricingItemUpdateLog.cs
EmergencyResponse.cs                        Employees.cs                                EngineerProfile.cs
GetPendingUpdatesAsync.cs                   HasPermissionAttribute.cs                   HomeFilterParams.cs
IEmailSender.cs                             IProjectEntity.cs                           IWorkOrderTypeServices.cs
IdentityServicesExtention.cs                JobDescription.cs                           JobDescriptionServices.cs
LeaveRequest.cs                             Maintenance.cs                              MaintenanceDeleted.cs
MaintenancePricingItemUpdateLog.cs          MaintenanceResponse.cs                      ModelPhotoForConstruction.cs
ModelPhotoForDeletedConstruction.cs         ModelPhotoForDeletedEmergency.cs            ModelPhotoForDeletedNew.cs
ModelPhotoForEmergency.cs                   ModelPhotoForMaintenance.cs                 ModelPhotoForMaintenanceDeleted.cs
ModelPhotoForNew.cs                         ModelPhotoForPrivate.cs                     ModelPhotoForPrivateDeleted.cs
ModelTestForConstruction.cs                 ModelTestForDeletedConstruction.cs          ModelTestForDeletedEmergency.cs
ModelTestForEmergency.cs                    ModelTestForMaintenance.cs                  ModelTestForMaintenanceDeleted.cs
Neighborhood.cs                             NewProject.cs                               NewProjectDeleted.cs
NewProjectPricingItemUpdateLog.cs           NewProjectResponse.cs                       Notification.cs
Office.cs                                   OperationChangeForConstruction.cs           OperationChangeForEmergency.cs
OperationChangeForMaintenance.cs            OperationChangeForNewProject.cs             OperationChangeForPrivateProject.cs
PaginatedResult.cs                          ParamOfPagination.cs                        Permissions.cs
PricingItem.cs                              PricingItemsSeed.cs                         PrivateProject.cs
PrivateProjectDeleted.cs                    PrivateResponse.cs                          ProfilesMapping.cs
Program.cs                                  ProjectOwner.cs                             ProjectParty.cs
RASM.Api.AssemblyInfo.cs                    RASM.Api.GlobalUsings.g.cs                  RASM.Api.MvcApplicationPartsAssemblyInfo.cs
RASM.Core.AssemblyInfo.cs                   RASM.Core.GlobalUsings.g.cs                 RASM.Repository.AssemblyInfo.cs
RASM.Repository.GlobalUsings.g.cs           RASM.Service.AssemblyInfo.cs                RASM.Service.GlobalUsings.g.cs
SafetyWastePhotoForConstruction.cs          SafetyWastePhotoForDeletedConstruction.cs   SafetyWastePhotoForDeletedEmergency.cs
SafetyWastePhotoForDeletedNew.cs            SafetyWastePhotoForEmergency.cs             SafetyWastePhotoForMaintenance.cs
SafetyWastePhotoForMaintenanceDeleted.cs    SafetyWastePhotoForNew.cs                   SafetyWastePhotoForPrivate.cs
SafetyWastePhotoForPrivateDeleted.cs        SitePhotoForConstruction.cs                 SitePhotoForDeletedConstruction.cs
SitePhotoForDeletedEmergency.cs             SitePhotoForDeletedNew.cs                   SitePhotoForEmergency.cs
SitePhotoForMaintenance.cs                  SitePhotoForMaintenanceDeleted.cs           SitePhotoForNew.cs
SitePhotoForPrivate.cs                      SitePhotoForPrivateDeleted.cs               SpecificationEvaluator.cs
SwaggerExtension.cs                         TokenHelper.cs                              UserPermission.cs
WorkOrderType.cs                            WorkOrderTypeServices.cs                    gfhbgfb.Designer.cs
gfhbgfb.cs                                  init.Designer.cs                            init.cs
v8.0.AssemblyAttributes.cs
```

---

## لماذا يهم هذا

كل مواصفة طلبتها حتى الآن — تحديث التنفيذ اليومي، وإدارة الصلاحيات،
ومستحقات الاستشاري — تحتاج تعديلاً في هذه الملفات. وجودها بأسمائها يعني
أن المطور يستطيع تحديد ما يلزم تعديله بدقة قبل أن يبدأ.
