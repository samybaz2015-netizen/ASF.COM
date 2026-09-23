//using Microsoft.EntityFrameworkCore;
//using ASF.Core.Dtos;
//using ASF.Core.Dtos.Attendance;
//using ASF.Core.Entities;
//using ASF.Core.Helpers;
//using ASF.Core.Services;
//using ASF.Repository.AppDbContext;
//using ASF.Repository.Identity;

//namespace ASF.Service
//{
//    public class AttendanceService : IAttendanceService
//    {
//        private readonly AppIdentityDbContext _context;
//        private readonly IBranchService _branchService;

//        public AttendanceService(AppIdentityDbContext context, IBranchService branchService)
//        {
//            _context = context;
//            _branchService = branchService;
//        }



//        public async Task<ApiResponse<AttendanceDto>> CheckInAsync(string userId, AttendanceCreateDto dto)
//        {
//            try
//            {
//                var activeRecord = await _context.Attendances
//                    .FirstOrDefaultAsync(a => a.UserId == userId && a.CheckOutTime == null);
//                if (activeRecord != null)
//                    return new ApiResponse<AttendanceDto>(400, "❌ تم تسجيل الحضور مسبقاً، يجب تسجيل الانصراف أولاً.");

//                var attendance = new Attendance
//                {
//                    UserId = userId,
//                    CheckInTime = dto.ClientTime, // ✅ الوقت من المستخدم
//                    CheckInLatitude = dto.Latitude,
//                    CheckInLongitude = dto.Longitude,
//                    Notes = dto.Notes
//                };
//                _context.Attendances.Add(attendance);
//                await _context.SaveChangesAsync();
//                return new ApiResponse<AttendanceDto>(200, "✅ تم تسجيل الحضور بنجاح", MapToDto(attendance));
//            }
//            catch (Exception ex)
//            {
//                return new ApiResponse<AttendanceDto>(500, $"حدث خطأ أثناء تسجيل الحضور: {ex.Message}");
//            }
//        }

//        public async Task<ApiResponse<AttendanceDto>> CheckOutAsync(string userId, AttendanceCheckOutDto dto)
//        {
//            try
//            {
//                var activeRecord = await _context.Attendances
//                    .FirstOrDefaultAsync(a => a.UserId == userId && a.CheckOutTime == null);
//                if (activeRecord == null)
//                    return new ApiResponse<AttendanceDto>(404, "⚠️ لم يتم تسجيل حضور بعد.");

//                activeRecord.CheckOutTime = dto.ClientTime; // ✅ الوقت من المستخدم
//                activeRecord.CheckOutLatitude = dto.Latitude;
//                activeRecord.CheckOutLongitude = dto.Longitude;
//                activeRecord.Notes = string.IsNullOrWhiteSpace(dto.Notes) ? activeRecord.Notes : dto.Notes;
//                _context.Attendances.Update(activeRecord);
//                await _context.SaveChangesAsync();
//                return new ApiResponse<AttendanceDto>(200, "✅ تم تسجيل الانصراف بنجاح", MapToDto(activeRecord));
//            }
//            catch (Exception ex)
//            {
//                return new ApiResponse<AttendanceDto>(500, $"حدث خطأ أثناء تسجيل الانصراف: {ex.Message}");
//            }
//        }
//        public async Task<ApiResponse<List<AttendanceDto>>> GetAllAsync(
//       int page = 1,
//       int pageSize = 10,
//       string? search = null,
//       DateTime? fromDate = null,
//       DateTime? toDate = null,
//       int? month = null
//   )
//        {
//            // 1️⃣ جلب البيانات مع User + Office
//            var query = _context.Attendances
//                .Include(a => a.User)
//                    .ThenInclude(u => u.Office)
//                .AsQueryable();

//            // 2️⃣ فلترة التاريخ
//            if (fromDate.HasValue)
//                query = query.Where(a => a.CheckInTime >= fromDate.Value);

//            if (toDate.HasValue)
//                query = query.Where(a => a.CheckInTime <= toDate.Value);

//            if (month.HasValue)
//                query = query.Where(a => a.CheckInTime.Month == month.Value);

//            // 3️⃣ Pagination count
//            var totalCount = await query.CountAsync();

//            // 4️⃣ جلب البيانات فعليًا في الذاكرة
//            var attendances = await query
//                .OrderByDescending(a => a.CheckInTime)
//                .Skip((page - 1) * pageSize)
//                .Take(pageSize)
//                .ToListAsync();

