import React, { useState, useEffect } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import axiosInstance from '../../api/apiClient'
import Swal from 'sweetalert2'
import { FaCalendarAlt, FaClock, FaMapMarkerAlt, FaSignInAlt, FaSignOutAlt, FaSpinner } from 'react-icons/fa'

function EngAttendanceContent() {
  const [location, setLocation] = useState({ latitude: null, longitude: null })
  const [notes, setNotes] = useState('')
  const [loadingLocation, setLoadingLocation] = useState(false)
  const [locationName, setLocationName] = useState('')
  const [accuracy, setAccuracy] = useState(null)

  // Fetch today's attendance status
  const { data: attendanceStatus, refetch } = useQuery({
    queryKey: ['attendanceStatus'],
    queryFn: async () => {
      try {
        const response = await axiosInstance.get('/Attendance/my')
        return response.data.data
      } catch (error) {
        console.error('Error fetching attendance status:', error)
        return null
      }
    }
  })

  // Get user location
  const getCurrentLocation = () => {
    setLoadingLocation(true)
    if (!navigator.geolocation) {
      Swal.fire({
        title: 'خطأ',
        text: 'المتصفح لا يدعم تحديد الموقع',
        icon: 'error',
        confirmButtonText: 'حسناً',
        confirmButtonColor: '#3085d6'
      })
      setLoadingLocation(false)
      return
    }

navigator.geolocation.getCurrentPosition(
 (position) => {
  const lat = position.coords.latitude
  const lon = position.coords.longitude

  setLocation({ latitude: lat, longitude: lon })
  setAccuracy(position.coords.accuracy)
  fetchLocationName(lat, lon)
  setLoadingLocation(false)
},

  (error) => {
    console.error(error)
    setLoadingLocation(false)
  },
  {
    enableHighAccuracy: true,
    timeout: 15000,
    maximumAge: 0
  }
)

  }

  useEffect(() => {
    // Try to get location on mount
    getCurrentLocation()
  }, [])

const fetchLocationName = async (lat, lon) => {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&accept-language=ar`
    )
    const data = await res.json()

    setLocationName(data.display_name || 'موقع غير معروف')
  } catch (error) {
    setLocationName('موقع غير معروف')
  }
}


  // Check-in mutation
  const { mutate: checkIn, isLoading: isCheckingIn } = useMutation({
    mutationFn: async (data) => {
      const response = await axiosInstance.post('/Attendance/check-in', data)
      return response.data
    },
    onSuccess: (data) => {
      Swal.fire({
        title: 'تم التسجيل بنجاح!',
        text: 'تم تسجيل حضورك بنجاح',
        icon: 'success',
        confirmButtonText: 'حسناً',
        confirmButtonColor: '#3085d6'
      })
      refetch()
      setNotes('')
    },
    onError: (error) => {
      Swal.fire({
        title: 'خطأ',
        text: error.response?.data?.message || 'حدث خطأ أثناء تسجيل الحضور',
        icon: 'error',
        confirmButtonText: 'حسناً',
        confirmButtonColor: '#3085d6'
      })
    }
  })

  // Check-out mutation
  const { mutate: checkOut, isLoading: isCheckingOut } = useMutation({
    mutationFn: async (data) => {
      const response = await axiosInstance.post('/Attendance/check-out', data)
      return response.data
    },
    onSuccess: (data) => {
      Swal.fire({
        title: 'تم التسجيل بنجاح!',
        text: 'تم تسجيل انصرافك بنجاح',
        icon: 'success',
        confirmButtonText: 'حسناً',
        confirmButtonColor: '#3085d6'
      })
      refetch()
      setNotes('')
    },
    onError: (error) => {
      Swal.fire({
        title: 'خطأ',
        text: error.response?.data?.message || 'حدث خطأ أثناء تسجيل الانصراف',
        icon: 'error',
        confirmButtonText: 'حسناً',
        confirmButtonColor: '#3085d6'
      })
    }
  })

  // Handle check-in
  const handleCheckIn = () => {
    if (!location.latitude || !location.longitude) {
      Swal.fire({
        title: 'تحذير',
        text: 'يرجى الحصول على الموقع أولاً',
        icon: 'warning',
        confirmButtonText: 'حسناً',
        confirmButtonColor: '#3085d6'
      })
      return
    }


    // const clientTime = now.getFullYear() + '-' +
    //   String(now.getMonth() + 1).padStart(2, '0') + '-' +
    //   String(now.getDate()).padStart(2, '0') + ' ' +
    //   String(now.getHours()).padStart(2, '0') + ':' +
    //   String(now.getMinutes()).padStart(2, '0') + ':' +
    //   String(now.getSeconds()).padStart(2, '0')
const now = new Date()

const clientTime =
  now.getFullYear() + '-' +
  String(now.getMonth() + 1).padStart(2, '0') + '-' +
  String(now.getDate()).padStart(2, '0') + 'T' +
  String(now.getHours()).padStart(2, '0') + ':' +
  String(now.getMinutes()).padStart(2, '0') + ':' +
  String(now.getSeconds()).padStart(2, '0')

    checkIn({
      latitude: location.latitude,
      longitude: location.longitude,
      notes: notes.trim(),
     clientTime
    })
  }

  // Handle check-out
  const handleCheckOut = () => {
    if (!location.latitude || !location.longitude) {
      Swal.fire({
        title: 'تحذير',
        text: 'يرجى الحصول على الموقع أولاً',
        icon: 'warning',
        confirmButtonText: 'حسناً',
        confirmButtonColor: '#3085d6'
      })
      return
    }
const now = new Date()

const clientTime =
  now.getFullYear() + '-' +
  String(now.getMonth() + 1).padStart(2, '0') + '-' +
  String(now.getDate()).padStart(2, '0') + 'T' +
  String(now.getHours()).padStart(2, '0') + ':' +
  String(now.getMinutes()).padStart(2, '0') + ':' +
  String(now.getSeconds()).padStart(2, '0')


    checkOut({
      latitude: location.latitude,
      longitude: location.longitude,
      notes: notes.trim(),
      clientTime
    })
  }

  const formatTime = (dateString) => {
    if (!dateString) return 'غير محدد'
    try {
      const date = new Date(dateString)
      return date.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' , timeZone: 'Africa/Cairo' })
    } catch {
      return 'غير محدد'
    }
  }



  return (

<div className="min-h-screen bg-gray-50">
  <div className="max-w-4xl mx-auto px-4 space-y-8">

    {/* HERO */}
    <div className="rounded-3xl bg-gradient-to-br from-mainColor to-blue-600 text-white p-8 shadow-2xl text-center">
      <div className="text-6xl font-extrabold tracking-wide mb-2">
        {new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
      </div>
      <div className="text-sm opacity-90">
        {new Date().toLocaleDateString('ar-SA', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })}
      </div>
    </div>

    {/* ACTION CARD */}
    <div className="bg-white rounded-3xl shadow-xl p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
      <button
        onClick={handleCheckIn}
        disabled={isCheckingIn || isCheckingOut}
        className="h-28 rounded-2xl bg-green-600 hover:bg-green-700 text-white flex flex-col items-center justify-center gap-2 text-lg font-bold transition disabled:opacity-50"
      >
        <FaSignInAlt className="text-3xl" />
        تسجيل حضور
        {isCheckingIn && <FaSpinner className="animate-spin text-sm" />}
      </button>

      <button
        onClick={handleCheckOut}
        disabled={isCheckingIn || isCheckingOut}
         className="h-28 rounded-2xl bg-green-600 hover:bg-green-700 text-white flex flex-col items-center justify-center gap-2 text-lg font-bold transition disabled:opacity-50"
      >
        <FaSignOutAlt className="text-3xl" />
        تسجيل انصراف
        {isCheckingOut && <FaSpinner className="animate-spin text-sm" />}
      </button>
    </div>

    {/* INFO GRID */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

      {/* STATUS */}
      <div className="bg-white rounded-2xl shadow-md p-6">
        <h3 className="font-bold text-gray-700 mb-4 text-center">
          حالة اليوم
        </h3>

       {attendanceStatus && attendanceStatus.length > 0 ? (
  attendanceStatus.map((item, index) => (
    <div
      key={index}
      className="space-y-3 mt-4 bg-gray-50 rounded-xl p-4"
    >
      {/* Check In */}
      <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg px-4 py-2">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-600"></span>
          <span className="text-sm text-green-700 font-medium">
            دخول
          </span>
        </div>
        <span className="font-bold text-green-700">
          {item.checkInTime ? formatTime(item.checkInTime) : '--'}
        </span>
      </div>

      {/* Check Out */}
      <div className="flex items-center justify-between bg-orange-50 border border-orange-200 rounded-lg px-4 py-2">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-orange-500"></span>
          <span className="text-sm text-orange-700 font-medium">
            خروج
          </span>
        </div>
        <span className="font-bold text-orange-600">
          {item.checkOutTime ? formatTime(item.checkOutTime) : '--'}
        </span>
      </div>
    </div>
  ))
) : (
  <div className="text-center text-gray-400 text-sm mt-4">
    لا توجد بيانات
  </div>
)}

      </div>

      {/* LOCATION */}
      <div className="bg-white rounded-2xl shadow-md p-6 flex flex-col justify-between">
        <div>
          <h3 className="font-bold text-gray-700 mb-3 text-center">
            موقعك الحالي
          </h3>

          {locationName ? (
            <div className="text-center">
              <div className="text-base font-semibold text-gray-800">
                📍 {locationName}
              </div>
              {accuracy && (
                <div
                  className={`text-xs mt-1 ${
                    accuracy < 1000 ? 'text-green-600' : 'text-orange-500'
                  }`}
                >
                  دقة تقريبًا {Math.round(accuracy)} متر
                </div>
              )}
            </div>
          ) : (
            <div className="text-center text-gray-400 text-sm">
              جاري تحديد الموقع...
            </div>
          )}
        </div>

        <button
          onClick={getCurrentLocation}
          disabled={loadingLocation}
          className="mt-6 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {loadingLocation ? <FaSpinner className="animate-spin" /> : <FaMapMarkerAlt />}
          تحديث الموقع
        </button>
      </div>
    </div>

    {/* NOTES */}
    <div className="bg-white rounded-2xl shadow-md p-6">
      <label className="block text-sm font-semibold text-gray-700 mb-2">
        ملاحظات
      </label>
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        rows="3"
        placeholder="أضف أي ملاحظة (اختياري)"
        className="w-full border border-gray-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-mainColor focus:outline-none resize-none"
      />
    </div>

  </div>
</div>



  )
}

export default EngAttendanceContent

