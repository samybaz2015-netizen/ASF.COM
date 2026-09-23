//using Microsoft.AspNetCore.Identity;
//using Microsoft.EntityFrameworkCore;
//using ASF.Core.Dtos;
//using ASF.Core.Entities;
//using ASF.Core.Entities.Identity;
//using ASF.Core.Services;
//using ASF.Repository.AppDbContext;
//using ASF.Repository.Identity;
//using System;
//using System.Collections.Generic;
//using System.Linq;
//using System.Threading.Tasks;

//namespace ASF.Service
//{
//    public class CustodyService : ICustodyService
//    {
//        private readonly ApplicationDbContext _db;
//        private readonly AppIdentityDbContext _context;
//        private readonly UserManager<AppUser> _userManager;

//        public CustodyService(ApplicationDbContext db, UserManager<AppUser> userManager, AppIdentityDbContext context)
//        {
//            _db = db;
//            _userManager = userManager;
//            _context = context;
//        }

//        public async Task<CustodyReadDto> OpenCustodyAsync(string currentUserId, CreateCustodyDto dto)
//        {
//            var custodianId = dto.CustodianUserId ?? currentUserId;
//            var user = await _context.Users.FirstOrDefaultAsync(d => d.Id == custodianId)
//                ?? throw new KeyNotFoundException("Custodian user not found.");

//            var custody = new Custody
//            {
//                CustodianUserId = user.Id,
//                AdvanceAmount = dto.AdvanceAmount,
//                Notes = dto.Notes,
//                Status = "Open",
//                CreatedAt = DateTime.UtcNow
//            };

//            _db.Custodies.Add(custody);
//            await _db.SaveChangesAsync();
//            return await MapCustody(custody.Id);
//        }

//        public async Task<InvoiceReadDto> AddInvoiceAsync(int custodyId, AddInvoiceDto dto)
//        {
//            var custody = await _db.Custodies
//                .Include(c => c.Invoices)
//                .FirstOrDefaultAsync(c => c.Id == custodyId)
//                ?? throw new KeyNotFoundException("Custody not found.");

//            if (!string.Equals(custody.Status, "Open", StringComparison.OrdinalIgnoreCase))
//                throw new InvalidOperationException("Cannot add invoice to a closed custody.");

//            if (dto.Quantity <= 0 || dto.UnitPrice < 0)
//                throw new ArgumentException("Invalid quantity or price.");

//            var currentSpent = custody.Invoices.Sum(i => i.LineTotal);
//            var remainingBefore = Math.Round(custody.AdvanceAmount - currentSpent, 2);

//            if (remainingBefore <= 0)
//                throw new InvalidOperationException("Custody balance is zero; you cannot add more invoices.");

//            var nextSeq = custody.Invoices.Any()
//                ? custody.Invoices.Max(i => i.SequenceNo) + 1
//                : 1;

//            var unitAfterVat = Math.Round(dto.UnitPrice * (1 + (dto.VatRatePercent / 100m)), 2);
//            var lineTotal = Math.Round(unitAfterVat * dto.Quantity, 2);

//            if (lineTotal > remainingBefore)
//                throw new InvalidOperationException($"Invoice total ({lineTotal}) exceeds remaining balance ({remainingBefore}).");

//            var inv = new CustodyInvoice
//            {
//                CustodyId = custodyId,
//                SequenceNo = nextSeq,
//                InvoiceNumber = dto.InvoiceNumber,
//                InvoiceDate = dto.InvoiceDate,
//                ItemDescription = dto.ItemDescription,
//                Quantity = dto.Quantity,
//                UnitPrice = dto.UnitPrice,
//                VatRatePercent = dto.VatRatePercent,
//                UnitPriceAfterVat = unitAfterVat,
//                LineTotal = lineTotal,
//                CreatedAt = DateTime.UtcNow
//            };

//            _db.CustodyInvoices.Add(inv);
//            await _db.SaveChangesAsync();

//            await TryAutoCloseAndNotifyAsync(custodyId);

//            return new InvoiceReadDto
//            {
//                Id = inv.Id,
//                SequenceNo = inv.SequenceNo,
//                InvoiceNumber = inv.InvoiceNumber,
//                InvoiceDate = inv.InvoiceDate,
//                ItemDescription = inv.ItemDescription,
//                Quantity = inv.Quantity,
//                UnitPrice = inv.UnitPrice,
//                VatRatePercent = inv.VatRatePercent,
//                UnitPriceAfterVat = inv.UnitPriceAfterVat,
//                LineTotal = inv.LineTotal
//            };
//        }

