using Microsoft.EntityFrameworkCore;
using ASF.Core.Entities;
using ASF.Core.Entities.NewProject;
using ASF.Core.Entities.PrivateProject;
using System.Reflection;
using ASF.Core.Entities.Construction;
using ASF.Core.Entities.Maintenance;
using ASF.Core.Entities.Emergency;
using ASF.Core.Entities.Identity;
using ASF.Core.Entities.Pricing;
using ASF.Core.Entities.Workflow;


namespace ASF.Repository.AppDbContext
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options)
        {

        }

        protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
        {
            base.OnConfiguring(optionsBuilder);
        }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {

            modelBuilder.ApplyConfigurationsFromAssembly(Assembly.GetExecutingAssembly());

            modelBuilder.Entity<LeaveRequest>()
                .HasOne(lr => lr.Employee)
                .WithMany()
                .HasForeignKey(lr => lr.EmployeeId)
                .OnDelete(DeleteBehavior.Cascade);

            // المعرّف يولّده SQL Server (العمود IDENTITY في القاعدة).
            // كان مضبوطاً على ValueGeneratedNever ليقبل معرّفات PricingItemsSeed
            // الصريحة، لكن ذلك البذر لم يعد مستدعى من أي مكان، وبقاء الإعداد كان
            // يجعل EF يرسل Id = 0 مع كل إدراج فيرفضه الخادم:
            //   Cannot insert explicit value for identity column
            // وهو ما كان يفشل إنشاء أي بند تسعير جديد، ومنه استيراد ملحق الأسعار.
            modelBuilder.Entity<PricingItem>()
                .Property(p => p.Id)
                .ValueGeneratedOnAdd();

            modelBuilder.Entity<ConstructionPricingItem>()
                .HasKey(cp => new { cp.ConstructionId, cp.PricingItemId });

            modelBuilder.Entity<ConstructionPricingItem>()
                .HasOne(cp => cp.Construction)
                .WithMany(c => c.ConstructionPricingItems)
                .HasForeignKey(cp => cp.ConstructionId);

            modelBuilder.Entity<ConstructionPricingItem>()
                .HasOne(cp => cp.PricingItem)
                .WithMany()
                .HasForeignKey(cp => cp.PricingItemId);

            // تثبيت أسماء الجداول الموجودة في القاعدة بعد تصحيح أسماء DbSet
            modelBuilder.Entity<OperationChangeForEmergency>()
                .ToTable("operationChangeForEmergencies");
            modelBuilder.Entity<OperationChangeForPrivateProject>()
                .ToTable("OperationChangeForPrivateProject");

            ConfigureWorkflow(modelBuilder);

            // آخر سطر - يضمن إنه يغلب أي إعداد سابق لـ AppUser
            modelBuilder.Entity<AppUser>(b =>
            {
                b.HasKey(u => u.Id);
                b.ToTable("AspNetUsers", t => t.ExcludeFromMigrations());
            });
        }
        /// <summary>
        /// إعدادات منظومة الأقسام والسلال.
        /// </summary>
        private static void ConfigureWorkflow(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<Contract>(b =>
            {
                b.HasIndex(c => c.ContractNumber).IsUnique();
                b.HasMany(c => c.Departments)
                 .WithOne(d => d.Contract)
                 .HasForeignKey(d => d.ContractId)
                 .OnDelete(DeleteBehavior.Cascade);
            });

            modelBuilder.Entity<WorkflowDepartment>(b =>
            {
                b.HasIndex(d => new { d.ContractId, d.Name }).IsUnique();
                b.HasMany(d => d.Workflows)
                 .WithOne(w => w.Department)
                 .HasForeignKey(w => w.DepartmentId)
                 .OnDelete(DeleteBehavior.Cascade);
            });

            modelBuilder.Entity<Workflow>(b =>
            {
                b.HasIndex(w => new { w.DepartmentId, w.Status });
                b.HasIndex(w => new { w.DepartmentId, w.Version }).IsUnique();
                b.HasMany(w => w.Baskets)
                 .WithOne(k => k.Workflow)
                 .HasForeignKey(k => k.WorkflowId)
                 .OnDelete(DeleteBehavior.Cascade);
            });

            modelBuilder.Entity<WorkflowBasket>(b =>
            {
                b.HasIndex(k => new { k.WorkflowId, k.StableKey }).IsUnique();
                b.HasIndex(k => new { k.WorkflowId, k.SortOrder });
                b.HasMany(k => k.Tasks)
                 .WithOne(t => t.Basket)
                 .HasForeignKey(t => t.BasketId)
                 .OnDelete(DeleteBehavior.Cascade);
            });

            modelBuilder.Entity<BasketTask>()
                .HasIndex(t => new { t.BasketId, t.SortOrder });

            modelBuilder.Entity<WorkflowAuditLog>(b =>
            {
                b.HasIndex(l => new { l.ContractId, l.ChangedAt });
                b.HasIndex(l => l.WorkflowId);
            });

            // مفتاح المهمة الثابت فريد داخل سلتها.
            modelBuilder.Entity<BasketTask>()
                .HasIndex(t => new { t.BasketId, t.StableKey }).IsUnique();

            modelBuilder.Entity<WorkOrderPlacement>(b =>
            {
                // أمر العمل في سلة واحدة لا أكثر.
                b.HasIndex(p => new { p.ProjectTypeCode, p.WorkOrderId }).IsUnique();
                b.HasIndex(p => new { p.DepartmentId, p.BasketStableKey });

                b.HasOne(p => p.Contract).WithMany()
                 .HasForeignKey(p => p.ContractId)
                 .OnDelete(DeleteBehavior.Restrict);

                b.HasOne(p => p.Department).WithMany()
                 .HasForeignKey(p => p.DepartmentId)
                 .OnDelete(DeleteBehavior.Restrict);

                b.HasMany(p => p.History).WithOne(h => h.Placement)
                 .HasForeignKey(h => h.PlacementId)
                 .OnDelete(DeleteBehavior.Cascade);

                b.HasMany(p => p.TaskStates).WithOne(t => t.Placement)
                 .HasForeignKey(t => t.PlacementId)
                 .OnDelete(DeleteBehavior.Cascade);
            });

            modelBuilder.Entity<WorkOrderBasketHistory>()
                .HasIndex(h => new { h.PlacementId, h.MovedAt });

            modelBuilder.Entity<WorkOrderTaskState>()
                .HasIndex(t => new { t.PlacementId, t.BasketStableKey, t.TaskStableKey })
                .IsUnique();

            modelBuilder.Entity<ContractWorkOrderType>(b =>
            {
                // التصنيف جزء من التفرّد: «الرياض» حيٌّ ومقاولٌ في آنٍ معاً أمر
                // وارد، وبدونه يرفض الفهرس الثاني منهما.
                b.HasIndex(t => new { t.ContractId, t.DepartmentId, t.Category, t.Name }).IsUnique();

                b.HasOne(t => t.Contract).WithMany(c => c.WorkOrderTypes)
                 .HasForeignKey(t => t.ContractId)
                 .OnDelete(DeleteBehavior.Cascade);

                b.HasOne(t => t.Department).WithMany()
                 .HasForeignKey(t => t.DepartmentId)
                 .OnDelete(DeleteBehavior.NoAction);
            });

            modelBuilder.Entity<ContractTeamPermission>(b =>
            {
                b.HasIndex(x => x.UserId);
                b.HasIndex(x => new { x.UserId, x.ContractId, x.DepartmentId, x.WorkOrderTypeId })
                 .IsUnique();

                b.HasOne(x => x.Contract).WithMany()
                 .HasForeignKey(x => x.ContractId)
                 .OnDelete(DeleteBehavior.Cascade);

                b.HasOne(x => x.Department).WithMany()
                 .HasForeignKey(x => x.DepartmentId)
                 .OnDelete(DeleteBehavior.NoAction);

                b.HasOne(x => x.WorkOrderType).WithMany()
                 .HasForeignKey(x => x.WorkOrderTypeId)
                 .OnDelete(DeleteBehavior.NoAction);
            });

            modelBuilder.Entity<UserDataScope>(b =>
            {
                b.HasIndex(x => x.UserId);
                b.HasIndex(x => new { x.UserId, x.ContractId, x.DepartmentId }).IsUnique();

                b.HasOne(x => x.Contract).WithMany()
                 .HasForeignKey(x => x.ContractId)
                 .OnDelete(DeleteBehavior.Cascade);

                b.HasOne(x => x.Department).WithMany()
                 .HasForeignKey(x => x.DepartmentId)
                 .OnDelete(DeleteBehavior.NoAction);
            });
        }

        // ─── بيانات مشتركة ────────────────────────────────────────────
        public DbSet<Notification> Notifications { get; set; }
        public DbSet<Neighborhood> Neighborhoods { get; set; }
        public DbSet<Branchs> Branchs { get; set; }
        public DbSet<Contractor> Contractors { get; set; }
        public DbSet<Consultant> Consultants { get; set; }
        public DbSet<ProjectOwner> ProjectOwners { get; set; }
        public DbSet<WorkOrderType> WorkOrderTypes { get; set; }
        public DbSet<JobDescription> JobDescriptions { get; set; }
        public DbSet<Office> Offices { get; set; }
        public DbSet<Employees> Employees { get; set; }
        public DbSet<LeaveRequest> LeaveRequests { get; set; }
        public DbSet<DeleteRequest> DeleteRequests { get; set; }
        public DbSet<Custody> Custodies { get; set; }
        public DbSet<CustodyInvoice> CustodyInvoices { get; set; }
        public DbSet<ProjectParty> ProjectParties { get; set; }

        // ─── التسعير ────────────────────────────────────────────────────
        public DbSet<PricingItem> PricingItems { get; set; }
        public DbSet<ProjectPricingItem> ProjectPricingItems { get; set; }
        public DbSet<NewProjectPricingItem> NewProjectPricingItems { get; set; }
        public DbSet<NewProjectPricingItemUpdateLog> NewProjectPricingItemUpdateLogs { get; set; }
        public DbSet<ConstructionPricingItem> ConstructionPricingItems { get; set; }
        public DbSet<ConstructionPricingItemUpdateLog> ConstructionPricingItemUpdateLogs { get; set; }
        public DbSet<MaintenancePricingItem> MaintenancePricingItems { get; set; }
        public DbSet<MaintenancePricingItemUpdateLog> MaintenancePricingItemUpdateLogs { get; set; }
        public DbSet<EmergencyPricingItem> EmergencyPricingItems { get; set; }
        public DbSet<EmergencyPricingItemUpdateLog> EmergencyPricingItemUpdateLogs { get; set; }

        // ─── المشاريع الجديدة ───────────────────────────────────────────
        public DbSet<NewProject> NewProjects { get; set; }
        public DbSet<NewProjectDeleted> NewProjectDeleted { get; set; }
        public DbSet<ModelPhotoForNew> ModelPhotosForNew { get; set; }
        public DbSet<SafetyWastePhotoForNew> SafetyWastesNew { get; set; }
        public DbSet<SitePhotoForNew> SitePhotosForNew { get; set; }

        // ─── المشاريع الخاصة ────────────────────────────────────────────
        public DbSet<PrivateProject> PrivateProjects { get; set; }
        public DbSet<PrivateProjectDeleted> PrivateProjectDeleted { get; set; }
        public DbSet<ModelPhotoForPrivate> ModelPhotosForPrivate { get; set; }
        public DbSet<SafetyWastePhotoForPrivate> SafetyWastesForPrivate { get; set; }
        public DbSet<SitePhotoForPrivate> SitePhotosForPrivate { get; set; }

        // ─── الإنشاءات ──────────────────────────────────────────────────
        public DbSet<Construction> Constructions { get; set; }
        public DbSet<ConstructionDeleted> ConstructionDeleted { get; set; }
        public DbSet<ModelPhotoForConstruction> ModelPhotosForConstruction { get; set; }
        public DbSet<SafetyWastePhotoForConstruction> SafetyWastesForConstruction { get; set; }
        public DbSet<SitePhotoForConstruction> SitePhotosForConstruction { get; set; }

        // ─── الصيانة ────────────────────────────────────────────────────
        public DbSet<Maintenance> Maintenances { get; set; }
        public DbSet<MaintenanceDeleted> MaintenanceDeleted { get; set; }
        public DbSet<ModelPhotoForMaintenance> ModelPhotosForMaintenance { get; set; }
        public DbSet<SafetyWastePhotoForMaintenance> SafetyWastesForMaintenance { get; set; }
        public DbSet<SitePhotoForMaintenance> SitePhotosForMaintenance { get; set; }

        // ─── الطوارئ ────────────────────────────────────────────────────
        public DbSet<Emergency> Emergencys { get; set; }
        public DbSet<EmergencyDeleted> EmergencyDeleted { get; set; }
        public DbSet<ModelPhotoForEmergency> ModelPhotosForEmergency { get; set; }
        public DbSet<SafetyWastePhotoForEmergency> SafetyWastesForEmergency { get; set; }
        public DbSet<SitePhotoForEmergency> SitePhotosForEmergency { get; set; }

        // ─── سجل التغييرات ──────────────────────────────────────────────
        public DbSet<OperationChangeForNewProject> OperationChangeForNewProjects { get; set; }
        public DbSet<OperationChangeForPrivateProject> OperationChangeForPrivateProjects { get; set; }
        public DbSet<OperationChangeForConstruction> OperationChangeForConstructions { get; set; }
        public DbSet<OperationChangeForEmergency> OperationChangeForEmergencies { get; set; }
        public DbSet<OperationChangeForMaintenance> OperationChangeForMaintenances { get; set; }

        // ─── العقود وسير العمل ──────────────────────────────────────────
        public DbSet<Contract> Contracts { get; set; }
        public DbSet<WorkflowDepartment> WorkflowDepartments { get; set; }
        public DbSet<Workflow> Workflows { get; set; }
        public DbSet<WorkflowBasket> WorkflowBaskets { get; set; }
        public DbSet<BasketTask> BasketTasks { get; set; }
        public DbSet<WorkflowAuditLog> WorkflowAuditLogs { get; set; }
        public DbSet<WorkOrderPlacement> WorkOrderPlacements { get; set; }
        public DbSet<WorkOrderBasketHistory> WorkOrderBasketHistories { get; set; }
        public DbSet<WorkOrderTaskState> WorkOrderTaskStates { get; set; }
        public DbSet<UserDataScope> UserDataScopes { get; set; }
        public DbSet<ContractWorkOrderType> ContractWorkOrderTypes { get; set; }
        public DbSet<ContractTeamPermission> ContractTeamPermissions { get; set; }

        // ─────────── الربط بقوائم العقد عند الحفظ ───────────
        //
        // هنا لا في كل خدمة: أوامر العمل تُنشأ من مسارات كثيرة تمرّ كلّها
        // بالحفظ، فالربط في مكان واحد يعني أن لا مسار يُنسى — ولا يحتاج مسارٌ
        // جديد أن يتذكّر شيئاً.

        public override async Task<int> SaveChangesAsync(
            bool acceptAllChangesOnSuccess, CancellationToken cancellationToken = default)
        {
            await WorkOrderListLinker.LinkAsync(this, cancellationToken);
            return await base.SaveChangesAsync(acceptAllChangesOnSuccess, cancellationToken);
        }

        /// <summary>
        /// الحفظ المتزامن يمرّ بنفس الربط.
        ///
        /// بعض الشاشات القديمة تستدعي SaveChanges بلا await، وتركها بلا ربط
        /// يجعل أوامر عملها وحدها خارج التكامل.
        /// </summary>
        public override int SaveChanges(bool acceptAllChangesOnSuccess)
        {
            WorkOrderListLinker.LinkAsync(this, CancellationToken.None)
                .GetAwaiter().GetResult();

            return base.SaveChanges(acceptAllChangesOnSuccess);
        }
    }
}
