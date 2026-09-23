using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.Json.Serialization;
using System.Threading.Tasks;
using ASF.Core.Entities;

namespace ASF.Core.Entities.Emergency
{
    public class SitePhotoForDeletedEmergency : IProjectPhoto
    {
        public int Id { get; set; }
        public string Url { get; set; }
        public int EmergencyId { get; set; }
        [JsonIgnore]

        public EmergencyDeleted Emergency { get; set; }
    }
}