//        public async Task<bool> CloseCustodyAsync(int custodyId, CloseCustodyDto dto)
//        {
//            var custody = await _db.Custodies.Include(c => c.Invoices)
//                .FirstOrDefaultAsync(c => c.Id == custodyId)
//                ?? throw new KeyNotFoundException("Custody not found.");

//            if (string.Equals(custody.Status, "Closed", StringComparison.OrdinalIgnoreCase))
//                return true;

//            custody.Status = "Closed";
//            custody.ClosedAt = dto.ClosedAt ?? DateTime.UtcNow;
//            custody.Notes = dto.Notes ?? custody.Notes;

//            _db.Custodies.Update(custody);
//            await _db.SaveChangesAsync();

//            await SendCloseNotificationsAsync(custodyId);
//            return true;
//        }

//        public async Task<CustodyReadDto?> GetCustodyAsync(int custodyId)
//            => await MapCustody(custodyId);

//        public async Task<IEnumerable<CustodyReadDto>> GetCustodiesAsync(string? userId = null, bool includeClosed = true)
//        {
//            var q = _db.Custodies.AsQueryable();
//            if (!string.IsNullOrWhiteSpace(userId))
//                q = q.Where(c => c.CustodianUserId == userId);

//            if (!includeClosed)
//                q = q.Where(c => c.Status == "Open");

//            var ids = await q.OrderByDescending(c => c.CreatedAt)
//                             .Select(c => c.Id).ToListAsync();

//            var list = new List<CustodyReadDto>();
//            foreach (var id in ids)
//                list.Add(await MapCustody(id));

//            return list;
//        }

//        public async Task<AggregateSummaryDto> GetAggregateAsync(string? userId = null)
//        {
//            var q = _db.Custodies.Include(c => c.Invoices).AsQueryable();
//            if (!string.IsNullOrWhiteSpace(userId))
//                q = q.Where(c => c.CustodianUserId == userId);

//            var custodies = await q.ToListAsync();

//            var totalAdvance = custodies.Sum(c => c.AdvanceAmount);
//            var allInvoices = custodies.SelectMany(c => c.Invoices).ToList();

//            var subtotalBeforeVat = allInvoices.Sum(i => Math.Round(i.Quantity * i.UnitPrice, 2));
//            var totalAfterVat = allInvoices.Sum(i => i.LineTotal);
//            var totalVat = Math.Round(totalAfterVat - subtotalBeforeVat, 2);

//            var openCustodies = custodies.Where(c => c.Status == "Open").ToList();
//            var remainingOpen = openCustodies.Sum(c => c.AdvanceAmount - c.Invoices.Sum(i => i.LineTotal));

//            var a = new AggregateSummaryDto
//            {
//                CustodianUserId = userId,
//                CustodianName = null,
//                OpenCustodiesCount = openCustodies.Count,
//                ClosedCustodiesCount = custodies.Count - openCustodies.Count,
//                TotalInvoicesCount = allInvoices.Count,
//                TotalAdvanceAmount = Math.Round(totalAdvance, 2),
//                SubtotalBeforeVat = Math.Round(subtotalBeforeVat, 2),
//                TotalVat = Math.Round(totalVat, 2),
//                GrandTotal = Math.Round(totalAfterVat, 2),
//                RemainingAcrossOpenCustodies = Math.Round(remainingOpen, 2)
//            };

//            if (!string.IsNullOrWhiteSpace(userId))
//            {
//                var u = await _userManager.FindByIdAsync(userId);
//                a.CustodianName = u?.DisplayName ?? u?.UserName;
//            }

//            return a;
//        }

//        // ================= Helpers =================

//        private async Task TryAutoCloseAndNotifyAsync(int custodyId)
//        {
//            var custody = await _db.Custodies.Include(c => c.Invoices)
//                                             .FirstOrDefaultAsync(c => c.Id == custodyId);
//            if (custody == null) return; // تأكد أن هذا السطر لا يحمل مسافات/أخطاء

//            var spent = custody.Invoices.Sum(i => i.LineTotal);
//            var remaining = Math.Round(custody.AdvanceAmount - spent, 2);

//            if (remaining <= 0 && !string.Equals(custody.Status, "Closed", StringComparison.OrdinalIgnoreCase))
//            {
//                custody.Status = "Closed";
//                custody.ClosedAt = DateTime.UtcNow;
//                _db.Custodies.Update(custody);
//                await _db.SaveChangesAsync();

