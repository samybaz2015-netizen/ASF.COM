using ASF.Core.Dtos;
using ASF.Core.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ASF.Core.Services
{
    public interface IContactService
    {
        public Task<Contact> CreateContactAsync(ContactDto contactDto);
        public Task<IReadOnlyList<ContactDto>> GetContactsAsync();
        public Task<bool> DeleteContactAsync(int id); 

    }
}
