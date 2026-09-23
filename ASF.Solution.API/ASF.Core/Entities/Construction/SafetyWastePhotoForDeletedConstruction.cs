using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.Json.Serialization;
using System.Threading.Tasks;
using ASF.Core.Entities;

namespace ASF.Core.Entities.Construction
{
    public class SafetyWastePhotoForDeletedConstruction : IProjectPhoto
    {
        public int Id { get; set; }
        public string Url { get; set; }
        public int ConstructionId { get; set; }
        [JsonIgnore]

        public ConstructionDeleted Construction { get; set; }
    }
}
