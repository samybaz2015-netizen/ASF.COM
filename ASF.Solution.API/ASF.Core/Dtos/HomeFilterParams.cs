using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ASF.Core.Dtos
{
    public class HomeFilterParams
    {
        public string? BranchName { get; set; }
        public string? Office { get; set; }
        public string? FaultNumber { get; set; }      // رقم الطلب
        public string? WorkOrderType { get; set; }    // رقم أمر العمل
        public string? Situation { get; set; }
        public string? ContractNumber { get; set; }
        public List<string>? ContractNumbers { get; set; }
        public int PageIndex { get; set; } = 1;
        public int PageSize { get; set; } = 10;
    }
    public class PaginatedResult<T>
    {
        public int TotalCount { get; set; }
        public int PageIndex { get; set; }
        public int PageSize { get; set; }
        public int TotalPages => (int)Math.Ceiling((double)TotalCount / PageSize);
        public IEnumerable<T> Data { get; set; }
    }
}
