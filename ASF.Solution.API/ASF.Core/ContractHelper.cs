using System;

namespace ASF.Core
{
    public static class ContractHelper
    {
        public static readonly DateTime CutoffDate = new DateTime(2026, 5, 31, 23, 59, 59);

        public const string RiyadhOldContract = "4400020628";
        public const string RiyadhNewContract = "4400023815";

        public const string JeddahOldContract = "4400020593";
        public const string JeddahNewContract = "4400023825";

        /// <summary>
        /// يحسب رقم العقد تلقائياً بناءً على الفرع، المكتب، مكان المشروع، وتاريخ الإسناد
        /// </summary>
        public static string? GetContractNumber(string? branchName, string? office, string? projectPlace, DateTime? assignmentDate)
        {
            var date = assignmentDate ?? DateTime.Today;
            string combined = $"{branchName ?? ""} {office ?? ""} {projectPlace ?? ""}".Trim();

            if (string.IsNullOrWhiteSpace(combined))
                return null;

            bool isRiyadh = combined.Contains("الرياض", StringComparison.OrdinalIgnoreCase) ||
                            combined.Contains("Riyadh", StringComparison.OrdinalIgnoreCase);

            bool isJeddah = combined.Contains("جدة", StringComparison.OrdinalIgnoreCase) ||
                            combined.Contains("Jeddah", StringComparison.OrdinalIgnoreCase);

            if (isRiyadh)
            {
                return date <= CutoffDate ? RiyadhOldContract : RiyadhNewContract;
            }

            if (isJeddah)
            {
                return date <= CutoffDate ? JeddahOldContract : JeddahNewContract;
            }

            return null;
        }

        public static string? GetContractNumber(string? location, DateTime? assignmentDate)
        {
            return GetContractNumber(location, null, null, assignmentDate);
        }
    }
}
