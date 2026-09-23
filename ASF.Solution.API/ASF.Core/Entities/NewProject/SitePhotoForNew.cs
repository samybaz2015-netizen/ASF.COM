using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.Json.Serialization;
using System.Threading.Tasks;
using ASF.Core.Entities;

namespace ASF.Core.Entities.NewProject
{
    public class SitePhotoForNew : IProjectPhoto
    {
        public int Id { get; set; } 
        public string Url { get; set; } 
        public int NewProjectId { get; set; } 
        [JsonIgnore]

        public NewProject NewProject { get; set; } 
    }
}
