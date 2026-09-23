using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.Json.Serialization;
using System.Threading.Tasks;
using ASF.Core.Entities;

namespace ASF.Core.Entities.PrivateProject
{
    public class SitePhotoForPrivate : IProjectPhoto
    {
        public int Id { get; set; }
        public string Url { get; set; }
        public int PrivateProjectId { get; set; }
        [JsonIgnore]

        public PrivateProject PrivateProject { get; set; }
    }
}