//            // 5️⃣ Mapping + جلب الفرع + سيرش على الفرع
//            var data = new List<AttendanceDto>();

//            foreach (var a in attendances)
//            {
//                var user = a.User;
//                var branch = await _branchService.GetByIdAsync(user.BranchId);

//                // إذا فيه search على اسم الفرع
//                if (!string.IsNullOrWhiteSpace(search))
//                {
//                    var matchBranch = branch != null && branch.Name.Contains(search);
//                    var matchUser = user.UserName.Contains(search) || (user.DisplayName != null && user.DisplayName.Contains(search));

//                    if (!matchBranch && !matchUser)
//                        continue; // تجاهل هذا العنصر لأنه لا يطابق البحث
//                }

//                data.Add(new AttendanceDto
//                {
//                    Id = a.Id,
//                    CheckInTime = a.CheckInTime.ToString("yyyy-MM-dd HH:mm"),
//                    CheckOutTime = a.CheckOutTime?.ToString("yyyy-MM-dd HH:mm"),
//                    CheckInLatitude = a.CheckInLatitude,
//                    CheckInLongitude = a.CheckInLongitude,
//                    CheckOutLatitude = a.CheckOutLatitude,
//                    CheckOutLongitude = a.CheckOutLongitude,
//                    Notes = a.Notes,
//                    AdminNotes = a.AdminNotes,
//                    IsActive = a.IsActive,
//                    User = new EmployeeDto2
//                    {
//                        Id = user.Id,
//                        UserName = user.UserName,
//                        DisplayName = user.DisplayName,
//                        UserImage = user.UserImage,
//                        UserType = user.UserType,
//                        BranchId = branch?.Id ?? 0,
//                        BranchName = branch?.Name,
//                        OfficeId = user.OfficeId
//                    }
//                });
//            }

//            // 6️⃣ إرجاع النتيجة
//            return new ApiResponse<List<AttendanceDto>>(200, "تم جلب بيانات الحضور بنجاح", data)
//            {
//                TotalCount = totalCount
//            };

//        }


//        public async Task<ApiResponse<List<AttendanceDto>>> GetUserAttendanceAsync(string userId)
//        {

//            var list = await _context.Attendances
//                .Include(a => a.User)
//                .Where(a => a.UserId == userId)
//                .OrderByDescending(a => a.CheckInTime)
//                .Select(a => MapToDto(a))
//                .ToListAsync();

//            return new ApiResponse<List<AttendanceDto>>(200, "تم جلب سجل الحضور بنجاح", list);
//        }
//        public async Task<ApiResponse<AttendanceDto>> AddAdminNoteAsync(
//    int attendanceId,
//    AddAdminNoteAttendanceDto dto)
//        {
//            try
//            {
//                var attendance = await _context.Attendances
//                    .Include(a => a.User)
//                    .FirstOrDefaultAsync(a => a.Id == attendanceId);

//                if (attendance == null)
//                    return new ApiResponse<AttendanceDto>(404, "❌ سجل الحضور غير موجود");

//                attendance.AdminNotes = dto.AdminNotes;

//                _context.Attendances.Update(attendance);
//                await _context.SaveChangesAsync();

//                return new ApiResponse<AttendanceDto>(
//                    200,
//                    "✅ تم إضافة ملاحظة الأدمن بنجاح",
//                    MapToDto(attendance)
//                );
//            }
//            catch (Exception ex)
//            {
//                return new ApiResponse<AttendanceDto>(
//                    500,
//                    $"حدث خطأ أثناء إضافة الملاحظة: {ex.Message}"
//                );
//            }
//        }


//        // Helper mapper
//        private static AttendanceDto MapToDto(Attendance a)
//        {
//            return new AttendanceDto
//            {
//                Id = a.Id,
//                UserId = a.UserId,
//                UserName = a.User?.UserName,
//                CheckInTime = a.CheckInTime.ToString("yyyy-MM-dd HH:mm"),
//                CheckOutTime = a.CheckOutTime?.ToString("yyyy-MM-dd HH:mm"),
//                CheckInLatitude = a.CheckInLatitude,
//                CheckInLongitude = a.CheckInLongitude,
//                CheckOutLatitude = a.CheckOutLatitude,
//                CheckOutLongitude = a.CheckOutLongitude,
//                Notes = a.Notes,
//                AdminNotes = a.AdminNotes,
//                IsActive = a.CheckOutTime == null
//            };
//        }
//    }
//}
using Microsoft.EntityFrameworkCore;
using ASF.Core.Dtos;
using ASF.Core.Dtos.Attendance;
using ASF.Core.Entities;
using ASF.Core.Helpers;
using ASF.Core.Services;
using ASF.Repository.AppDbContext;
using ASF.Repository.Identity;

