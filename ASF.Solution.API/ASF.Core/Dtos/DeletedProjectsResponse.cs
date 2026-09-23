using ASF.Core.Entities.Construction;
using ASF.Core.Entities.Emergency;
using ASF.Core.Entities.Maintenance;
using ASF.Core.Entities.NewProject;
using ASF.Core.Entities.PrivateProject;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ASF.Core.Dtos
{
    public class DeletedProjectsResponse
    {
        public List<NewProjectDeleted> RehabilitationWorks { get; set; }
        public List<PrivateProjectDeleted> PrivateProjects { get; set; }
        public List<ConstructionDeleted> Constructions { get; set; }
        public List<EmergencyDeleted> Emergencies { get; set; }
        public List<MaintenanceDeleted> Maintenances { get; set; }
    }


}
