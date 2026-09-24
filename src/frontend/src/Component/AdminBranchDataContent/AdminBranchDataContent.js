import React, { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import axiosInstance from "../../api/apiClient";
import { useExcelExport } from "../../hooks/useExcelExport";
// import useDataViewer from '../../hooks/useDataViewer';
import DataViewerModal from "../DataViewerModal/DataViewerModal";
import { FaSearch } from "react-icons/fa";
import FilterationOrders from "../FilterationOrders/FilterationOrders";

const AdminBranchDataContent = () => {
  const [searchParams] = useSearchParams();
  const branchName = searchParams.get("branchName");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [branchData, setBranchData] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  const [filters, setFilters] = useState({
    office: "",
    situation: "",
    cableCompletion: "",
    cableLength: "",
    projectType: "",
    requestStatus: "",
    orderType: "",
    district: "",
    orderDate: "",
  });

  const { exportToExcel, isExporting } = useExcelExport();
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [selectedData, setSelectedData] = useState(null);
  const openViewer = (data) => {
    setSelectedData(data);
    setIsViewerOpen(true);
  };

  const closeViewer = () => {
    setIsViewerOpen(false);
    setSelectedData(null);
  };

  useEffect(() => {
    if (branchName) {
      fetchBranchData();
    } else {
      setError("لم يتم تحديد اسم الفرع");
      setLoading(false);
    }
  }, [branchName]);

  const fetchBranchData = async () => {
    if (!branchName) return;

    setLoading(true);
    setError(null);

    try {
      const endpoint = `/OrdersinHome/all-projects-inHome?branchName=${encodeURIComponent(
        branchName
      )}`;
      const response = await axiosInstance.get(endpoint);

      // Process the response data structure
      const projectData = [
        ...(response.data.data.RehabilitationWorks || []).map((project) => ({
          ...project,
          projectType: "rehabilitationWorks",
        })),
        ...(response.data.data.Constructions || []).map((project) => ({
          ...project,
          projectType: "constructionProjects",
        })),
        ...(response.data.data.Emergencies || []).map((project) => ({
          ...project,
          projectType: "emergencyProjects",
        })),
        ...(response.data.data.Maintenances || []).map((project) => ({
          ...project,
          projectType: "maintainProjects",
        })),
      ];
      console.log(projectData);
      setBranchData(projectData);
    } catch (err) {
      console.error("Error fetching branch data:", err);
      setError("حدث خطأ أثناء جلب بيانات الفرع. يرجى المحاولة مرة أخرى.");
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prevFilters) => ({ ...prevFilters, [name]: value }));
    setCurrentPage(1);
  };

  const renderFilterOptions = (key) => {
    const optionsMap = {
      branch: [
        { value: "", label: "الفرع" },
        { value: "الرياض", label: "الرياض" },
        { value: "جدة", label: "جدة" },
      ],
      projectType: [
        { value: "", label: "نوع المشروع" },
        { value: "ordersSubs", label: "مشتركين" },
        { value: "operationOrders", label: "عمليات وصيانة" },
        { value: "newProjects", label: "مشاريع" },
      ],
      requestStatus: [
        { value: "", label: "حالة الطلب" },
        { value: "true", label: "مؤرشف" },
        { value: "false", label: "غير مؤرشف" },
      ],
    };
    return optionsMap[key] || [];
  };

  const handleExportToExcel = () => {
    exportToExcel(filteredData, `${branchName}-projects.xlsx`);
  };

  // Filter data based on search term and filters
  const filteredData = useMemo(() => {
    let filtered = branchData;

    // Apply search term filter
    if (searchTerm) {
      filtered = filtered.filter((project) => {
        return Object.values(project).some((value) => {
          if (value === null || value === undefined) return false;
          return value.toString().toLowerCase().includes(searchTerm.toLowerCase());
        });
      });
    }

    // Apply other filters
    const {
      branch,
      office,
      situation,
      cableCompletion,
      cableLength,
      projectType,
      requestStatus,
      orderType,
      district,
      orderDate,
    } = filters;

    return filtered.filter((project) => {
      const matchesBranch = !branch || project.branchName?.toLowerCase() === branch.toLowerCase();
      const matchesOffice = !office || project.office?.toLowerCase().includes(office.toLowerCase());
      const matchesSituation = !situation || project.situation?.toLowerCase().includes(situation.toLowerCase());
      const matchesCableCompletion = !cableCompletion || project.cableCompletion?.toString().includes(cableCompletion);
      const matchesCableLength = !cableLength || project.cableLength?.toString().includes(cableLength);
      const matchesProjectType = !projectType || (typeof project.type === "string" && project.type.toLowerCase().includes(projectType.toLowerCase()));
      const matchesRequestStatus = !requestStatus || project.isArchived?.toString() === requestStatus;
      const matchesOrderType = !orderType || project.orderType?.toLowerCase().includes(orderType.toLowerCase());
      const matchesDistrict = !district || project.district?.toLowerCase().includes(district.toLowerCase());
      const matchesOrderDate = !orderDate || new Date(project.orderDate).toISOString().startsWith(orderDate);

      return (
        matchesBranch &&
        matchesOffice &&
        matchesSituation &&
        matchesCableCompletion &&
        matchesCableLength &&
        matchesProjectType &&
        matchesRequestStatus &&
        matchesOrderType &&
        matchesDistrict &&
        matchesOrderDate
      );
    });
  }, [branchData, searchTerm, filters]);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const resetFilters = () => {
    setSearchTerm("");
    setCurrentPage(1);
    setFilters({
      branch: "",
      office: "",
      situation: "",
      cableCompletion: "",
      cableLength: "",
      projectType: "",
      requestStatus: "",
      orderType: "",
      district: "",
      orderDate: "",
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        <span className="sr-only">جاري التحميل...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative"
        role="alert"
      >
        <strong className="font-bold">خطأ!</strong>
        <span className="block sm:inline"> {error}</span>
        <button
          onClick={fetchBranchData}
          className="mt-2 bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm"
        >
          إعادة المحاولة
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[95%] mx-auto px-2 py-6">
      <div className="bg-white rounded-lg shadow-lg p-4 md:p-6 mb-6">
        <h1 className="text-xl md:text-2xl font-bold text-gray-800 mb-4 text-center">
          بيانات مشاريع فرع {branchName}
        </h1>

        <div className="flex flex-col gap-4 mb-6">


          <div className="flex gap-3 flex-wrap items-center justify-center">
            {Object.keys(filters).map((key) => (
              <div key={key} className="w-[300px]">
                <FilterationOrders
                  name={key}
                  value={filters[key]}
                  onChange={handleFilterChange}
                  options={renderFilterOptions(key)}
                />
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
          <div className="w-full md:w-1/2">
            <div className="relative">
              <input
                type="text"
                placeholder="ابحث في جميع البيانات..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 pr-10 py-2"
                aria-label="بحث في البيانات"
                
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <FaSearch className="h-5 w-5 text-gray-400" />
              </div>
            </div>
          </div>

          <div className="flex gap-2 w-full md:w-auto">
            <button
              onClick={handleExportToExcel}
              disabled={isExporting || filteredData.length === 0}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md flex items-center gap-2 disabled:opacity-50 transition-colors duration-200 w-full md:w-auto justify-center"
              aria-label="تصدير البيانات إلى ملف Excel"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
              {isExporting ? "جاري التصدير..." : "تصدير إلى Excel"}
            </button>

            <button
              onClick={resetFilters}
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-md flex items-center gap-2 transition-colors duration-200 w-full md:w-auto justify-center"
              aria-label="إعادة تعيين جميع الفلاتر"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
              إعادة تعيين
            </button>
          </div>
        </div>

        {filteredData.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-12 w-12 mx-auto text-gray-400 mb-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-1">
              لا توجد نتائج
            </h3>
            <p className="text-gray-500">
              لم يتم العثور على مشاريع تطابق معايير البحث الحالية.
            </p>
            <button
              onClick={resetFilters}
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
            >
              إعادة تعيين الفلاتر
            </button>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      scope="col"
                      className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider text-center"
                    >
                      رقم الطلب
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider text-center"
                    >
                      وصف العمل
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider text-center"
                    >
                      المنطقة
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider text-center"
                    >
                      المقاول
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider text-center"
                    >
                      المكتب
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider text-center"
                    >
                      الحالة
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider text-center"
                    >
                      تاريخ البدء
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider text-center"
                    >
                      تاريخ الانتهاء
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider text-center"
                    >
                      مدة التنفيذ
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider text-center"
                    >
                      القيمة المقدرة
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider text-center"
                    >
                      الإجراءات
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentItems.map((project) => (
                    <tr
                      key={project.id}
                      className="hover:bg-gray-50 transition-colors duration-150"
                    >
                      <td className="px-3 py-2 whitespace-nowrap text-center text-sm">
                        {project.orderCode}
                      </td>
                      <td
                        className="px-3 py-2 whitespace-nowrap text-center text-sm max-w-xs truncate"
                        title={project.workDescription}
                      >
                        {project.workDescription}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-center text-sm">
                        {project.district}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-center text-sm">
                        {project.contractor}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-center text-sm">
                        {project.office}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-center text-sm">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                            project.situation
                          )}`}
                        >
                          {project.situation}
                        </span>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-center text-sm">
                        {formatDate(project.createAt)}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-center text-sm">
                        {formatDate(project.completionDate)}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-center text-sm">
                        {project.durationOfImplementation} يوم
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-center text-sm">
                        {project.estimatedValue
                          ? `${project.estimatedValue} ريال`
                          : "-"}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-center text-sm">
                        <button
                          onClick={() => openViewer(project)}
                          className="text-blue-600 hover:text-blue-900 transition-colors duration-200"
                          title="عرض التفاصيل"
                          aria-label={`عرض تفاصيل مشروع ${project.orderCode}`}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                            <path
                              fillRule="evenodd"
                              d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center mt-6">
                <nav
                  className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px"
                  aria-label="التنقل بين الصفحات"
                >
                  <button
                    onClick={() => paginate(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 transition-colors duration-200"
                    aria-label="الصفحة السابقة"
                  >
                    <span className="sr-only">السابق</span>
                    <svg
                      className="h-5 w-5"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        fillRule="evenodd"
                        d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                  <div className=" flex  items-center justify-center gap-1 flex-wrap w-full overflow-x-auto">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                      (page) => (
                        <button
                          key={page}
                          onClick={() => paginate(page)}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                            currentPage === page
                              ? "z-10 bg-blue-50 border-blue-500 text-blue-600"
                              : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                          } transition-colors duration-200`}
                          aria-label={`الصفحة ${page}`}
                          aria-current={
                            currentPage === page ? "page" : undefined
                          }
                        >
                          {page}
                        </button>
                      )
                    )}
                  </div>
                  <button
                    onClick={() => paginate(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 transition-colors duration-200"
                    aria-label="الصفحة التالية"
                  >
                    <span className="sr-only">التالي</span>
                    <svg
                      className="h-5 w-5"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        fillRule="evenodd"
                        d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                </nav>
              </div>
            )}

            <div className="mt-4 text-sm text-gray-500 text-center">
              عرض {indexOfFirstItem + 1} إلى{" "}
              {Math.min(indexOfLastItem, filteredData.length)} من{" "}
              {filteredData.length} مشروع
            </div>
          </>
        )}
      </div>

      <DataViewerModal
        isOpen={isViewerOpen}
        onClose={closeViewer}
        data={selectedData}
      />
    </div>
  );
};

// Helper functions
const getStatusColor = (status) => {
  const colors = {
    "قيد التنفيذ": "bg-blue-100 text-blue-800",
    "تم التنفيذ": "bg-green-100 text-green-800",
    معلق: "bg-yellow-100 text-yellow-800",
    ملغي: "bg-red-100 text-red-800",
    "لا يحتاج تصريح": "bg-gray-100 text-gray-800",
  };

  return colors[status] || "bg-gray-100 text-gray-800";
};

const formatDate = (dateString) => {
  if (!dateString) return "-";

  const date = new Date(dateString);
  return date.toLocaleDateString("ar-SA");
};

export default AdminBranchDataContent;
