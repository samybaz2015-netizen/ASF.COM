namespace ASF.Core.Entities
{
    /// <summary>
    /// كل الصلاحيات الموجودة في النظام
    /// Admin بيختار منها ويضيفها لأي يوزر
    /// </summary>
    public static class Permissions
    {
        // ==================== الإنشاءات ====================
        public static class Construction
        {
            public const string View = "Construction.View";
            public const string Create = "Construction.Create";
            public const string Update = "Construction.Update";
            public const string Delete = "Construction.Delete";
            public const string Approve = "Construction.Approve";
            public const string Archive = "Construction.Archive";
            public const string Return = "Construction.Return";
            public const string Reject = "Construction.Reject";
            public const string Export = "Construction.Export";
            public const string Print = "Construction.Print";
        }

        // ==================== الطوارئ ====================
        public static class Emergency
        {
            public const string View = "Emergency.View";
            public const string Create = "Emergency.Create";
            public const string Update = "Emergency.Update";
            public const string Delete = "Emergency.Delete";
            public const string Approve = "Emergency.Approve";
            public const string Archive = "Emergency.Archive";
            public const string Return = "Emergency.Return";
            public const string Reject = "Emergency.Reject";
            public const string Export = "Emergency.Export";
            public const string Print = "Emergency.Print";
        }

        // ==================== الصيانة ====================
        public static class Maintenance
        {
            public const string View = "Maintenance.View";
            public const string Create = "Maintenance.Create";
            public const string Update = "Maintenance.Update";
            public const string Delete = "Maintenance.Delete";
            public const string Approve = "Maintenance.Approve";
            public const string Archive = "Maintenance.Archive";
            public const string Return = "Maintenance.Return";
            public const string Reject = "Maintenance.Reject";
            public const string Export = "Maintenance.Export";
            public const string Print = "Maintenance.Print";
        }

        // ==================== أعمال التأهيل ====================
        public static class NewProject
        {
            public const string View = "NewProject.View";
            public const string Create = "NewProject.Create";
            public const string Update = "NewProject.Update";
            public const string Delete = "NewProject.Delete";
            public const string Approve = "NewProject.Approve";
            public const string Archive = "NewProject.Archive";
            public const string Return = "NewProject.Return";
            public const string Reject = "NewProject.Reject";
            public const string Export = "NewProject.Export";
            public const string Print = "NewProject.Print";
        }

        // ==================== المشاريع الخاصة ====================
        public static class PrivateProject
        {
            public const string View = "PrivateProject.View";
            public const string Create = "PrivateProject.Create";
            public const string Update = "PrivateProject.Update";
            public const string Delete = "PrivateProject.Delete";
            public const string Approve = "PrivateProject.Approve";
            public const string Archive = "PrivateProject.Archive";
            public const string Return = "PrivateProject.Return";
            public const string Reject = "PrivateProject.Reject";
            public const string Export = "PrivateProject.Export";
            public const string Print = "PrivateProject.Print";
        }

        // ==================== الحضور والانصراف ====================
        public static class Attendance
        {
            public const string View = "Attendance.View";
            public const string CheckIn = "Attendance.CheckIn";
            public const string CheckOut = "Attendance.CheckOut";
            public const string AddNote = "Attendance.AddNote";
        }

        // ==================== طلبات الإجازة ====================
        public static class LeaveRequest
        {
            public const string View = "LeaveRequest.View";
            public const string Create = "LeaveRequest.Create";
            public const string Approve = "LeaveRequest.Approve";
            public const string Delete = "LeaveRequest.Delete";
        }

        // ==================== العهد ====================
        public static class Custody
        {
            public const string View = "Custody.View";
            public const string Create = "Custody.Create";
            public const string AddInvoice = "Custody.AddInvoice";
            public const string Close = "Custody.Close";
        }

        // ==================== الموظفون ====================
        public static class Employees
        {
            public const string View = "Employees.View";
            public const string Create = "Employees.Create";
            public const string Update = "Employees.Update";
            public const string Delete = "Employees.Delete";
        }

        // ==================== الفروع ====================
        public static class Branch
        {
            public const string View = "Branch.View";
            public const string Create = "Branch.Create";
            public const string Update = "Branch.Update";
            public const string Delete = "Branch.Delete";
        }

        // ==================== المكاتب ====================
        public static class Office
        {
            public const string View = "Office.View";
            public const string Create = "Office.Create";
            public const string Update = "Office.Update";
            public const string Delete = "Office.Delete";
        }

        // ==================== الأحياء ====================
        public static class Neighborhood
        {
            public const string View = "Neighborhood.View";
            public const string Create = "Neighborhood.Create";
            public const string Update = "Neighborhood.Update";
            public const string Delete = "Neighborhood.Delete";
        }

        // ==================== الاستشاريون ====================
        public static class Consultant
        {
            public const string View = "Consultant.View";
            public const string Create = "Consultant.Create";
            public const string Update = "Consultant.Update";
            public const string Delete = "Consultant.Delete";
        }

        // ==================== المقاولون ====================
        public static class Contractor
        {
            public const string View = "Contractor.View";
            public const string Create = "Contractor.Create";
            public const string Update = "Contractor.Update";
            public const string Delete = "Contractor.Delete";
        }

        // ==================== أنواع أوامر العمل ====================
        public static class WorkOrderType
        {
            public const string View = "WorkOrderType.View";
            public const string Create = "WorkOrderType.Create";
            public const string Update = "WorkOrderType.Update";
            public const string Delete = "WorkOrderType.Delete";
        }

        // ==================== الوصف الوظيفي ====================
        public static class JobDescription
        {
            public const string View = "JobDescription.View";
            public const string Create = "JobDescription.Create";
            public const string Update = "JobDescription.Update";
            public const string Delete = "JobDescription.Delete";
        }

        // ==================== الإشعارات ====================
        public static class Notifications
        {
            public const string View = "Notifications.View";
            public const string Delete = "Notifications.Delete";
        }

        // ==================== مالك المشروع ====================
        public static class ProjectOwner
        {
            public const string View = "ProjectOwner.View";
            public const string Create = "ProjectOwner.Create";
            public const string Update = "ProjectOwner.Update";
            public const string Delete = "ProjectOwner.Delete";
        }

        // ==================== البنود التسعيرية ====================
        public static class PricingItems
        {
            public const string View = "PricingItems.View";
            public const string Create = "PricingItems.Create";
            public const string Update = "PricingItems.Update";
            public const string Delete = "PricingItems.Delete";
        }

        // ==================== أطراف المشروع (مقاول/مهندس/مشرف) ====================
        public static class ProjectParty
        {
            public const string View = "ProjectParty.View";
            public const string Create = "ProjectParty.Create";
            public const string Update = "ProjectParty.Update";
            public const string Delete = "ProjectParty.Delete";
        }

        // ==================== إدارة المستخدمين والصلاحيات ====================
        public static class Users
        {
            public const string View = "Users.View";
            public const string Create = "Users.Create";
            public const string Update = "Users.Update";
            public const string Delete = "Users.Delete";
            public const string ManagePermissions = "Users.ManagePermissions";
        }

        // ==================== التقارير ====================
        public static class Reports
        {
            public const string View = "Reports.View";
            public const string Export = "Reports.Export";
            public const string Print = "Reports.Print";
        }

        // ==================== تحديث التنفيذ اليومي ====================
        public static class DailyExecution
        {
            public const string View = "DailyExecution.View";
            public const string Create = "DailyExecution.Create";
            public const string EditDraft = "DailyExecution.EditDraft";
            public const string Delete = "DailyExecution.Delete";
            public const string AddItem = "DailyExecution.AddItem";
            public const string UploadPhotos = "DailyExecution.UploadPhotos";
            public const string UploadForms = "DailyExecution.UploadForms";
            public const string Submit = "DailyExecution.Submit";
            public const string Review = "DailyExecution.Review";
            public const string Approve = "DailyExecution.Approve";
            public const string Return = "DailyExecution.Return";
            public const string Reject = "DailyExecution.Reject";
            public const string ViewAll = "DailyExecution.ViewAll";
            public const string ViewDues = "DailyExecution.ViewDues";
            public const string ExceedPlanned = "DailyExecution.ExceedPlanned";
            public const string Export = "DailyExecution.Export";
        }

        /// <summary>
        /// إدارة الأقسام والسلال من إعدادات العقد.
        /// </summary>
        public static class ContractWorkflow
        {
            public const string View = "ContractWorkflow.View";
            public const string ManageContracts = "ContractWorkflow.ManageContracts";
            public const string ManageDepartments = "ContractWorkflow.ManageDepartments";
            public const string ManageBaskets = "ContractWorkflow.ManageBaskets";
            public const string ReorderBaskets = "ContractWorkflow.ReorderBaskets";
            public const string ManageTasks = "ContractWorkflow.ManageTasks";
            public const string Publish = "ContractWorkflow.Publish";
            public const string ViewAuditLog = "ContractWorkflow.ViewAuditLog";
            public const string MoveWorkOrder = "ContractWorkflow.MoveWorkOrder";
        }

        /// <summary>
        /// بترجع كل الصلاحيات كـ List عشان Admin يشوفها
        /// </summary>
        public static List<string> GetAll()
        {
            return new List<string>
            {
                Construction.View, Construction.Create, Construction.Update,
                Construction.Delete, Construction.Approve, Construction.Archive,
                Construction.Return, Construction.Reject, Construction.Export, Construction.Print,

                Emergency.View, Emergency.Create, Emergency.Update,
                Emergency.Delete, Emergency.Approve, Emergency.Archive,
                Emergency.Return, Emergency.Reject, Emergency.Export, Emergency.Print,

                Maintenance.View, Maintenance.Create, Maintenance.Update,
                Maintenance.Delete, Maintenance.Approve, Maintenance.Archive,
                Maintenance.Return, Maintenance.Reject, Maintenance.Export, Maintenance.Print,

                NewProject.View, NewProject.Create, NewProject.Update,
                NewProject.Delete, NewProject.Approve, NewProject.Archive,
                NewProject.Return, NewProject.Reject, NewProject.Export, NewProject.Print,

                PrivateProject.View, PrivateProject.Create, PrivateProject.Update,
                PrivateProject.Delete, PrivateProject.Approve, PrivateProject.Archive,
                PrivateProject.Return, PrivateProject.Reject, PrivateProject.Export, PrivateProject.Print,

                Attendance.View, Attendance.CheckIn, Attendance.CheckOut, Attendance.AddNote,

                LeaveRequest.View, LeaveRequest.Create, LeaveRequest.Approve, LeaveRequest.Delete,

                Custody.View, Custody.Create, Custody.AddInvoice, Custody.Close,

                Employees.View, Employees.Create, Employees.Update, Employees.Delete,

                Branch.View, Branch.Create, Branch.Update, Branch.Delete,

                Office.View, Office.Create, Office.Update, Office.Delete,

                Neighborhood.View, Neighborhood.Create, Neighborhood.Update, Neighborhood.Delete,

                Consultant.View, Consultant.Create, Consultant.Update, Consultant.Delete,

                Contractor.View, Contractor.Create, Contractor.Update, Contractor.Delete,

                WorkOrderType.View, WorkOrderType.Create, WorkOrderType.Update, WorkOrderType.Delete,

                JobDescription.View, JobDescription.Create, JobDescription.Update, JobDescription.Delete,

                ProjectOwner.View, ProjectOwner.Create, ProjectOwner.Update, ProjectOwner.Delete,

                ProjectParty.View, ProjectParty.Create, ProjectParty.Update, ProjectParty.Delete,

                PricingItems.View, PricingItems.Create, PricingItems.Update, PricingItems.Delete,

                Notifications.View, Notifications.Delete,

                Users.View, Users.Create, Users.Update, Users.Delete, Users.ManagePermissions,

                Reports.View, Reports.Export, Reports.Print,

                DailyExecution.View, DailyExecution.Create, DailyExecution.EditDraft,
                DailyExecution.Delete, DailyExecution.AddItem, DailyExecution.UploadPhotos,
                DailyExecution.UploadForms, DailyExecution.Submit, DailyExecution.Review,
                DailyExecution.Approve, DailyExecution.Return, DailyExecution.Reject,
                DailyExecution.ViewAll, DailyExecution.ViewDues, DailyExecution.ExceedPlanned,
                DailyExecution.Export,

                ContractWorkflow.View, ContractWorkflow.ManageContracts,
                ContractWorkflow.ManageDepartments, ContractWorkflow.ManageBaskets,
                ContractWorkflow.ReorderBaskets, ContractWorkflow.ManageTasks,
                ContractWorkflow.Publish, ContractWorkflow.ViewAuditLog,
                ContractWorkflow.MoveWorkOrder,
            };
        }
    }
}