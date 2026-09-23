namespace ASF.Core.DTOs.Workflow
{
    /// <summary>
    /// صف تصدير أمر عمل بكل تفاصيله.
    ///
    /// يُبنى من نفس الفلتر والصلاحية اللذين يبنيان الجدول، فلا يحمل الملف
    /// المصدَّر صفاً واحداً خارج ما يحقّ للمستخدم رؤيته.
    ///
    /// الحقول الخاصة بنوع دون آخر تصل فارغة لمن لا يملكها بدل أن تُخترع له
    /// قيمة: الإنشاءات وحدها تحمل نسب الحفر والكابل، والصيانة والطوارئ وحدهما
    /// تحملان رقم البلاغ ورقم المهمة.
    /// </summary>
    public class WorkOrderExportRowDto
    {
        // التصنيف
        public string ProjectTypeCode { get; set; }
        public string? ProjectTypeLabel { get; set; }
        public int WorkOrderId { get; set; }

        // العقد والمسار
        public string? ContractNumber { get; set; }
        public string? ContractName { get; set; }
        public string? DepartmentName { get; set; }
        public string? BasketName { get; set; }
        public DateTime? EnteredBasketAt { get; set; }
        public int DaysInBasket { get; set; }

        // التعريف
        public string? OrderNumber { get; set; }

        /// <summary>حقول قالب الإنشاءات — فارغة لغيره.</summary>
        public string? WorkOrderCode { get; set; }
        public string? Priority { get; set; }
        public string? VoltageLevel { get; set; }
        public string? PlotNumber { get; set; }
        public string? PlanNumber { get; set; }
        public string? SubscriberName { get; set; }
        public DateTime? ApprovalDate { get; set; }
        public bool IsDraft { get; set; }

        public string? WorkOrderType { get; set; }
        public string? OrderType { get; set; }
        public string? WorkDescription { get; set; }
        public string? StationNumber { get; set; }

        // الموقع والأطراف
        public string? District { get; set; }
        public string? ProjectPlace { get; set; }
        public string? Office { get; set; }
        public string? BranchName { get; set; }
        public string? Contractor { get; set; }
        public string? Consultant { get; set; }
        public string? ProjectOwner { get; set; }
        public string? ProjectParty { get; set; }
        public string? Coordinates { get; set; }

        // التواريخ والمدد
        public DateTime? OrderDate { get; set; }
        public DateTime? ReceiveDateTime { get; set; }
        public DateTime? CreateAt { get; set; }
        public string? DurationOfImplementation { get; set; }
        public string? CompletionDate { get; set; }
        public string? NumberOfDaysDelayed { get; set; }
        public string? NumberOfDaysRemaining { get; set; }

        // القيم
        public string? EstimatedValue { get; set; }
        public string? ActualValue { get; set; }
        public string? ProjectValue { get; set; }
        public string? ExtractNumber { get; set; }

        // التنفيذ
        public string? Situation { get; set; }
        public string? ImplementationPhase { get; set; }

        /// <summary>نسبة الحفر — للإنشاءات فقط.</summary>
        public string? CompletionStatusReport { get; set; }

        /// <summary>نسبة الكابل — للإنشاءات فقط.</summary>
        public string? CableCompletion { get; set; }

        /// <summary>رقم البلاغ — للصيانة والطوارئ فقط.</summary>
        public string? NotificationNumber { get; set; }

        /// <summary>رقم المهمة — للصيانة والطوارئ فقط.</summary>
        public string? TaskNumber { get; set; }

        // السلامة والاعتماد
        public bool SafetyViolationsExist { get; set; }
        public string? DescriptionViolation { get; set; }
        public string? TypeOfStomachTest { get; set; }
        public int? NumberOfEquipment { get; set; }
        public bool? IsApprove { get; set; }
        public string? RejectionReason { get; set; }
        public bool IsArchived { get; set; }

        // أخرى
        public string? UserName { get; set; }
        public string? Note { get; set; }

        /// <summary>المهام الإلزامية المنجزة من إجمالي مهام السلة الحالية.</summary>
        public int MandatoryTasksDone { get; set; }
        public int MandatoryTasksTotal { get; set; }
    }
}
