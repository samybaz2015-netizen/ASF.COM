import React, { useState } from 'react';
import axios from '../../api/apiClient';
import { FaUpload, FaSpinner } from 'react-icons/fa';
import Swal from 'sweetalert2';

const OfficeMangerProfileContent = () => {
  const [formData, setFormData] = useState({
    numberOfDays: '',
    reason: '',
    from: '',
    to: '',
    file: null
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({
        ...prev,
        file
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.numberOfDays) newErrors.numberOfDays = 'عدد الأيام مطلوب';
    if (!formData.reason) newErrors.reason = 'سبب الإجازة مطلوب';
    if (!formData.from) newErrors.from = 'تاريخ البداية مطلوب';
    if (!formData.to) newErrors.to = 'تاريخ النهاية مطلوب';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      Swal.fire({
        title: 'خطأ',
        text: 'يرجى ملء جميع الحقول المطلوبة',
        icon: 'error',
        confirmButtonText: 'حسناً'
      });
      return;
    }

    setLoading(true);


    try {
      const formDataToSend = new FormData();
      formDataToSend.append('numberOfDays', formData.numberOfDays);
      formDataToSend.append('reason', formData.reason);
      formDataToSend.append('from', formData.from);
      formDataToSend.append('to', formData.to);
      formDataToSend.append('file', formData.file);

      const response = await axios.post('/api/leaverequests/request', formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data',

        }
      });

      if (response.data.statusCode === 200) {
        Swal.fire({
          title: 'تم بنجاح',
          text: 'تم إرسال طلب الإجازة بنجاح',
          icon: 'success',
          confirmButtonText: 'حسناً'
        });
        setFormData({
          numberOfDays: '',
          reason: '',
          from: '',
          to: '',
          file: null
        });
      }
    } catch (error) {
      console.error('Error submitting leave request:', error);
      Swal.fire({
        title: 'خطأ',
        text: 'حدث خطأ أثناء إرسال طلب الإجازة',
        icon: 'error',
        confirmButtonText: 'حسناً'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 my-32 bg-white rounded-xl shadow-md">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">طلب إجازة</h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              عدد الأيام
            </label>
            <input
              type="number"
              name="numberOfDays"
              value={formData.numberOfDays}
              onChange={handleInputChange}
              className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-mainColor focus:border-transparent ${
                errors.numberOfDays ? 'border-red-500' : 'border-gray-300'
              }`}
              min="1"
            />
            {errors.numberOfDays && (
              <p className="text-red-500 text-sm mt-1">{errors.numberOfDays}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              سبب الإجازة
            </label>
            <input
              type="text"
              name="reason"
              value={formData.reason}
              onChange={handleInputChange}
              className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-mainColor focus:border-transparent ${
                errors.reason ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.reason && (
              <p className="text-red-500 text-sm mt-1">{errors.reason}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              من تاريخ
            </label>
            <input
              type="date"
              name="from"
              value={formData.from}
              onChange={handleInputChange}
              className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-mainColor focus:border-transparent ${
                errors.from ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.from && (
              <p className="text-red-500 text-sm mt-1">{errors.from}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              إلى تاريخ
            </label>
            <input
              type="date"
              name="to"
              value={formData.to}
              onChange={handleInputChange}
              className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-mainColor focus:border-transparent ${
                errors.to ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.to && (
              <p className="text-red-500 text-sm mt-1">{errors.to}</p>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            المرفقات (اختياري)
          </label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-mainColor transition-colors">
            <input
              type="file"
              onChange={handleFileChange}
              className="hidden"
              id="file"
            />
            <label htmlFor="file" className="cursor-pointer block">
              <FaUpload className="mx-auto text-2xl text-gray-400 mb-2" />
              <span className="text-gray-600">
                {formData.file ? formData.file.name : 'اضغط لرفع الملف'}
              </span>
            </label>
          </div>
          {errors.file && (
            <p className="text-red-500 text-sm mt-1">{errors.file}</p>
          )}
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="bg-mainColor text-white px-6 py-3 rounded-lg hover:bg-mainColor/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? (
              <>
                <FaSpinner className="animate-spin" />
                جاري الإرسال...
              </>
            ) : (
              'إرسال الطلب'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default OfficeMangerProfileContent;
