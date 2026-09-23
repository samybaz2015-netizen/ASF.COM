using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ASF.Core.Dtos
{
    public class OrderCompleteOrNoDto
    {
        public int CompletedOrdersCount { get; set; }
        public int NonCompletedOrdersCount { get; set; }
        public int CompletedOrderForRehabilitationWorks { get; set; }
        public int CompletedOrderForConstruction { get; set; }
        public int CompletedOrderForMaintenance { get; set; }
        public int CompletedOrderForEmergency { get; set; }
        public int CompletedOrderForPrivate { get; set; }
        public int NonCompletedOrderForRehabilitationWorks { get; set; }
        public int NonCompletedOrderForConstruction { get; set; }
        public int NonCompletedOrderForPrivate { get; set; }
        public int NonCompletedOrderForMaintance { get; set; }
        public int NonCompletedOrderForEmergency { get; set; }
        public int SupervisorCount { get; set; }
    }
}
