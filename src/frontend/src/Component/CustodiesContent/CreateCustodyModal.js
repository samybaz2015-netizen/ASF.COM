import React, { useState, useEffect } from 'react';
import axios from '../../api/apiClient';
import Swal from 'sweetalert2';
import { MdClose, MdSearch, MdPerson, MdEmail, MdPhone, MdWork } from 'react-icons/md';
import axiosInstance from '../../api/apiClient';

const CreateCustodyModal = ({ isOpen, onClose, onSuccess }) => {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userDetails, setUserDetails] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    advanceAmount: 0,
    notes: '',
    custodianUserId: ''
  });

  // جلب قائمة المستخدمين
  useEffect(() => {
    if (isOpen) {
      fetchUsers();
    }
  }, [isOpen]);

  const fetchUsers = async () => {
    try {
      const response = await axiosInstance.get('/Account/all-user-without-admin');
      if (response.data.statusCode === 200) {
        setUsers(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      Swal.fire({
        icon: 'error',
        title: 'خطأ',
        text: 'فشل في تحميل قائمة المستخدمين'
      });
    }
  };

  // جلب تفاصيل المستخدم المحدد
  const fetchUserDetails = async (userId) => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(`/Account/get-account-Byid?id=${userId}`);
      setUserDetails(response.data);
      setFormData(prev => ({ ...prev, custodianUserId: userId }));
    } catch (error) {
      console.error('Error fetching user details:', error);
      Swal.fire({
        icon: 'error',
        title: 'خطأ',
        text: 'فشل في تحميل بيانات المستخدم'
      });
    } finally {
      setLoading(false);
    }
  };

  // اختيار مستخدم
  const handleSelectUser = (user) => {
    setSelectedUser(user);
    fetchUserDetails(user.id);
  };

  // تغيير البيانات
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'advanceAmount' ? Number(value) : value
    }));
  };

  // إنشاء العهدة
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.custodianUserId) {
      Swal.fire({
        icon: 'warning',
        title: 'تنبيه',
        text: 'يجب اختيار موظف'
      });
      return;
    }

    if (formData.advanceAmount <= 0) {
      Swal.fire({
        icon: 'warning',
        title: 'تنبيه',
        text: 'يجب إدخال مبلغ المقدم'
      });
      return;
    }

    try {
      setLoading(true);
      const response = await axiosInstance.post('/custodies', formData);
      
      Swal.fire({
        icon: 'success',
        title: 'نجح',
        text: 'تم إنشاء العهدة بنجاح'
      });

      // إعادة تعيين النموذج
      setFormData({
        advanceAmount: 0,
        notes: '',
        custodianUserId: ''
      });
      setSelectedUser(null);
      setUserDetails(null);
      
      if (onSuccess) onSuccess();
      onClose();
    } catch (error) {
      console.error('Error creating custody:', error);
      Swal.fire({
        icon: 'error',
        title: 'خطأ',
        text: error.response?.data?.message || 'فشل في إنشاء العهدة'
      });
    } finally {
      setLoading(false);
    }
  };


  const filteredUsers = users.filter(user =>
    user.name?.toLowerCase().trim().includes(searchTerm.toLowerCase().trim()) ||
    user.role?.toLowerCase().trim().includes(searchTerm.toLowerCase().trim())
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">

      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden" dir="rtl">
        {/* Header */}

        <div className="bg-gradient-to-r from-mainColor to-hoverColor text-black p-6 flex justify-between items-center">
          <h2 className="text-2xl font-bold">إنشاء عهدة جديدة</h2>
          <button
            onClick={onClose}
            className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition"
          >
            <MdClose size={24} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* قسم اختيار الموظف */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">
                اختيار الموظف
              </h3>

              {/* Search Bar */}
              <div className="relative">
                <MdSearch className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="ابحث عن موظف..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mainColor focus:border-transparent"
                />
              </div>

              {/* قائمة المستخدمين */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-60 overflow-y-auto border rounded-lg p-3 bg-gray-50">
                {filteredUsers.map(user => (
                  <div
                    key={user.id}
                    onClick={() => handleSelectUser(user)}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      selectedUser?.id === user.id
                        ? 'border-mainColor bg-blue-50 shadow-md'
                        : 'border-gray-200 bg-white hover:border-mainColor hover:shadow'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-mainColor text-white rounded-full flex items-center justify-center font-bold">
                        {user.name?.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-800">{user.name}</p>
                        <p className="text-sm text-gray-500">{user.role}</p>
                      </div>
                      {selectedUser?.id === user.id && (
                        <div className="text-mainColor">✓</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* تفاصيل الموظف المحدد */}
            {userDetails && (
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-6 border-2 border-blue-200">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <MdPerson className="text-mainColor" />
                  بيانات الموظف المختار
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <MdPerson className="text-gray-500" />
                    <div>
                      <p className="text-xs text-gray-500">الاسم</p>
                      <p className="font-semibold">{userDetails.userName}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <MdEmail className="text-gray-500" />
                    <div>
                      <p className="text-xs text-gray-500">البريد الإلكتروني</p>
                      <p className="font-semibold">{userDetails.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <MdPhone className="text-gray-500" />
                    <div>
                      <p className="text-xs text-gray-500">الهاتف</p>
                      <p className="font-semibold">{userDetails.phone || '—'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <MdWork className="text-gray-500" />
                    <div>
                      <p className="text-xs text-gray-500">الفرع</p>
                      <p className="font-semibold">{userDetails.branchName || '—'}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* بيانات العهدة */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">
                بيانات العهدة
              </h3>

              {/* مبلغ المقدم */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  مبلغ المقدم (ريال سعودي) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="advanceAmount"
                  value={formData.advanceAmount}
                  onChange={handleInputChange}
                  min="0"
                  step="0.01"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mainColor focus:border-transparent text-lg"
                  placeholder="أدخل مبلغ المقدم"
                />
              </div>

              {/* ملاحظات */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ملاحظات
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  rows="4"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mainColor focus:border-transparent"
                  placeholder="أدخل أي ملاحظات إضافية..."
                />
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                disabled={loading || !selectedUser}
                className={`flex-1 py-3 rounded-lg font-semibold transition-all ${
                  loading || !selectedUser
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-mainColor text-white hover:bg-hoverColor shadow-lg hover:shadow-xl'
                }`}
              >
                {loading ? 'جاري الإنشاء...' : 'إنشاء العهدة'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300 transition"
              >
                إلغاء
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateCustodyModal;