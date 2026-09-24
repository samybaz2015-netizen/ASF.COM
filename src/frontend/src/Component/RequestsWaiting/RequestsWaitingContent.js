import React, { useState, useEffect } from "react";
import axiosInstance from "../../api/apiClient";
import DataViewerModal from "../DataViewerModal/DataViewerModal";
import Swal from "sweetalert2";
import RequestsTable from "./RequestsTable";
import LoadingSpinner from "./LoadingSpinner";
import ErrorMessage from "./ErrorMessage";
import EmptyState from "./EmptyState";
import types from "../../util/ProjectsType";

function RequestsWaitingContent() {
  const PATH = "/Construction/getUnapprovedProjects";
  // const APPROVE_PATH = "/api/Construction/approveProject";
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [approving, setApproving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [requests, setRequests] = useState({
    privateProjects: [],
    rehabilitationWorks: [],
    constructions: [],
    emergencies: [],
    maintenances: [],
  });
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);

  useEffect(() => {
    fetchWaitingRequests();
  }, []);

  const fetchWaitingRequests = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(PATH);
      setRequests(response.data);
      setError(null);
    } catch (err) {
      console.error("Error fetching waiting requests:", err);
      setError("Failed to load waiting requests. Please try again later.");
      Swal.fire({
        title: "خطأ في تحميل البيانات",
        text: "فشل في تحميل الطلبات. يرجى المحاولة مرة أخرى لاحقاً.",
        icon: "error",
        confirmButtonText: "حسناً",
        confirmButtonColor: "#3085d6",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApproveAll = async () => {
    try {
      const result = await Swal.fire({
        title: "تأكيد الموافقة على جميع الطلبات",
        text: "هل أنت متأكد من الموافقة على جميع الطلبات المعلقة؟",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "نعم، الموافقة على الكل",
        cancelButtonText: "إلغاء",
        confirmButtonColor: "#3085d6",
        cancelButtonColor: "#d33",
        reverseButtons: true,
      });

      if (result.isConfirmed) {
        setApproving(true);
        const response = await axiosInstance.put("/Construction/approveAllProjects");
        
        if (response.data.statusCode === 200) {
          await Swal.fire({
            title: "تمت الموافقة بنجاح",
            text: "تمت الموافقة على جميع الطلبات بنجاح",
            icon: "success",
            confirmButtonText: "حسناً",
            confirmButtonColor: "#3085d6",
          });
          // Refresh the list to show updated data
          await fetchWaitingRequests();
        } else {
          throw new Error(response.data.message || "فشل في الموافقة على الطلبات");
        }
      }
    } catch (error) {
      console.error("Error approving all projects:", error);
      await Swal.fire({
        title: "خطأ في الموافقة",
        text: error.message || "حدث خطأ أثناء الموافقة على الطلبات. يرجى المحاولة مرة أخرى.",
        icon: "error",
        confirmButtonText: "حسناً",
        confirmButtonColor: "#3085d6",
      });
    } finally {
      setApproving(false);
    }
  };

  const openViewer = (request) => {
    setSelectedRequest(request);
    setIsViewerOpen(true);
  };

  const closeViewer = () => {
    setIsViewerOpen(false);
    setSelectedRequest(null);
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <ErrorMessage error={error} onRetry={fetchWaitingRequests} />;
  }

  const allRequests = [
    ...requests.privateProjects,
    ...requests.rehabilitationWorks,
    ...requests.constructions,
    ...requests.emergencies,
    ...requests.maintenances,
  ];

  const filteredRequests = allRequests.filter((request) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      request.id.toString().includes(searchLower) ||
      (request.workOrderType && request.workOrderType.toLowerCase().includes(searchLower)) ||
      (request.faultNumber && request.faultNumber.toLowerCase().includes(searchLower))
    );
  });

  if (allRequests.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="w-full max-w-[95%] mx-auto px-2 py-6">
      <div className="bg-white rounded-lg shadow-lg p-4 md:p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-xl md:text-2xl font-bold text-gray-800 text-center">
            الطلبات في انتظار الموافقة
          </h1>
          <button
            onClick={handleApproveAll}
            disabled={approving || allRequests.length === 0}
            className={`px-4 py-2 rounded-md text-white font-medium ${
              approving || allRequests.length === 0
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-green-600 hover:bg-green-700"
            } transition-colors duration-200`}
          >
            {approving ? "جاري الموافقة..." : "الموافقة على الكل"}
          </button>
        </div>

        <div className="mb-4">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ابحث عن رقم الطلب، نوع امر الطلب، أو رقم امر العمل..."
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            dir="rtl"
          />
        </div>

        <RequestsTable 
          refresh={fetchWaitingRequests}
          requests={filteredRequests}
          approving={approving}
          onView={openViewer}
        />
      </div>

      <DataViewerModal
        isOpen={isViewerOpen}
        onClose={closeViewer}
        data={selectedRequest}
      />
    </div>
  );
}

export default RequestsWaitingContent;
