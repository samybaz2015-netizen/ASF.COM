import * as XLSX from 'xlsx';

const useExportEmployees = () => {
  const exportToExcel = (employees) => {
    // Format the data for Excel
    const formattedData = employees.map(emp => ({
      'الاسم': emp.name,
      'رقم الهوية': emp.nationalId,
      'المدينة': emp.city,
      'المهنة': emp.workersProfession,
      'رقم الجوال': emp.phone,
      'البريد الإلكتروني': emp.email,
      'الراتب': emp.salary,
      'تاريخ التخرج': emp.graduationDate ? new Date(emp.graduationDate).toLocaleDateString('ar-SA') : '',
      'تاريخ التعيين': emp.employmentDate ? new Date(emp.employmentDate).toLocaleDateString('ar-SA') : '',
      'تاريخ الإنشاء': emp.created ? new Date(emp.created).toLocaleDateString('ar-SA') : '',
      'رابط السيرة الذاتية': emp.cvImage || '',
      'رابط صورة الإقامة': emp.residencePhoto || '',
      'رابط صورة الرخصة': emp.licensePhoto || '',
      'رابط الصورة الشخصية': emp.userImage || '',
      'معرف الموظف': emp.id
    }));

    // Create a new workbook
    const wb = XLSX.utils.book_new();
    
    // Convert data to worksheet
    const ws = XLSX.utils.json_to_sheet(formattedData);

    // Set column widths
    const colWidths = [
      { wch: 20 }, // الاسم
      { wch: 15 }, // رقم الهوية
      { wch: 15 }, // المدينة
      { wch: 20 }, // المهنة
      { wch: 15 }, // رقم الجوال
      { wch: 25 }, // البريد الإلكتروني
      { wch: 15 }, // الراتب
      { wch: 15 }, // تاريخ التخرج
      { wch: 15 }, // تاريخ التعيين
      { wch: 15 }, // تاريخ الإنشاء
      { wch: 50 }, // رابط السيرة الذاتية
      { wch: 50 }, // رابط صورة الإقامة
      { wch: 50 }, // رابط صورة الرخصة
      { wch: 50 }, // رابط الصورة الشخصية
      { wch: 10 }, // معرف الموظف
    ];
    ws['!cols'] = colWidths;

    // Add the worksheet to the workbook
    XLSX.utils.book_append_sheet(wb, ws, 'الموظفين');

    // Generate Excel file
    const fileName = `الموظفين_${new Date().toLocaleDateString('ar-SA')}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  return { exportToExcel };
};

export default useExportEmployees; 