namespace ASF.Service
{
    public class AttendanceService : IAttendanceService
    {
        private readonly AppIdentityDbContext _context;
        private readonly IBranchService _branchService;

        public AttendanceService(AppIdentityDbContext context, IBranchService branchService)
        {
            _context = context;
            _branchService = branchService;
        }



        public async Task<ApiResponse<AttendanceDto>> CheckInAsync(string userId, AttendanceCreateDto dto)
        {
            try
            {
                var activeRecord = await _context.Attendances
                    .FirstOrDefaultAsync(a => a.UserId == userId && a.CheckOutTime == null);
                if (activeRecord != null)
                    return new ApiResponse<AttendanceDto>(400, "❌ تم تسجيل الحضور مسبقاً، يجب تسجيل الانصراف أولاً.");

                var attendance = new Attendance
                {
                    UserId = userId,
                    CheckInTime = dto.ClientTime, // ✅ الوقت من المستخدم
                    CheckInLatitude = dto.Latitude,
                    CheckInLongitude = dto.Longitude,
                    Notes = dto.Notes
                };
                _context.Attendances.Add(attendance);
                await _context.SaveChangesAsync();
                return new ApiResponse<AttendanceDto>(200, "✅ تم تسجيل الحضور بنجاح", MapToDto(attendance));
            }
            catch (Exception ex)
            {
                return new ApiResponse<AttendanceDto>(500, $"حدث خطأ أثناء تسجيل الحضور: {ex.Message}");
            }
        }

        public async Task<ApiResponse<AttendanceDto>> CheckOutAsync(string userId, AttendanceCheckOutDto dto)
        {
            try
            {
                var activeRecord = await _context.Attendances
                    .FirstOrDefaultAsync(a => a.UserId == userId && a.CheckOutTime == null);
                if (activeRecord == null)
                    return new ApiResponse<AttendanceDto>(404, "⚠️ لم يتم تسجيل حضور بعد.");

                activeRecord.CheckOutTime = dto.ClientTime; // ✅ الوقت من المستخدم
                activeRecord.CheckOutLatitude = dto.Latitude;
                activeRecord.CheckOutLongitude = dto.Longitude;
                activeRecord.Notes = string.IsNullOrWhiteSpace(dto.Notes) ? activeRecord.Notes : dto.Notes;
                _context.Attendances.Update(activeRecord);
                await _context.SaveChangesAsync();
                return new ApiResponse<AttendanceDto>(200, "✅ تم تسجيل الانصراف بنجاح", MapToDto(activeRecord));
            }
            catch (Exception ex)
            {
                return new ApiResponse<AttendanceDto>(500, $"حدث خطأ أثناء تسجيل الانصراف: {ex.Message}");
            }
        }
        public async Task<ApiResponse<List<AttendanceDto>>> GetAllAsync(
       int page = 1,
       int pageSize = 10,
       string? search = null,
       DateTime? fromDate = null,
       DateTime? toDate = null,
       int? month = null
   )
        {
            // 1️⃣ جلب الفروع مرة واحدة فقط (جدول صغير) بدل عمل query لكل صف - كان ده أكبر سبب للبطء (N+1)
            var branches = await _branchService.GetAllAsync();
            var branchById = branches.ToDictionary(b => b.Id, b => b);

            // لو فيه سيرش، نحدد مسبقًا أي أفرع بتطابق نص البحث عشان نقدر نستخدمها جوه استعلام قاعدة البيانات
            HashSet<int>? matchingBranchIds = null;
            if (!string.IsNullOrWhiteSpace(search))
            {
                matchingBranchIds = branches
                    .Where(b => b.Name != null && b.Name.Contains(search))
                    .Select(b => b.Id)
                    .ToHashSet();
            }

            // 2️⃣ بناء الاستعلام مع فلاتر التاريخ + السيرش (كله بيتنفذ على قاعدة البيانات مش في الذاكرة)
            var query = _context.Attendances
                .Include(a => a.User)
                    .ThenInclude(u => u.Office)
                .AsNoTracking()
                .AsQueryable();

            if (fromDate.HasValue)
                query = query.Where(a => a.CheckInTime >= fromDate.Value);

            if (toDate.HasValue)
                query = query.Where(a => a.CheckInTime <= toDate.Value);

            if (month.HasValue)
                query = query.Where(a => a.CheckInTime.Month == month.Value);

            if (!string.IsNullOrWhiteSpace(search))
            {
                query = query.Where(a =>
                    a.User.UserName.Contains(search) ||
                    (a.User.DisplayName != null && a.User.DisplayName.Contains(search)) ||
                    matchingBranchIds!.Contains(a.User.BranchId));
            }

            // 3️⃣ العدّ الصحيح بعد تطبيق كل الفلاتر (بما فيها السيرش)
            var totalCount = await query.CountAsync();

            // 4️⃣ الترتيب والتصفح (Paging) بيتنفذوا في قاعدة البيانات، مش بعد ما نجيب كل الصفوف
            var attendances = await query
                .OrderByDescending(a => a.CheckInTime)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            // 5️⃣ الـ Mapping بدون أي queries إضافية - الفروع كلها موجودة بالفعل في الذاكرة
            var data = attendances.Select(a =>
            {
                var user = a.User;
                branchById.TryGetValue(user.BranchId, out var branch);

                return new AttendanceDto
                {
                    Id = a.Id,
                    CheckInTime = a.CheckInTime.ToString("yyyy-MM-dd HH:mm"),
                    CheckOutTime = a.CheckOutTime?.ToString("yyyy-MM-dd HH:mm"),
                    CheckInLatitude = a.CheckInLatitude,
                    CheckInLongitude = a.CheckInLongitude,
                    CheckOutLatitude = a.CheckOutLatitude,
                    CheckOutLongitude = a.CheckOutLongitude,
                    Notes = a.Notes,
                    AdminNotes = a.AdminNotes,
                    IsActive = a.IsActive,
                    User = new EmployeeDto2
                    {
                        Id = user.Id,
                        UserName = user.UserName,
                        DisplayName = user.DisplayName,
                        UserImage = user.UserImage,
                        UserType = user.UserType,
                        BranchId = branch?.Id ?? 0,
                        BranchName = branch?.Name,
                        OfficeId = user.OfficeId
                    }
                };
            }).ToList();

            // 6️⃣ إرجاع النتيجة
            return new ApiResponse<List<AttendanceDto>>(200, "تم جلب بيانات الحضور بنجاح", data)
            {
                TotalCount = totalCount
            };

        }