//                await SendCloseNotificationsAsync(custodyId);
//            }
//        }

//        private async Task SendCloseNotificationsAsync(int custodyId)
//        {
//            var custody = await _db.Custodies.FirstOrDefaultAsync(c => c.Id == custodyId);
//            if (custody == null) return;

//            var custodian = await _context.Users.FirstOrDefaultAsync(u => u.Id == custody.CustodianUserId);
//            var custodianName = custodian?.DisplayName ?? custodian?.UserName ?? "User";
//            var message = $"تم إغلاق العهدة رقم {custody.Id} للموظف {custodianName} بعد استهلاك كامل السلفة.";
//            var now = DateTime.UtcNow;

//            // لو مشروعك أقل من .NET 6 ومش عندك DistinctBy، استخدم GroupBy
//            var adminsUpper = await _userManager.GetUsersInRoleAsync("Admin");
//            var adminsLower = await _userManager.GetUsersInRoleAsync("admin");
//            var admins = adminsUpper.Concat(adminsLower).GroupBy(u => u.Id).Select(g => g.First()).ToList();

//            var notifications = new List<Notification>();

//            // للإدمنز
//            notifications.AddRange(admins.Select(a => new Notification
//            {
//                Message = message,
//                UserName = custodianName,
//                UserImage = custodian?.UserImage,
//                CreatedAt = now,
//                NotificationType = "إغلاق عهدة",
//                Target = a.Id
//            }));

//            // لصاحب العهدة
//            if (custodian != null)
//            {
//                notifications.Add(new Notification
//                {
//                    Message = $"تم إغلاق عهدتك رقم {custody.Id} بعد وصول الرصيد إلى صفر.",
//                    UserName = custodianName,
//                    UserImage = custodian.UserImage,
//                    CreatedAt = now,
//                    NotificationType = "إغلاق عهدة",
//                    Target = custodian.Id
//                });
//            }

//            if (notifications.Count > 0)
//            {
//                // NOTE: لو جدول Notifications في AppIdentityDbContext بدل ApplicationDbContext غيّر السطر التالي إلى _context.Notifications
//                await _db.Notifications.AddRangeAsync(notifications);
//                await _db.SaveChangesAsync();
//            }
//        }

//        private async Task<CustodyReadDto> MapCustody(int id)
//        {
//            var c = await _db.Custodies
//                .Include(c => c.Invoices)
//                .FirstOrDefaultAsync(c => c.Id == id)
//                ?? throw new KeyNotFoundException("Custody not found.");

//            var subtotalBeforeVat = c.Invoices.Sum(i => Math.Round(i.Quantity * i.UnitPrice, 2));
//            var grand = c.Invoices.Sum(i => i.LineTotal);
//            var vat = Math.Round(grand - subtotalBeforeVat, 2);

//            var user = await _context.Users.FirstOrDefaultAsync(d => d.Id == c.CustodianUserId);

