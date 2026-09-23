using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ASF.Core.Dtos
{
    public class OperationChangeDto
    {
        public int Id { get; set; }
        public int OperationId { get; set; }
        public string UserName { get; set; }
        public DateTime ChangeDate { get; set; }
        public string UserProfileImage { get; set; }
        public string ChangeDescription { get; set; }
        public string? ItemNumber { get; set; }
        public string? ItemDescription { get; set; }
    }
}
