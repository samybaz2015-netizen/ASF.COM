import React, { useState } from 'react';
import { FaTimes, FaSpinner, FaUpload, FaCheck, FaExclamationTriangle } from 'react-icons/fa';
import Swal from 'sweetalert2';

const EmployeeForm = ({ 
  formData, 
  onInputChange, 
  handleSubmit, 
  onClose, 
  selectedEmployee,
  loading
}) => {
  const [errors, setErrors] = useState({});
  const [previewImage, setPreviewImage] = useState(null);

  console.log('EmployeeForm props:', { handleSubmit, formData, selectedEmployee });

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'الاسم مطلوب';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'البريد الإلكتروني مطلوب';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'البريد الإلكتروني غير صالح';
    }

    if (!formData.salary.trim()) {
      newErrors.salary = 'الراتب مطلوب';
    } else if (isNaN(formData.salary) || Number(formData.salary) <= 0) {
      newErrors.salary = 'الراتب يجب أن يكون رقماً موجباً';
    }

    if (!formData.workersProfession.trim()) {
      newErrors.workersProfession = 'المهنة مطلوبة';
    }
    if (!formData.city.trim()) {
      newErrors.city = 'المدينة مطلوبة';
    }
    if (!formData.graduationDate) {
      newErrors.graduationDate = 'تاريخ التخرج مطلوب';
    }
    if (!formData.employmentDate) {
      newErrors.employmentDate = 'تاريخ التعيين مطلوب';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChangeWrapper = (e) => {
    const { name, value, type, files } = e.target;
    
    if (type === 'file' && files && files[0]) {
      const file = files[0];
      
      if (file.type.startsWith('image/') && file.size > 5 * 1024 * 1024) {
        Swal.fire({
          title: 'خطأ',
          text: 'حجم الصورة يجب أن لا يتجاوز 5 ميجابايت',
          icon: 'error',
          confirmButtonText: 'حسناً'
        });
        return;
      }

      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreviewImage(reader.result);
        };
        reader.readAsDataURL(file);
      }

      onInputChange({
        target: {
          name,
          value: file
        }
      });
    } else {
      onInputChange(e);
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    console.log('Form submitted, handleSubmit:', handleSubmit);
    if (validateForm()) {
      if (typeof handleSubmit === 'function') {
        handleSubmit(e);
      } else {
        console.error('handleSubmit is not a function:', handleSubmit);
        Swal.fire({
          title: 'خطأ',
          text: 'حدث خطأ في معالجة النموذج',
          icon: 'error',
          confirmButtonText: 'حسناً'
        });
      }
    } else {
      Swal.fire({
        title: 'خطأ في التحقق',
        text: 'يرجى التحقق من جميع الحقول المطلوبة',
        icon: 'error',
        confirmButtonText: 'حسناً'
      });
    }
  };

  const handleClose = async () => {
    if (Object.values(formData).some(value => value !== '' && value !== null)) {
      const result = await Swal.fire({
        title: 'هل أنت متأكد؟',
        text: "سيتم فقدان جميع التغييرات غير المحفوظة!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'نعم، إلغاء',
        cancelButtonText: 'البقاء'
      });

      if (result.isConfirmed) {
        onClose();
      }
    } else {
      onClose();
    }
  };

  return (
   <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-start sm:items-center justify-center z-[9999] p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-xl p-4 sm:p-6 w-full max-w-4xl shadow-2xl transform transition-all my-4 sm:my-8 max-h-[92vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4 sm:mb-6 sticky top-0 bg-white pb-3 sm:pb-4 border-b z-10">
          <h3 className="text-lg sm:text-2xl font-bold text-gray-800">
            {selectedEmployee ? "تحديث بيانات الموظف" : "إضافة موظف جديد"}
          </h3>
          <button 
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700 transition-colors p-2 hover:bg-gray-100 rounded-full shrink-0"
            disabled={loading.create || loading.update}
          >
            <FaTimes className="text-lg sm:text-xl" />
          </button>
        </div>
        
        <form onSubmit={handleFormSubmit} className="space-y-4 sm:space-y-6">
          {/* Personal Information Section */}
          <div className="bg-gray-50 p-4 sm:p-6 rounded-lg shadow-sm">
            <h4 className="text-base sm:text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <span className="w-7 h-7 sm:w-8 sm:h-8 bg-mainColor/10 rounded-full flex items-center justify-center text-mainColor text-sm sm:text-base shrink-0">1</span>
              المعلومات الشخصية
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">الاسم <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChangeWrapper}
                  className={`w-full border ${errors.name ? 'border-red-500' : 'border-gray-300'} rounded-lg p-3 focus:ring-2 focus:ring-mainColor focus:border-transparent transition-all`}
                  required
                  disabled={loading.create || loading.update}
                />
                {errors.name && (
                  <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                    <FaExclamationTriangle className="text-xs" />
                    {errors.name}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">المهنة <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  name="workersProfession"
                  value={formData.workersProfession}
                  onChange={handleInputChangeWrapper}
                  className={`w-full border ${errors.workersProfession ? 'border-red-500' : 'border-gray-300'} rounded-lg p-3 focus:ring-2 focus:ring-mainColor focus:border-transparent transition-all`}
                  required
                  disabled={loading.create || loading.update}
                />
                {errors.workersProfession && (
                  <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                    <FaExclamationTriangle className="text-xs" />
                    {errors.workersProfession}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">رقم الهوية <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  name="nationalId"
                  value={formData.nationalId}
                  onChange={handleInputChangeWrapper}
                  className={`w-full border ${errors.nationalId ? 'border-red-500' : 'border-gray-300'} rounded-lg p-3 focus:ring-2 focus:ring-mainColor focus:border-transparent transition-all`}
                  required
                  disabled={loading.create || loading.update}
                />
                {errors.nationalId && (
                  <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                    <FaExclamationTriangle className="text-xs" />
                    {errors.nationalId}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">المدينة <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChangeWrapper}
                  className={`w-full border ${errors.city ? 'border-red-500' : 'border-gray-300'} rounded-lg p-3 focus:ring-2 focus:ring-mainColor focus:border-transparent transition-all`}
                  required
                  disabled={loading.create || loading.update}
                />
                {errors.city && (
                  <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                    <FaExclamationTriangle className="text-xs" />
                    {errors.city}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">رقم الجوال <span className="text-red-500">*</span></label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChangeWrapper}
                  className={`w-full border ${errors.phone ? 'border-red-500' : 'border-gray-300'} rounded-lg p-3 focus:ring-2 focus:ring-mainColor focus:border-transparent transition-all`}
                  required
                  disabled={loading.create || loading.update}
                  placeholder="05XXXXXXXX"
                />
                {errors.phone && (
                  <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                    <FaExclamationTriangle className="text-xs" />
                    {errors.phone}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">البريد الإلكتروني <span className="text-red-500">*</span></label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChangeWrapper}
                  className={`w-full border ${errors.email ? 'border-red-500' : 'border-gray-300'} rounded-lg p-3 focus:ring-2 focus:ring-mainColor focus:border-transparent transition-all`}
                  required
                  disabled={loading.create || loading.update}
                />
                {errors.email && (
                  <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                    <FaExclamationTriangle className="text-xs" />
                    {errors.email}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">الراتب <span className="text-red-500">*</span></label>
                <div className="relative">
                  <input
                    type="text"
                    name="salary"
                    value={formData.salary}
                    onChange={handleInputChangeWrapper}
                    className={`w-full border ${errors.salary ? 'border-red-500' : 'border-gray-300'} rounded-lg p-3 pl-12 focus:ring-2 focus:ring-mainColor focus:border-transparent transition-all`}
                    required
                    disabled={loading.create || loading.update}
                  />
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">ريال</span>
                </div>
                {errors.salary && (
                  <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                    <FaExclamationTriangle className="text-xs" />
                    {errors.salary}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">تاريخ التخرج <span className="text-red-500">*</span></label>
                <input
                  type="date"
                  name="graduationDate"
                  value={formData.graduationDate}
                  onChange={handleInputChangeWrapper}
                  className={`w-full border ${errors.graduationDate ? 'border-red-500' : 'border-gray-300'} rounded-lg p-3 focus:ring-2 focus:ring-mainColor focus:border-transparent transition-all`}
                  required
                  disabled={loading.create || loading.update}
                />
                {errors.graduationDate && (
                  <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                    <FaExclamationTriangle className="text-xs" />
                    {errors.graduationDate}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">تاريخ التعيين <span className="text-red-500">*</span></label>
                <input
                  type="date"
                  name="employmentDate"
                  value={formData.employmentDate}
                  onChange={handleInputChangeWrapper}
                  className={`w-full border ${errors.employmentDate ? 'border-red-500' : 'border-gray-300'} rounded-lg p-3 focus:ring-2 focus:ring-mainColor focus:border-transparent transition-all`}
                  required
                  disabled={loading.create || loading.update}
                />
                {errors.employmentDate && (
                  <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                    <FaExclamationTriangle className="text-xs" />
                    {errors.employmentDate}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Documents Section */}
          <div className="bg-gray-50 p-4 sm:p-6 rounded-lg shadow-sm">
            <h4 className="text-base sm:text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <span className="w-7 h-7 sm:w-8 sm:h-8 bg-mainColor/10 rounded-full flex items-center justify-center text-mainColor text-sm sm:text-base shrink-0">2</span>
              المستندات
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">السيرة الذاتية</label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-mainColor transition-colors">
                  <input
                    type="file"
                    name="cvImage"
                    onChange={handleInputChangeWrapper}
                    accept=".pdf,.doc,.docx"
                    className="hidden"
                    id="cvImage"
                    disabled={loading.create || loading.update}
                  />
                  <label htmlFor="cvImage" className="cursor-pointer block">
                    <FaUpload className="mx-auto text-2xl text-gray-400 mb-2" />
                    <span className="text-gray-600 text-sm sm:text-base">اضغط لرفع السيرة الذاتية</span>
                    {formData.cvImage && (
                      <p className="text-sm text-mainColor mt-2 flex items-center justify-center gap-1 truncate">
                        <FaCheck className="text-green-500 shrink-0" />
                        <span className="truncate">{formData.cvImage.name}</span>
                      </p>
                    )}
                  </label>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">صورة الإقامة</label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-mainColor transition-colors">
                  <input
                    type="file"
                    name="residencePhoto"
                    onChange={handleInputChangeWrapper}
                    accept="image/*"
                    className="hidden"
                    id="residencePhoto"
                    disabled={loading.create || loading.update}
                  />
                  <label htmlFor="residencePhoto" className="cursor-pointer block">
                    <FaUpload className="mx-auto text-2xl text-gray-400 mb-2" />
                    <span className="text-gray-600 text-sm sm:text-base">اضغط لرفع صورة الإقامة</span>
                    {formData.residencePhoto && (
                      <p className="text-sm text-mainColor mt-2 flex items-center justify-center gap-1 truncate">
                        <FaCheck className="text-green-500 shrink-0" />
                        <span className="truncate">{formData.residencePhoto.name}</span>
                      </p>
                    )}
                  </label>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">صورة الرخصة</label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-mainColor transition-colors">
                  <input
                    type="file"
                    name="licensePhoto"
                    onChange={handleInputChangeWrapper}
                    accept="image/*"
                    className="hidden"
                    id="licensePhoto"
                    disabled={loading.create || loading.update}
                  />
                  <label htmlFor="licensePhoto" className="cursor-pointer block">
                    <FaUpload className="mx-auto text-2xl text-gray-400 mb-2" />
                    <span className="text-gray-600 text-sm sm:text-base">اضغط لرفع صورة الرخصة</span>
                    {formData.licensePhoto && (
                      <p className="text-sm text-mainColor mt-2 flex items-center justify-center gap-1 truncate">
                        <FaCheck className="text-green-500 shrink-0" />
                        <span className="truncate">{formData.licensePhoto.name}</span>
                      </p>
                    )}
                  </label>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">صورة شخصية</label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-mainColor transition-colors">
                  <input
                    type="file"
                    name="userImage"
                    onChange={handleInputChangeWrapper}
                    accept="image/*"
                    className="hidden"
                    id="userImage"
                    disabled={loading.create || loading.update}
                  />
                  <label htmlFor="userImage" className="cursor-pointer block">
                    <FaUpload className="mx-auto text-2xl text-gray-400 mb-2" />
                    <span className="text-gray-600 text-sm sm:text-base">اضغط لرفع الصورة الشخصية</span>
                    {formData.userImage && (
                      <p className="text-sm text-mainColor mt-2 flex items-center justify-center gap-1 truncate">
                        <FaCheck className="text-green-500 shrink-0" />
                        <span className="truncate">{formData.userImage.name}</span>
                      </p>
                    )}
                  </label>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 sm:gap-4 mt-6 sm:mt-8 sticky bottom-0 bg-white pt-4 border-t">
            <button
              type="button"
              onClick={handleClose}
              className="w-full sm:w-auto px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading.create || loading.update}
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="w-full sm:w-auto px-6 py-3 bg-mainColor text-white rounded-lg hover:bg-mainColor/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              disabled={loading.create || loading.update}
            >
              {loading.create || loading.update ? (
                <>
                  <FaSpinner className="animate-spin" />
                  {selectedEmployee ? "جاري التحديث..." : "جاري الإضافة..."}
                </>
              ) : (
                selectedEmployee ? "تحديث" : "إضافة"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EmployeeForm;