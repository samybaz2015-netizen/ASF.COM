import React, { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { FaSearch, FaDownload, FaUser, FaChevronLeft, FaChevronRight, FaMapMarkerAlt, FaClock, FaTimes } from 'react-icons/fa'
import Swal from 'sweetalert2'
import axiosInstance from '../../api/apiClient'

const API_URL = '/Attendance/all'

function CheckAttendanceAdminContent() {
  const [searchTerm, setSearchTerm] = useState('')
  const [exportLoading, setExportLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [mapDialog, setMapDialog] = useState({ open: false, lat: null, lng: null, type: null })
  const locationCache = React.useRef(new Map())
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [month, setMonth] = useState('')
  const [selectedRows, setSelectedRows] = useState(new Set())

  // Fetch attendance data
 const dateFilters = useMemo(() => {

  if (month) {
    const start = `${month}-01T00:00:00`
    const endDate = new Date(month + '-01')
    endDate.setMonth(endDate.getMonth() + 1)
    endDate.setDate(0)

    const end = `${endDate.toISOString().split('T')[0]}T23:59:59`

    return {
      fromDateTime: start,
      toDateTime: end
    }
  }

  return {
    fromDateTime: fromDate ? `${fromDate}T00:00:00` : undefined,
    toDateTime: toDate ? `${toDate}T23:59:59` : undefined
  }
}, [fromDate, toDate, month])


const { data: attendanceResponse, isLoading } = useQuery({
  queryKey: ['attendance', page, pageSize, searchTerm, fromDate, toDate, month],
  queryFn: async () => {
    const response = await axiosInstance.get(API_URL, {
      params: {
        page,
        pageSize,
        search: searchTerm || undefined,
        fromDate: dateFilters.fromDateTime,
        toDate: dateFilters.toDateTime
      }
    })

    return response.data
  }
})

  const attendanceData = attendanceResponse?.data || []
  const totalCount = attendanceResponse?.totalCount || 0
  const totalPages = Math.ceil(totalCount / pageSize)

  // Handle search - auto-reset to page 1
  
  const handleSearch = (value) => {
    setSearchTerm(value)
    setPage(1)
    setSelectedRows(new Set()) 
  }

  const buildMonthRange = (month) => {
  if (!month) return {}

  const start = `${month}-01T00:00:00`
  const endDate = new Date(month + '-01')
  endDate.setMonth(endDate.getMonth() + 1)
  endDate.setDate(0) // آخر يوم في الشهر

  const end = `${endDate.toISOString().split('T')[0]}T23:59:59`

  return { fromDateTime: start, toDateTime: end }
}

  // get Location Namel

  const getLocationName = async (lat, lng) => {
    const key = `${lat},${lng}`

    // ✅ Cache hit
    if (locationCache.current.has(key)) {
      return locationCache.current.get(key)
    }

    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=ar`
      )
      const data = await res.json()
      const name = data.display_name || 'غير محدد'

      // 🧠 save to cache
      locationCache.current.set(key, name)

      return name
    } catch {
      return 'غير محدد'
    }
  }

  // Export to Excel

const handleExportExcel = async () => {
  try {
    setExportLoading(true)
    const XLSX = await import('xlsx')

    let dataToExport = []

    if (selectedRows.size > 0) {
      // ✅ صدّر المحددين بس من البيانات الموجودة
      dataToExport = attendanceData.filter(item => selectedRows.has(item.id))
    } else {
      // ✅ صدّر الكل — جيب من السيرفر
      const BATCH_SIZE = 10
      let currentPage = 1
      let hasMore = true

      while (hasMore) {
        try {
          const response = await axiosInstance.get(API_URL, {
            params: {
              page: currentPage,
              pageSize: BATCH_SIZE,
              search: searchTerm || undefined,
              fromDate: dateFilters.fromDateTime,
              toDate: dateFilters.toDateTime
            }
          })
          const batch = response.data?.data || []
          dataToExport = [...dataToExport, ...batch]
          hasMore = batch.length === BATCH_SIZE
          currentPage++
        } catch {
          hasMore = false
        }
      }
    }

    const exportData = dataToExport.map(item => {
      const checkInKey = `${item.checkInLatitude},${item.checkInLongitude}`
      const checkOutKey = `${item.checkOutLatitude},${item.checkOutLongitude}`
      return {
        'اسم الموظف': item.user?.displayName || item.user?.userName || 'غير محدد',
        'اسم المستخدم': item.user?.userName ? `@${item.user.userName}` : '—',
        'الفرع': item.user?.branchName || 'غير محدد',
        'التاريخ': formatDate(item.checkInTime),
        'وقت الدخول': item.checkInTime ? new Date(item.checkInTime).toLocaleTimeString('ar-SA') : '—',
        'مكان الدخول': locationCache.current.get(checkInKey) || `${item.checkInLatitude || ''}, ${item.checkInLongitude || ''}`,
        'وقت الخروج': item.checkOutTime ? new Date(item.checkOutTime).toLocaleTimeString('ar-SA') : '—',
        'مكان الخروج': locationCache.current.get(checkOutKey) || `${item.checkOutLatitude || ''}, ${item.checkOutLongitude || ''}`,
        'الحالة': item.isActive ? 'نشط' : 'غير نشط',
        'ملاحظات': item.adminNotes || '—'
      }
    })

    const ws = XLSX.utils.json_to_sheet(exportData)
  const headerKeys = Object.keys(exportData[0] || {})

  headerKeys.forEach((key, index) => {
    const cellAddress = XLSX.utils.encode_cell({ r: 0, c: index })
    if (!ws[cellAddress]) return

    ws[cellAddress].s = {
      font: { bold: true },
      alignment: {
        vertical: 'center',
        horizontal: 'center'
      }
    }
  })

    /* ===== Excel Table Enhancements ===== */

    // Auto width
    const colWidths = Object.keys(exportData[0] || {}).map(() => ({ wch: 30 }))
   ws['!cols'] = [
    { wch: 20 }, // اسم الموظف
    { wch: 20 }, // اسم المستخدم
    { wch: 20 }, // الفرع
    { wch: 14 }, // التاريخ
    { wch: 14 }, // وقت الدخول
    { wch: 40 }, // مكان الدخول
    { wch: 14 }, // وقت الخروج
    { wch: 40 }  // مكان الخروج
  ]

  ws['!rows'] = exportData.map(() => ({ hpt: 32 }))

    // Create workbook  
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Attendance')

    // Freeze header row
    ws['!freeze'] = { xSplit: 0, ySplit: 1 }

    const fileName = `attendance_${new Date().toISOString().split('T')[0]}.xlsx`
    XLSX.writeFile(wb, fileName)

    Swal.fire({
      title: 'تم التصدير بنجاح',
      text: 'تم إنشاء ملف Excel منسق وجاهز للاستخدام',
      icon: 'success'
    })
  } catch (error) {
    console.error(error)
    Swal.fire('خطأ', 'حدث خطأ أثناء التصدير', 'error')
  } finally {
    setExportLoading(false)
  }
  }

  useEffect(() => {
    attendanceData.forEach(item => {
      if (item.checkInLatitude && item.checkInLongitude) {
        getLocationName(item.checkInLatitude, item.checkInLongitude)
      }
      if (item.checkOutLatitude && item.checkOutLongitude) {
        getLocationName(item.checkOutLatitude, item.checkOutLongitude)
      }
    })
  }, [attendanceData])


  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'غير محدد'
    try {
      return new Date(dateString).toLocaleDateString('ar-SA')
    } catch {
      return 'غير محدد'
    }
  }

  // Handle map click
  const handleMapClick = (lat, lng, type) => {
    setMapDialog({ open: true, lat, lng, type })
  }

  // Close map dialog
  const closeMapDialog = () => {
    setMapDialog({ open: false, lat: null, lng: null, type: null })
  }

const handleEditAdminNote = async (attendanceId, currentNote) => {
  const result = await Swal.fire({
    title: 'تعديل ملاحظات الأدمن',
    input: 'textarea',
    inputValue: currentNote || '',
    inputPlaceholder: 'اكتب ملاحظة الأدمن هنا...',
    showCancelButton: true,
    confirmButtonText: 'حفظ',
    cancelButtonText: 'إلغاء',
    inputValidator: (value) => {
      if (!value) {
        return 'الملاحظة لا يمكن أن تكون فارغة'
      }
    }
  })

  if (result.isConfirmed) {
    try {
      await axiosInstance.put(
        `/Attendance/admin/add-note/${attendanceId}`,
        { adminNotes: result.value }
      )

      Swal.fire('تم الحفظ', 'تم تحديث الملاحظات بنجاح', 'success')
      window.location.reload() 
    } catch (error) {
      Swal.fire('خطأ', 'فشل تحديث الملاحظات', 'error')
    }
  }
}

const toggleRow = (id) => {
  setSelectedRows(prev => {
    const next = new Set(prev)
    next.has(id) ? next.delete(id) : next.add(id)
    return next
  })
}

const toggleAll = () => {
  if (selectedRows.size === attendanceData.length) {
    setSelectedRows(new Set())
  } else {
    setSelectedRows(new Set(attendanceData.map(item => item.id)))
  }
}

  return (
    <div className="p-4 bg-gray-50 min-h-screen">

      
      <div className="mb-4 text-center">
        <h1 className="text-2xl font-bold text-mainColor mb-2">
          <FaUser className="inline-block ml-2" />
          تسجيل الحضور
        </h1>
      </div>

      {/* Filters */}

      <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">

      {/* Top Controls */}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">

          {/* Page Size */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1 text-center">
              عدد السجلات
            </label>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value))
                setPage(1)
              }}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-mainColor text-center"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>

          {/* Search */}
          <div className="md:col-span-3">
            <label className="block text-xs font-semibold text-gray-600 mb-1 text-center">
              <FaSearch className="inline-block ml-1" />
              البحث
            </label>
            <input
              type="text"
              placeholder="بحث بالاسم / نوع المستخدم / الفرع"
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full px-4 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-mainColor"
            />
          </div>

        </div>

        {/* Divider */}
        <div className="my-5 border-t border-gray-200"></div>

        {/* Date Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1 text-center">
              من تاريخ
            </label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => {
                setFromDate(e.target.value)
                setMonth('')
                setPage(1)
              }}
              className="w-full px-3 py-2 text-sm border rounded-xl focus:ring-2 focus:ring-mainColor"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1 text-center">
              إلى تاريخ
            </label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => {
                setToDate(e.target.value)
                setMonth('')
                setPage(1)
              }}
              className="w-full px-3 py-2 text-sm border rounded-xl focus:ring-2 focus:ring-mainColor"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1 text-center">
              الشهر
            </label>
            <input
              type="month"
              value={month}
              onChange={(e) => {
                setMonth(e.target.value)
                setFromDate('')
                setToDate('')
                setPage(1)
              }}
              className="w-full px-3 py-2 text-sm border rounded-xl focus:ring-2 focus:ring-mainColor"
            />
          </div>

        </div>

        {/* Export */}
        <div className="mt-6  flex justify-center">
          <button
            onClick={handleExportExcel}
            disabled={exportLoading || !totalCount}
            className="
              bg-secondaryColor
              text-white
              px-4 py-4
              rounded-xl
              font-semibold
              text-sm
              flex
              items-center
              gap-2
              hover:scale-[1.02]
              transition
              disabled:opacity-50
              disabled:cursor-not-allowed
            "
          >
            <FaDownload />
            {exportLoading
              ? 'جاري التصدير...'
              : selectedRows.size > 0
                ? `تصدير المحددين (${selectedRows.size})`
                : 'تصدير الكل إلى Excel'
            }
          </button>
        </div>

      </div>


      {/* Attendance Table */}

      <div className="bg-white rounded-lg shadow-md ">
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-mainColor"></div>
          </div>
        ) : attendanceData.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">لا توجد بيانات حضور</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full table-auto">
              <thead className="bg-mainColor text-white">
                <tr >
                  <th className="px-3 py-2 text-center text-sm">#</th>
                  <th className="px-3 py-2 text-center text-sm">
                    <input
                      type="checkbox"
                      checked={selectedRows.size === attendanceData.length && attendanceData.length > 0}
                      onChange={toggleAll}
                      className="cursor-pointer w-4 h-4"
                    />
                  </th>
                  <th className="px-3 py-2 text-center text-sm">اسم الموظف</th>
                  <th className="px-3 py-2 text-center text-sm">وقت الدخول</th>
                  <th className="px-3 py-2 text-center text-sm">وقت الخروج</th>
                  <th className="px-3 py-2 text-center text-sm">موقع الدخول</th>
                  <th className="px-3 py-2 text-center text-sm">موقع الخروج</th>
                  <th className="px-3 py-2 text-center text-sm">الحالة</th>
                  <th className="px-3 py-2 text-center text-sm align-top">ملاحظات</th>
                </tr>
              </thead>
              <tbody>
                {attendanceData.map((item, index) => (
                  <tr key={item.id || index} className="border-b hover:bg-gray-50 transition-colors align-top">
                    <td className="px-3 py-2 text-center text-sm">{(page - 1) * pageSize + index + 1}</td>
                    <td className="px-3 py-2 text-center">
                    <input
                      type="checkbox"
                      checked={selectedRows.has(item.id)}
                      onChange={() => toggleRow(item.id)}
                      className="cursor-pointer w-4 h-4"
                    />
                  </td>
                    <td className="px-4 py-4 align-top">
                      {item.user ? (
                        <div className="flex gap-4 bg-gray-50 border border-gray-200 rounded-lg p-4">

                          {/* صورة المستخدم */}
                          <img
                            src={item.user.userImage || '/default-user.png'}
                            alt={item.user.userName}
                            loading="lazy"
                            onError={(e) => (e.currentTarget.src = '/default-user.png')}
                            className="w-4 h-4 rounded-full object-cover border"
                          />

                          {/* بيانات المستخدم */}
                          <div className="flex flex-col gap-1 text-sm text-gray-700">

                            <div>
                              <span className="font-semibold text-gray-900">الاسم:</span>{' '}
                              {item.user.displayName || 'غير محدد'}
                            </div>

                            <div>
                              <span className="font-semibold text-gray-900">اسم المستخدم:</span>{' '}
                              @{item.user.userName}
                            </div>

                          <div>
                              <span className="font-semibold text-gray-900">اسم الفرع:</span>{' '}
                              {item.user.branchId ? `فرع  ${item.user.branchName}` : 'غير محدد'}
                            </div>

                            <div>
                              <span className="font-semibold text-gray-900">رقم الفرع:</span>{' '}
                              {item.user.branchId ? `فرع رقم ${item.user.branchId}` : 'غير محدد'}
                            </div>
                        


                          </div>
                        </div>
                      ) : (
                        <span className="text-gray-400 text-sm">لا توجد بيانات مستخدم</span>
                      )}
                    </td>

                    <td className="px-3 py-2 text-center">
                      {item.checkInTime ? (
                        <div className="flex flex-col items-center gap-1">
                          <FaClock className="text-mainColor text-lg" />
                          <div className="text-xs">{formatDate(item.checkInTime)}</div>
                          <div className="text-xs text-gray-500">
                            {new Date(item.checkInTime).toLocaleTimeString('ar-SA')}
                          </div>
                        </div>
                      ) : <span className="text-gray-400 text-xs">-</span>}
                    </td>
                    <td className="px-3 py-2 text-center">
                      {item.checkOutTime ? (
                        <div className="flex flex-col items-center gap-1">
                          <FaClock className="text-secondaryColor text-lg" />
                          <div className="text-xs">{formatDate(item.checkOutTime)}</div>
                          <div className="text-xs text-gray-500">
                            {new Date(item.checkOutTime).toLocaleTimeString('ar-SA')}
                          </div>
                        </div>
                      ) : <span className="text-gray-400 text-xs">-</span>}
                    </td>
                    <td className="px-3 py-2 text-center">
                      {item.checkInLatitude && item.checkInLongitude ? (
                        <button
                          onClick={() => handleMapClick(item.checkInLatitude, item.checkInLongitude, 'دخول')}
                          className="inline-block hover:scale-110 transition-transform cursor-pointer"
                          title="عرض موقع الدخول على الخريطة"
                        >
                          <FaMapMarkerAlt className="text-red-600 text-xl" />
                        </button>
                      ) : <span className="text-gray-400 text-xs">-</span>}
                    </td>
                    <td className="px-3 py-2 text-center">
                      {item.checkOutLatitude && item.checkOutLongitude ? (
                        <button
                          onClick={() => handleMapClick(item.checkOutLatitude, item.checkOutLongitude, 'خروج')}
                          className="inline-block hover:scale-110 transition-transform cursor-pointer"
                          title="عرض موقع الخروج على الخريطة"
                        >
                          <FaMapMarkerAlt className="text-orange-600 text-xl" />
                        </button>
                      ) : <span className="text-gray-400 text-xs">-</span>}
                    </td>
                    <td className="px-3 py-2 text-center">
                      {item.isActive ? (
                        <span className="px-2 py-0.5 bg-green-100 text-green-800 rounded-full text-xs font-medium">نشط</span>
                      ) : (
                        <span className="px-2 py-0.5 bg-red-100 text-red-800 rounded-full text-xs font-medium">غير نشط</span>
                      )}
                    </td>

<td className="px-4 py-3 align-top">
  <div
    onClick={() => handleEditAdminNote(item.id, item.adminNotes)}
    className="
      cursor-pointer
      bg-gray-50 hover:bg-gray-100
      border border-gray-200
      rounded-lg
      p-3
      text-xs
      transition
      w-full
    "
  >
    {item.adminNotes ? (
      <p className="text-gray-700 text-right leading-relaxed break-words whitespace-normal">
        {item.adminNotes}
      </p>
    ) : (
      <p className="text-blue-600 font-semibold text-center">
        ➕ إضافة ملاحظة
      </p>
    )}
  </div>
</td>


                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}

      {attendanceData.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-3 mt-3">
          <div className="flex flex-col md:flex-row justify-between items-center gap-3">
            {/* Info */}
            <div className="text-gray-600 text-sm text-center">
              عرض {((page - 1) * pageSize) + 1} إلى {Math.min(page * pageSize, totalCount)} من {totalCount} سجل
            </div>
            
            {/* Pagination Controls */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(prev => Math.max(1, prev - 1))}
                disabled={page === 1 || isLoading}
                className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
              >
                <FaChevronRight />
              </button>
              
              {[...Array(totalPages)].map((_, i) => {
                const pageNum = i + 1
                // Show first, last, current, and pages around current
                if (
                  pageNum === 1 ||
                  pageNum === totalPages ||
                  (pageNum >= page - 1 && pageNum <= page + 1)
                ) {
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setPage(pageNum)}
                      disabled={isLoading}
                      className={`px-3 py-1 rounded transition-colors text-sm ${
                        page === pageNum
                          ? 'bg-mainColor text-white'
                          : 'border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  )
                } else if (pageNum === page - 2 || pageNum === page + 2) {
                  return <span key={pageNum} className="px-1">...</span>
                }
                return null
              }).filter(Boolean)}
              
              <button
                onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
                disabled={page === totalPages || isLoading}
                className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
              >
                <FaChevronLeft />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Map Dialog Modal */}

      {mapDialog.open && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
            {/* Dialog Header */}
            <div className="flex justify-between items-center p-4 border-b border-gray-200">
              <h3 className="text-lg font-bold text-mainColor">
                موقع {mapDialog.type} على الخريطة
              </h3>
              <button
                onClick={closeMapDialog}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <FaTimes className="text-gray-600 text-xl" />
              </button>
            </div>

            {/* Dialog Content - Google Maps iframe */}
            <div className="flex-1 p-4">
              <div className="w-full h-[500px] rounded-lg overflow-hidden">
                <iframe
                  src={`https://www.google.com/maps?q=${mapDialog.lat},${mapDialog.lng}&hl=ar&z=15&output=embed`}
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen=""
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="موقع على الخريطة"
                ></iframe>
              </div>
            </div>

            {/* Dialog Footer */}
            <div className="flex justify-end p-4 border-t border-gray-200">
              <button
                onClick={closeMapDialog}
                className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

export default CheckAttendanceAdminContent
