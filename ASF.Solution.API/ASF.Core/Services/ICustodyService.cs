using System.Collections.Generic;
using System.Threading.Tasks;
using ASF.Core.Dtos;

namespace ASF.Core.Services
{
    public interface ICustodyService
    {
        Task<CustodyReadDto> OpenCustodyAsync(string currentUserId, CreateCustodyDto dto);
        Task<InvoiceReadDto> AddInvoiceAsync(int custodyId, AddInvoiceDto dto);
        Task<bool> CloseCustodyAsync(int custodyId, CloseCustodyDto dto);

        Task<CustodyReadDto?> GetCustodyAsync(int custodyId);
        Task<IEnumerable<CustodyReadDto>> GetCustodiesAsync(string? userId = null, bool includeClosed = true);
        Task<AggregateSummaryDto> GetAggregateAsync(string? userId = null);
    }
}
