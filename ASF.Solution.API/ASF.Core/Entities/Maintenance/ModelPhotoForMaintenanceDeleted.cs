using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.Json.Serialization;
using System.Threading.Tasks;
using ASF.Core.Entities;

namespace ASF.Core.Entities.Maintenance
{
    public class ModelPhotoForMaintenanceDeleted : IProjectPhoto
    {
        public int Id { get; set; }
        public string Url { get; set; }
        public int MaintenanceId { get; set; }
        [JsonIgnore]

        public MaintenanceDeleted Maintenance { get; set; }
    }
}
