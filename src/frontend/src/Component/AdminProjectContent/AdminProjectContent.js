import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import axiosInstance from "../../api/apiClient";
import useExcelExport from "../../hooks/useExcelExport";
import useItemSelection from "../../hooks/useItemSelection";
import DataViewerModal from "../DataViewerModal/DataViewerModal";

function AdminProjectContent() {
  const [searchParams, setSearchParams] = useSearchParams();
  const situation = searchParams.get("situation");
  const projectType = searchParams.get("projectType");
  const [projectData, setProjectData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [selectedData, setSelectedData] = useState(null);

  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSituation, setSelectedSituation] = useState(situation || "");
  const [selectedProjectType, setSelectedProjectType] = useState(
    projectType || ""
  );

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Custom hooks
  const { exportToExcel, isExporting } = useExcelExport();
  const {
    selectedItems,
    selectAll,
    toggleSelectAll,
    toggleItemSelection,
    isItemSelected,
    clearSelection,
  } = useItemSelection(projectData || []);

  const openViewer = (data) => {
    setSelectedData(data);
    setIsViewerOpen(true);
  };

  const closeViewer = () => {
    setIsViewerOpen(false);
    setSelectedData(null);
  };

  // Filter options
  const situationOptions = ["تم التنفيذ", "تحت التنفيذ", "معلق", "ملغي"];
  const projectTypeOptions = [
    { value: "constructionProjects", label: "مشاريع البناء" },
    { value: "rehabilitationProjects", label: "مشاريع التأهيل" },
    { value: "emergencyProjects", label: "مشاريع الطوارئ" },
    { value: "maintenanceProjects", label: "مشاريع الصيانة" },
  ];

  useEffect(() => {
    const fetchProjectData = async () => {
      setLoading(true);
      try {
        let endpoint = "";

        // If situation is provided
        if (selectedSituation) {
          // If both situation and projectType exist
          if (selectedProjectType) {
            endpoint = `/Admin/projects-by-situation?situation=${encodeURIComponent(
              selectedSituation
            )}&projectType=${selectedProjectType}`;
          } else {
            // Only situation exists
            endpoint = `/Admin/projects-by-situation?situation=${encodeURIComponent(
              selectedSituation
            )}&projectType=${selectedProjectType}`;
          }
        } else {
          // No situation, use default endpoint
          endpoint = `/Admin/projects-by-situation?situation=${encodeURIComponent(
            selectedSituation
          )}`;
        }

        const response = await axiosInstance.get(endpoint);
        setProjectData(response.data.data);
        setError(null);
      } catch (err) {
        console.error("Error fetching project data:", err);
        setError("Failed to load project data. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchProjectData();
  }, [selectedSituation, selectedProjectType]);

  // Handle filter changes
  const handleSituationChange = (e) => {
    const value = e.target.value;
    setSelectedSituation(value);
    setCurrentPage(1); // Reset to first page when filter changes

    // Update URL params
    const newParams = new URLSearchParams(searchParams);
    if (value) {
      newParams.set("situation", value);
    } else {
      newParams.delete("situation");
    }
    setSearchParams(newParams);
  };

  const handleProjectTypeChange = (e) => {
    const value = e.target.value;
    setSelectedProjectType(value);
    setCurrentPage(1); // Reset to first page when filter changes

    // Update URL params
    const newParams = new URLSearchParams(searchParams);
    if (value) {
      newParams.set("projectType", value);
    } else {
      newParams.delete("projectType");
    }
    setSearchParams(newParams);
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Reset to first page when search term changes
  };

  // Filter data based on search term - search across all properties
  const filteredData = projectData
    ? projectData.filter((project) => {
        if (!searchTerm) return true;

        const searchLower = searchTerm.toLowerCase();

        // Search across all string properties in the project object
        return Object.values(project).some((value) => {
          if (
            typeof value === "string" &&
            value.toLowerCase().includes(searchLower)
          ) {
            return true;
          }
          return false;
        });
      })
    : [];

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // Handle Excel export
  const handleExportToExcel = () => {
    const dataToExport =
      selectedItems.length > 0
        ? filteredData.filter((item) => selectedItems.includes(item.id))
        : filteredData;

    exportToExcel(
      dataToExport,
      `projects_${new Date().toISOString().split("T")[0]}.xlsx`
    );
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[200px] gap-3">
        <div className="w-8 h-8 border-4 border-secondaryColor/20 border-t-4 border-t-mainColor rounded-full loading-spinner"></div>
        <p className="text-mainColor text-sm">جاري التحميل...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[200px] gap-3">
        <p className="text-red-500 text-lg">{error}</p>
      </div>
    );
  }

  return (
    <div className="p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl shadow-md">
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <h1 className="text-2xl font-bold text-mainColor mb-6 text-center">
          {selectedSituation ? `المشاريع - ${selectedSituation}` : "المشاريع"}
          {selectedProjectType && ` (${selectedProjectType})`}
        </h1>

        {/* Action buttons */}
        <div className="mb-6 flex flex-wrap gap-3 justify-end">
          <button
            onClick={handleExportToExcel}
            disabled={isExporting || filteredData.length === 0}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          >
            {isExporting ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                جاري التصدير...
              </>
            ) : (
              <>
                <svg
                  className="w-4 h-4 ml-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  ></path>
                </svg>
                تصديرسس إلى Excel
              </>
            )}
          </button>

          {selectedItems.length > 0 && (
            <button
              onClick={clearSelection}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-mainColor transition-all duration-200"
            >
              <svg
                className="w-4 h-4 ml-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                ></path>
              </svg>
              إلغاء التحديد ({selectedItems.length})
            </button>
          )}
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <div className="relative">
            <input
              type="text"
              placeholder="بحث في جميع البيانات..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-mainColor shadow-sm pr-10"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-1 text-center">
            ابحث في أي حقل من حقول المشروع
          </p>
        </div>
      </div>

      {/* Table */}
      {filteredData.length > 0 ? (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-md">
          <div className="max-h-[600px] overflow-y-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100 sticky top-0 z-10">
                <tr>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-10">
                    <input
                      type="checkbox"
                      checked={selectAll}
                      onChange={() => toggleSelectAll(filteredData)}
                      className="h-4 w-4 text-mainColor focus:ring-mainColor border-gray-300 rounded"
                    />
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    رقم امر العمل
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    نوع امر العمل
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    وصف العمل
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    المنطقة
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    المكتب
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    المقاول
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    المستشار
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    الحالة
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    المستندات
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
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
                    <td className="px-4 py-3 whitespace-nowrap text-center">
                      <input
                        type="checkbox"
                        checked={isItemSelected(project.id)}
                        onChange={() => toggleItemSelection(project.id)}
                        className="h-4 w-4 text-mainColor focus:ring-mainColor border-gray-300 rounded"
                      />
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 text-center">
                      {project.faultNumber}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 text-center">
                      {project.workOrderType}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 text-center">
                      {project.workDescription}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 text-center">
                      {project.district}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 text-center">
                      {project.office}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 text-center">
                      {project.contractor}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 text-center">
                      {project.consultant}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-center">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          project.situation === "تحت التنفيذ"
                            ? "bg-mainColor/20 text-mainColor"
                            : project.situation === "تم التنفيذ"
                            ? "bg-secondaryColor/20 text-secondaryColor"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {project.situation}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-center">
                      {project.modelPhotos && project.modelPhotos.length > 0 ? (
                        <div className="flex flex-wrap gap-1 justify-center">
                          {project.modelPhotos.map((photo, index) => (
                            <a
                              key={index}
                              href={`${photo}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 py-1 rounded transition-colors duration-150"
                              title={`مستند ${index + 1}`}
                            >
                              {index + 1}
                            </a>
                          ))}
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-center">
                      <button
                        onClick={() => openViewer(project)}
                        className="text-mainColor hover:text-mainColor/80 focus:outline-none transition-colors duration-200"
                        title="عرض التفاصيل"
                      >
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          ></path>
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                          ></path>
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
            <div className="flex flex-col md:flex-row justify-between items-center p-4 border-t border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
              <div className="flex space-x-2 rtl:space-x-reverse">
                <button
                  onClick={() => paginate(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`p-1 text-xs rounded ${
                    currentPage === 1
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "bg-mainColor text-white hover:bg-mainColor/90"
                  }`}
                >
                  السابق
                </button>
                <div className="flex flex-wrap items-center justify-center">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                    (number) => (
                      <button
                        key={number}
                        onClick={() => paginate(number)}
                        className={`px-2 text-xs py-1 rounded ${
                          currentPage === number
                            ? "bg-mainColor text-white"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                      >
                        {number}
                      </button>
                    )
                  )}
                </div>
                <button
                  onClick={() => paginate(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className={`p-1 text-xs rounded ${
                    currentPage === totalPages
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "bg-mainColor text-white hover:bg-mainColor/90"
                  }`}
                >
                  التالي
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200 shadow-md">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
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
          <h3 className="mt-2 text-lg font-medium text-gray-900">
            لا توجد نتائج
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            لم يتم العثور على مشاريع تطابق معايير البحث الخاصة بك.
          </p>
          <div className="mt-6">
            <button
              onClick={() => {
                setSearchTerm("");
                setSelectedSituation("");
                setSelectedProjectType("");
                setCurrentPage(1);
              }}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-gradient-to-r from-mainColor to-mainColor/90 hover:from-mainColor/90 hover:to-mainColor focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-mainColor transition-all duration-200"
            >
              إعادة تعيين الفلاتر
            </button>
          </div>
        </div>
      )}

      {/* Data Viewer Modal */}
      <DataViewerModal
        isOpen={isViewerOpen}
        onClose={closeViewer}
        data={selectedData}
      />
    </div>
  );
}

export default AdminProjectContent;