//            return new CustodyReadDto
//            {
//                Id = c.Id,
//                CustodianUserId = c.CustodianUserId,
//                CustodianName = user?.DisplayName ?? user?.UserName,
//                AdvanceAmount = Math.Round(c.AdvanceAmount, 2),
//                Status = c.Status,
//                CreatedAt = c.CreatedAt,
//                ClosedAt = c.ClosedAt,
//                Notes = c.Notes,
//                InvoicesCount = c.Invoices.Count,
//                SubtotalBeforeVat = Math.Round(subtotalBeforeVat, 2),
//                TotalVat = vat,
//                GrandTotal = Math.Round(grand, 2),
//                RemainingToSettle = Math.Round(c.AdvanceAmount - grand, 2),
//                Invoices = c.Invoices
//                    .OrderBy(i => i.SequenceNo)
//                    .Select(i => new InvoiceReadDto
//                    {
//                        Id = i.Id,
//                        SequenceNo = i.SequenceNo,
//                        InvoiceNumber = i.InvoiceNumber,
//                        InvoiceDate = i.InvoiceDate,
//                        ItemDescription = i.ItemDescription,
//                        Quantity = i.Quantity,
//                        UnitPrice = i.UnitPrice,
//                        VatRatePercent = i.VatRatePercent,
//                        UnitPriceAfterVat = i.UnitPriceAfterVat,
//                        LineTotal = i.LineTotal
//                    }).ToList()
//            };
//        }
//    }
//}
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using ASF.Core.Dtos;
using ASF.Core.Entities;
using ASF.Core.Entities.Identity;
using ASF.Core.Services;
using ASF.Repository.AppDbContext;
using ASF.Repository.Identity;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ASF.Service
{
    public class CustodyService : ICustodyService
    {
        private readonly ApplicationDbContext _db;
        private readonly AppIdentityDbContext _context;
        private readonly UserManager<AppUser> _userManager;

        public CustodyService(ApplicationDbContext db, UserManager<AppUser> userManager, AppIdentityDbContext context)
        {
            _db = db;
            _userManager = userManager;
            _context = context;
        }

        public async Task<CustodyReadDto> OpenCustodyAsync(string currentUserId, CreateCustodyDto dto)
        {
            var custodianId = dto.CustodianUserId ?? currentUserId;
            var user = await _context.Users.FirstOrDefaultAsync(d => d.Id == custodianId)
                ?? throw new KeyNotFoundException("Custodian user not found.");

            var custody = new Custody
            {
                CustodianUserId = user.Id,
                AdvanceAmount = dto.AdvanceAmount,
                Notes = dto.Notes,
                Status = "Open",
                CreatedAt = DateTime.UtcNow
            };

            _db.Custodies.Add(custody);
            await _db.SaveChangesAsync();
            return await MapCustody(custody.Id);
        }

        public async Task<InvoiceReadDto> AddInvoiceAsync(int custodyId, AddInvoiceDto dto)
        {
            var custody = await _db.Custodies
                .Include(c => c.Invoices)
                .FirstOrDefaultAsync(c => c.Id == custodyId)
                ?? throw new KeyNotFoundException("Custody not found.");

            if (!string.Equals(custody.Status, "Open", StringComparison.OrdinalIgnoreCase))
                throw new InvalidOperationException("Cannot add invoice to a closed custody.");

            if (dto.Quantity <= 0 || dto.UnitPrice < 0)
                throw new ArgumentException("Invalid quantity or price.");

            var currentSpent = custody.Invoices.Sum(i => i.LineTotal);
            var remainingBefore = Math.Round(custody.AdvanceAmount - currentSpent, 2);

            if (remainingBefore <= 0)
                throw new InvalidOperationException("Custody balance is zero; you cannot add more invoices.");

            var nextSeq = custody.Invoices.Any()
                ? custody.Invoices.Max(i => i.SequenceNo) + 1
                : 1;

            var unitAfterVat = Math.Round(dto.UnitPrice * (1 + (dto.VatRatePercent / 100m)), 2);
            var lineTotal = Math.Round(unitAfterVat * dto.Quantity, 2);

            if (lineTotal > remainingBefore)
                throw new InvalidOperationException($"Invoice total ({lineTotal}) exceeds remaining balance ({remainingBefore}).");

            var inv = new CustodyInvoice
            {
                CustodyId = custodyId,
                SequenceNo = nextSeq,
                InvoiceNumber = dto.InvoiceNumber,
                InvoiceDate = dto.InvoiceDate,
                ItemDescription = dto.ItemDescription,
                Quantity = dto.Quantity,
                UnitPrice = dto.UnitPrice,
                VatRatePercent = dto.VatRatePercent,
                UnitPriceAfterVat = unitAfterVat,
                LineTotal = lineTotal,
                CreatedAt = DateTime.UtcNow
            };

            _db.CustodyInvoices.Add(inv);
            await _db.SaveChangesAsync();

            await TryAutoCloseAndNotifyAsync(custodyId);

            return new InvoiceReadDto
            {
                Id = inv.Id,
                SequenceNo = inv.SequenceNo,
                InvoiceNumber = inv.InvoiceNumber,
                InvoiceDate = inv.InvoiceDate,
                ItemDescription = inv.ItemDescription,
                Quantity = inv.Quantity,
                UnitPrice = inv.UnitPrice,
                VatRatePercent = inv.VatRatePercent,
                UnitPriceAfterVat = inv.UnitPriceAfterVat,
                LineTotal = inv.LineTotal
            };
        }

        public async Task<bool> CloseCustodyAsync(int custodyId, CloseCustodyDto dto)
        {
            var custody = await _db.Custodies.Include(c => c.Invoices)
                .FirstOrDefaultAsync(c => c.Id == custodyId)
                ?? throw new KeyNotFoundException("Custody not found.");

            if (string.Equals(custody.Status, "Closed", StringComparison.OrdinalIgnoreCase))
                return true;

            custody.Status = "Closed";
            custody.ClosedAt = dto.ClosedAt ?? DateTime.UtcNow;
            custody.Notes = dto.Notes ?? custody.Notes;

            _db.Custodies.Update(custody);
            await _db.SaveChangesAsync();

            await SendCloseNotificationsAsync(custodyId);
            return true;
        }

        public async Task<CustodyReadDto?> GetCustodyAsync(int custodyId)
            => await MapCustody(custodyId);

        public async Task<IEnumerable<CustodyReadDto>> GetCustodiesAsync(string? userId = null, bool includeClosed = true)
        {
            var q = _db.Custodies
                .AsNoTracking()
                .Include(c => c.Invoices)
                .AsQueryable();

            if (!string.IsNullOrWhiteSpace(userId))
                q = q.Where(c => c.CustodianUserId == userId);

            if (!includeClosed)
                q = q.Where(c => c.Status == "Open");

            // جلب كل العهد المطلوبة مع فواتيرها بكويري واحد بدل كويري منفصل لكل عهدة (كان أكبر سبب للبطء هنا)
            var custodies = await q.OrderByDescending(c => c.CreatedAt).ToListAsync();

            // جلب كل اليوزرز المطلوبين مرة واحدة بدل كويري لكل عهدة
            var custodianIds = custodies.Select(c => c.CustodianUserId).Distinct().ToList();
            var users = await _context.Users
                .AsNoTracking()
                .Where(u => custodianIds.Contains(u.Id))
                .ToListAsync();
            var usersById = users.ToDictionary(u => u.Id, u => u);

            var list = custodies.Select(c => MapCustody(c, usersById)).ToList();
            return list;
        }

        public async Task<AggregateSummaryDto> GetAggregateAsync(string? userId = null)
        {
            var q = _db.Custodies.AsNoTracking().Include(c => c.Invoices).AsQueryable();
            if (!string.IsNullOrWhiteSpace(userId))
                q = q.Where(c => c.CustodianUserId == userId);

            var custodies = await q.ToListAsync();

            var totalAdvance = custodies.Sum(c => c.AdvanceAmount);
            var allInvoices = custodies.SelectMany(c => c.Invoices).ToList();

            var subtotalBeforeVat = allInvoices.Sum(i => Math.Round(i.Quantity * i.UnitPrice, 2));
            var totalAfterVat = allInvoices.Sum(i => i.LineTotal);
            var totalVat = Math.Round(totalAfterVat - subtotalBeforeVat, 2);

            var openCustodies = custodies.Where(c => c.Status == "Open").ToList();
            var remainingOpen = openCustodies.Sum(c => c.AdvanceAmount - c.Invoices.Sum(i => i.LineTotal));

            var a = new AggregateSummaryDto
            {
                CustodianUserId = userId,
                CustodianName = null,
                OpenCustodiesCount = openCustodies.Count,
                ClosedCustodiesCount = custodies.Count - openCustodies.Count,
                TotalInvoicesCount = allInvoices.Count,
                TotalAdvanceAmount = Math.Round(totalAdvance, 2),
                SubtotalBeforeVat = Math.Round(subtotalBeforeVat, 2),
                TotalVat = Math.Round(totalVat, 2),
                GrandTotal = Math.Round(totalAfterVat, 2),
                RemainingAcrossOpenCustodies = Math.Round(remainingOpen, 2)
            };

            if (!string.IsNullOrWhiteSpace(userId))
            {
                var u = await _userManager.FindByIdAsync(userId);
                a.CustodianName = u?.DisplayName ?? u?.UserName;
            }

            return a;
        }

        // ================= Helpers =================

        private async Task TryAutoCloseAndNotifyAsync(int custodyId)
        {
            var custody = await _db.Custodies.Include(c => c.Invoices)
                                             .FirstOrDefaultAsync(c => c.Id == custodyId);
            if (custody == null) return; // تأكد أن هذا السطر لا يحمل مسافات/أخطاء

            var spent = custody.Invoices.Sum(i => i.LineTotal);
            var remaining = Math.Round(custody.AdvanceAmount - spent, 2);

            if (remaining <= 0 && !string.Equals(custody.Status, "Closed", StringComparison.OrdinalIgnoreCase))
            {
                custody.Status = "Closed";
                custody.ClosedAt = DateTime.UtcNow;
                _db.Custodies.Update(custody);
                await _db.SaveChangesAsync();

                await SendCloseNotificationsAsync(custodyId);
            }
        }

        private async Task SendCloseNotificationsAsync(int custodyId)
        {
            var custody = await _db.Custodies.FirstOrDefaultAsync(c => c.Id == custodyId);
            if (custody == null) return;

            var custodian = await _context.Users.FirstOrDefaultAsync(u => u.Id == custody.CustodianUserId);
            var custodianName = custodian?.DisplayName ?? custodian?.UserName ?? "User";
            var message = $"تم إغلاق العهدة رقم {custody.Id} للموظف {custodianName} بعد استهلاك كامل السلفة.";
            var now = DateTime.UtcNow;

            // لو مشروعك أقل من .NET 6 ومش عندك DistinctBy، استخدم GroupBy
            var adminsUpper = await _userManager.GetUsersInRoleAsync("Admin");
            var adminsLower = await _userManager.GetUsersInRoleAsync("admin");
            var admins = adminsUpper.Concat(adminsLower).GroupBy(u => u.Id).Select(g => g.First()).ToList();

            var notifications = new List<Notification>();

            // للإدمنز
            notifications.AddRange(admins.Select(a => new Notification
            {
                Message = message,
                UserName = custodianName,
                UserImage = custodian?.UserImage,
                CreatedAt = now,
                NotificationType = "إغلاق عهدة",
                Target = a.Id
            }));

            // لصاحب العهدة
            if (custodian != null)
            {
                notifications.Add(new Notification
                {
                    Message = $"تم إغلاق عهدتك رقم {custody.Id} بعد وصول الرصيد إلى صفر.",
                    UserName = custodianName,
                    UserImage = custodian.UserImage,
                    CreatedAt = now,
                    NotificationType = "إغلاق عهدة",
                    Target = custodian.Id
                });
            }

            if (notifications.Count > 0)
            {
                // NOTE: لو جدول Notifications في AppIdentityDbContext بدل ApplicationDbContext غيّر السطر التالي إلى _context.Notifications
                await _db.Notifications.AddRangeAsync(notifications);
                await _db.SaveChangesAsync();
            }
        }

        private async Task<CustodyReadDto> MapCustody(int id)
        {
            var c = await _db.Custodies
                .Include(c => c.Invoices)
                .FirstOrDefaultAsync(c => c.Id == id)
                ?? throw new KeyNotFoundException("Custody not found.");

            var user = await _context.Users.FirstOrDefaultAsync(d => d.Id == c.CustodianUserId);

            return MapCustody(c, user);
        }

        // نفس منطق MapCustody بالظبط، لكن بدون أي queries إضافية - مستخدمة في القوائم عشان نتفادى
        // عمل query منفصل لكل عهدة وكل يوزر (N+1)
        private CustodyReadDto MapCustody(Custody c, IReadOnlyDictionary<string, AppUser> usersById)
        {
            usersById.TryGetValue(c.CustodianUserId, out var user);
            return MapCustody(c, user);
        }

        private CustodyReadDto MapCustody(Custody c, AppUser? user)
        {
            var subtotalBeforeVat = c.Invoices.Sum(i => Math.Round(i.Quantity * i.UnitPrice, 2));
            var grand = c.Invoices.Sum(i => i.LineTotal);
            var vat = Math.Round(grand - subtotalBeforeVat, 2);

            return new CustodyReadDto
            {
                Id = c.Id,
                CustodianUserId = c.CustodianUserId,
                CustodianName = user?.DisplayName ?? user?.UserName,
                AdvanceAmount = Math.Round(c.AdvanceAmount, 2),
                Status = c.Status,
                CreatedAt = c.CreatedAt,
                ClosedAt = c.ClosedAt,
                Notes = c.Notes,
                InvoicesCount = c.Invoices.Count,
                SubtotalBeforeVat = Math.Round(subtotalBeforeVat, 2),
                TotalVat = vat,
                GrandTotal = Math.Round(grand, 2),
                RemainingToSettle = Math.Round(c.AdvanceAmount - grand, 2),
                Invoices = c.Invoices
                    .OrderBy(i => i.SequenceNo)
                    .Select(i => new InvoiceReadDto
                    {
                        Id = i.Id,
                        SequenceNo = i.SequenceNo,
                        InvoiceNumber = i.InvoiceNumber,
                        InvoiceDate = i.InvoiceDate,
                        ItemDescription = i.ItemDescription,
                        Quantity = i.Quantity,
                        UnitPrice = i.UnitPrice,
                        VatRatePercent = i.VatRatePercent,
                        UnitPriceAfterVat = i.UnitPriceAfterVat,
                        LineTotal = i.LineTotal
                    }).ToList()
            };
        }
    }
}