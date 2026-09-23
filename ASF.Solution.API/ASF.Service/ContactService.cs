//using AutoMapper;
//using ASF.Core.Dtos;
//using ASF.Core.Entities;
//using ASF.Core.Repository;
//using ASF.Core.Services;
//using System;
//using System.Collections.Generic;
//using System.Linq;
//using System.Text;
//using System.Threading.Tasks;

//namespace ASF.Service
//{
//    public class ContactService : IContactService
//    {
//        private readonly IGenericRepository<Contact> _contactRepository;
//        private readonly IMapper _mapper;

//        public ContactService(IGenericRepository<Contact> contactRepository ,IMapper mapper)
//        {
//            _contactRepository=contactRepository;
//            _mapper=mapper;
//        }
//        public async Task<Contact> CreateContactAsync(ContactDto contactDto)
//        {
//            var contact = _mapper.Map<Contact>(contactDto);

//            await _contactRepository.AddAsync(contact);

//            return contact;
//        }


//        public async Task<bool> DeleteContactAsync(int id)
//        {
//            var contact = await _contactRepository.GetByIdAsync(id);

//            if ( contact==null )
//            {
//                return false; 
//            }

//            await _contactRepository.DeleteAsync(contact);

//            return true; 
//        }


//        public async Task<IReadOnlyList<ContactDto>> GetContactsAsync()
//        {
//            var contacts = await _contactRepository.GetAllAsync();

//            var contactDtos = _mapper.Map<IReadOnlyList<ContactDto>>(contacts);

//            return contactDtos;
//        }


//    }
//}
using AutoMapper;
using ASF.Core.Dtos;
using ASF.Core.Entities;
using ASF.Core.Repository;
using ASF.Core.Services;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ASF.Service
{
    public class ContactService : IContactService
    {
        private readonly IGenericRepository<Contact> _contactRepository;
        private readonly IMapper _mapper;

        public ContactService(IGenericRepository<Contact> contactRepository, IMapper mapper)
        {
            _contactRepository = contactRepository;
            _mapper = mapper;
        }
        public async Task<Contact> CreateContactAsync(ContactDto contactDto)
        {
            var contact = _mapper.Map<Contact>(contactDto);

            await _contactRepository.AddAsync(contact);

            return contact;
        }


        public async Task<bool> DeleteContactAsync(int id)
        {
            var contact = await _contactRepository.GetByIdAsync(id);

            if (contact == null)
            {
                return false;
            }

            await _contactRepository.DeleteAsync(contact);

            return true;
        }


        public async Task<IReadOnlyList<ContactDto>> GetContactsAsync()
        {
            var contacts = await _contactRepository.GetAllAsync();

            var contactDtos = _mapper.Map<IReadOnlyList<ContactDto>>(contacts);

            return contactDtos;
        }


    }
}
