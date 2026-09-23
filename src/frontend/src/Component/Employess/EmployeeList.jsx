import React, { useState } from 'react';
import {
  FaUserEdit, FaTrash, FaUser, FaSpinner, FaFilePdf,
  FaTimes, FaDownload, FaExpand, FaCompress, FaIdBadge, FaCar,
} from 'react-icons/fa';

const EmployeeList = ({ employees, onEdit, onDelete, loading }) => {
  const [selectedCV, setSelectedCV] = useState(null);
  const [selectedResidence, setSelectedResidence] = useState(null);
  const [selectedLicense, setSelectedLicense] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const handleDownload = (url, filename) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('ar-SA');
  };

  if (loading.get) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-mainColor"></div>
      </div>
    );
  }

  if (employees.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-xl shadow-sm">
        <FaUser className="text-4xl text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500 text-lg">لا يوجد موظفين</p>
      </div>
    );
  }

  return (
    <>
      <div className="w-full bg-white rounded-xl shadow-sm overflow-x-auto">
        <table className="w-full min-w-[950px] border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b-2 border-gray-100">
              {["الموظف", "رقم الهوية", "المهنة", "المدينة", "الجوال", "البريد الإلكتروني", "الراتب", "المستندات", "الإجراءات"].map((h) => (
                <th
                  key={h}
                  className={`py-3.5 px-4 text-right text-xs font-bold text-gray-400 tracking-wide whitespace-nowrap
                    ${h === "الإجراءات" ? "sticky right-0 bg-gray-50 z-10 min-w-[100px]" : ""}`}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {employees.map((emp) => (
              <tr key={emp.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50/60 transition-colors">
                {/* الموظف */}
                <td className="py-3 px-4">
                  <div className="flex items-center gap-3 min-w-[160px]">
                    <div className="w-10 h-10 rounded-full overflow-hidden border border-mainColor/20 shrink-0">
                      {emp.userImage ? (
                        <img src={emp.userImage} alt={emp.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-mainColor/10 flex items-center justify-center">
                          <FaUser className="text-mainColor" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="m-0 font-bold text-gray-800 text-sm truncate">{emp.name}</p>
                      <p className="m-0 text-xs text-gray-400">{formatDate(emp.created)}</p>
                    </div>
                  </div>
                </td>

                {/* رقم الهوية */}
                <td className="py-3 px-4 text-sm text-gray-600 whitespace-nowrap">{emp.nationalId}</td>

                {/* المهنة */}
                <td className="py-3 px-4 text-sm text-gray-600 whitespace-nowrap">{emp.workersProfession}</td>

                {/* المدينة */}
                <td className="py-3 px-4 text-sm text-gray-600 whitespace-nowrap">{emp.city}</td>

                {/* الجوال */}
                <td className="py-3 px-4 text-sm text-gray-600 whitespace-nowrap">{emp.phone}</td>

                {/* البريد الإلكتروني */}
                <td className="py-3 px-4 text-sm text-gray-600 whitespace-nowrap">{emp.email}</td>

                {/* الراتب */}
                <td className="py-3 px-4 text-sm text-gray-600 whitespace-nowrap">{emp.salary} ريال</td>

                {/* المستندات */}
                <td className="py-3 px-4">
                  <div className="flex items-center gap-3">
                    {emp.cvImage && (
                      <button onClick={() => setSelectedCV(emp.cvImage)} title="السيرة الذاتية" className="text-mainColor hover:opacity-70">
                        <FaFilePdf />
                      </button>
                    )}
                    {emp.residencePhoto && (
                      <button onClick={() => setSelectedResidence(emp.residencePhoto)} title="صورة الإقامة" className="text-mainColor hover:opacity-70">
                        <FaIdBadge />
                      </button>
                    )}
                    {emp.licensePhoto && (
                      <button onClick={() => setSelectedLicense(emp.licensePhoto)} title="صورة الرخصة" className="text-mainColor hover:opacity-70">
                        <FaCar />
                      </button>
                    )}
                  </div>
                </td>

                {/* الإجراءات */}
                <td className="py-3 px-4 sticky right-0 bg-white z-10 min-w-[100px]">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onEdit(emp)}
                      className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title="تعديل"
                      disabled={loading.update}
                    >
                      {loading.update && emp.id === loading.updateId ? <FaSpinner className="animate-spin" /> : <FaUserEdit />}
                    </button>
                    <button
                      onClick={() => onDelete(emp.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title="حذف"
                      disabled={loading.delete}
                    >
                      {loading.delete && emp.id === loading.deleteId ? <FaSpinner className="animate-spin" /> : <FaTrash />}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* CV Modal */}
      {selectedCV && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className={`bg-white rounded-xl p-6 w-full max-w-4xl flex flex-col transition-all duration-300 ${isFullscreen ? 'fixed inset-0 m-0 rounded-none' : 'h-[600px]'}`}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-800">السيرة الذاتية</h3>
              <div className="flex items-center gap-2">
                <button onClick={() => handleDownload(selectedCV, 'السيرة الذاتية.pdf')} className="p-2 text-mainColor hover:bg-mainColor/10 rounded-lg transition-colors" title="تحميل">
                  <FaDownload className="text-lg" />
                </button>
                <button onClick={() => setIsFullscreen(!isFullscreen)} className="p-2 text-mainColor hover:bg-mainColor/10 rounded-lg transition-colors" title={isFullscreen ? "تصغير" : "تكبير"}>
                  {isFullscreen ? <FaCompress className="text-lg" /> : <FaExpand className="text-lg" />}
                </button>
                <button onClick={() => { setSelectedCV(null); setIsFullscreen(false); }} className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                  <FaTimes className="text-xl" />
                </button>
              </div>
            </div>
            <div className="flex-grow relative">
              <iframe src={selectedCV} className="w-full h-full rounded-lg border border-gray-200" title="السيرة الذاتية" />
            </div>
          </div>
        </div>
      )}

      {/* Residence Photo Modal */}
      {selectedResidence && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-4xl flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-800">صورة الإقامة</h3>
              <div className="flex items-center gap-2">
                <button onClick={() => handleDownload(selectedResidence, 'صورة_الإقامة.jpg')} className="p-2 text-mainColor hover:bg-mainColor/10 rounded-lg transition-colors" title="تحميل">
                  <FaDownload className="text-lg" />
                </button>
                <button onClick={() => setSelectedResidence(null)} className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                  <FaTimes className="text-xl" />
                </button>
              </div>
            </div>
            <div className="flex-grow relative">
              <img src={selectedResidence} alt="صورة الإقامة" className="w-full h-full object-contain rounded-lg" />
            </div>
          </div>
        </div>
      )}

      {/* License Photo Modal */}
      {selectedLicense && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-4xl flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-800">صورة الرخصة</h3>
              <div className="flex items-center gap-2">
                <button onClick={() => handleDownload(selectedLicense, 'صورة_الرخصة.jpg')} className="p-2 text-mainColor hover:bg-mainColor/10 rounded-lg transition-colors" title="تحميل">
                  <FaDownload className="text-lg" />
                </button>
                <button onClick={() => setSelectedLicense(null)} className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                  <FaTimes className="text-xl" />
                </button>
              </div>
            </div>
            <div className="flex-grow relative">
              <img src={selectedLicense} alt="صورة الرخصة" className="w-full h-full object-contain rounded-lg" />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default EmployeeList;