        public async Task<ApiResponse<List<AttendanceDto>>> GetUserAttendanceAsync(string userId)
        {

            var list = await _context.Attendances
                .AsNoTracking()
                .Include(a => a.User)
                .Where(a => a.UserId == userId)
                .OrderByDescending(a => a.CheckInTime)
                .Select(a => MapToDto(a))
                .ToListAsync();

            return new ApiResponse<List<AttendanceDto>>(200, "تم جلب سجل الحضور بنجاح", list);
        }
        public async Task<ApiResponse<AttendanceDto>> AddAdminNoteAsync(
    int attendanceId,
    AddAdminNoteAttendanceDto dto)
        {
            try
            {
                var attendance = await _context.Attendances
                    .Include(a => a.User)
                    .FirstOrDefaultAsync(a => a.Id == attendanceId);

                if (attendance == null)
                    return new ApiResponse<AttendanceDto>(404, "❌ سجل الحضور غير موجود");

                attendance.AdminNotes = dto.AdminNotes;

                _context.Attendances.Update(attendance);
                await _context.SaveChangesAsync();

                return new ApiResponse<AttendanceDto>(
                    200,
                    "✅ تم إضافة ملاحظة الأدمن بنجاح",
                    MapToDto(attendance)
                );
            }
            catch (Exception ex)
            {
                return new ApiResponse<AttendanceDto>(
                    500,
                    $"حدث خطأ أثناء إضافة الملاحظة: {ex.Message}"
                );
            }
        }


        // Helper mapper
        private static AttendanceDto MapToDto(Attendance a)
        {
            return new AttendanceDto
            {
                Id = a.Id,
                UserId = a.UserId,
                UserName = a.User?.UserName,
                CheckInTime = a.CheckInTime.ToString("yyyy-MM-dd HH:mm"),
                CheckOutTime = a.CheckOutTime?.ToString("yyyy-MM-dd HH:mm"),
                CheckInLatitude = a.CheckInLatitude,
                CheckInLongitude = a.CheckInLongitude,
                CheckOutLatitude = a.CheckOutLatitude,
                CheckOutLongitude = a.CheckOutLongitude,
                Notes = a.Notes,
                AdminNotes = a.AdminNotes,
                IsActive = a.CheckOutTime == null
            };
        }
    }
}