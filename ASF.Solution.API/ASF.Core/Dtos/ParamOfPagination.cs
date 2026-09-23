using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ASF.Core.Dtos
{
    public class ParamOfPagination
    {
        private const int maxSize = 10;
        private int _pageSize = maxSize;

        public bool? isArchive { get; set; }
        public int? sort { get; set; }
        public string? eng { get; set; }
        public string? branchName { get; set; }

        public bool? typeProject { get; set; }

        public int pageSize
        {
            get { return _pageSize; }
            set { _pageSize=(value>maxSize) ? maxSize : value; }
        }

        public int pageIndex { get; set; } = 1;
    }
}
