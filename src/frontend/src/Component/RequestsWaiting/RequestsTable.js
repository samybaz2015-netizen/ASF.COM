import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck, faTimes } from "@fortawesome/free-solid-svg-icons";
import Swal from "sweetalert2";
import types from "../../util/ProjectsType";
import axiosInstance from "../../api/apiClient";


function RequestsTable({ requests, approving, onView, refresh }) {
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState("all");
  const [processingId, setProcessingId] = useState(null);
  const isAdmin = localStorage.getItem("userType") === "admin";

  useEffect(() => {
    if (isAdmin) {
      if (selectedBranch === "all") {
        setFilteredRequests(requests);
      } else {
        const filtered = requests.filter((request) =>
          request.branchName.includes(selectedBranch)
        );
        setFilteredRequests(filtered);
      }
    } else {
      setFilteredRequests(requests);
    }
  }, [requests, selectedBranch, isAdmin]);

  const getProjectTypeRoute = (orderType) => {
    switch (orderType) {
      case types.construction:
        return "construction";
      case types.emergency:
        return "emergency";
      case types.maintenance:
        return "maintenance";
      case types.special_projects:
        return "privateproject";
      default:
        return "rehabilitationworks";
    }
  };

  const handleApprove = async (request) => {
    if (processingId) return;

    try {
      const result = await Swal.fire({
        title: "تأكيد الموافقة",
        text: `هل أنت متأكد من الموافقة على الطلب رقم ${request.id}؟`,
        icon: "question",
        showCancelButton: true,
        confirmButtonText: "نعم، الموافقة",
        cancelButtonText: "إلغاء",
        confirmButtonColor: "#3085d6",
        cancelButtonColor: "#d33",
        reverseButtons: true,
      });

      if (result.isConfirmed) {
        setProcessingId(request.id);
        const response = await axiosInstance.put(`/Construction/approveProject`, {
          projectId: request.id,
          isApprove: true,
          projectType: getProjectTypeRoute(request.type),
          rejectionReason: null,
        });

        if (response.data.statusCode === 200) {
          await Swal.fire({
            title: "تمت الموافقة بنجاح",
            text: `تمت الموافقة على الطلب رقم ${request.id} بنجاح`,
            icon: "success",
            confirmButtonText: "حسناً",
            confirmButtonColor: "#3085d6",
          });
        }
        refresh();
      }
    } catch (error) {
      console.error("Error approving project:", error);
      await Swal.fire({
        title: "خطأ في الموافقة",
        text: "حدث خطأ أثناء الموافقة على الطلب. يرجى المحاولة مرة أخرى.",
        icon: "error",
        confirmButtonText: "حسناً",
        confirmButtonColor: "#3085d6",
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = (project) => {
    if (processingId) return;
    setSelectedProject(project);
    setShowRejectModal(true);
  };

  const submitRejection = async () => {
    if (!rejectionReason.trim()) {
      Swal.fire({
        icon: "error",
        title: "خطأ",
        text: "يرجى إدخال سبب الرفض",
        confirmButtonText: "حسناً",
      });
      return;
    }

    try {
      setProcessingId(selectedProject.id);
      const response = await axiosInstance.put(`/Construction/approveProject`, {
        projectId: selectedProject.id,
        isApprove: false,
        projectType: getProjectTypeRoute(selectedProject.type),
        rejectionReason: rejectionReason,
      });

      if (response.data.statusCode === 200) {
        await Swal.fire({
          title: "تم رفض المشروع بنجاح",
          text: `تم رفض الطلب رقم ${selectedProject.id} بنجاح`,
          icon: "success",
          confirmButtonText: "حسناً",
          confirmButtonColor: "#3085d6",
        });
        setShowRejectModal(false);
        refresh();
        setRejectionReason("");
      }
    } catch (error) {
      console.error("Error rejecting project:", error);
      await Swal.fire({
        title: "خطأ في الرفض",
        text: "حدث خطأ أثناء رفض المشروع. يرجى المحاولة مرة أخرى.",
        icon: "error",
        confirmButtonText: "حسناً",
        confirmButtonColor: "#3085d6",
      });
    } finally {
      setProcessingId(null);
    }
  };


  return (
    <>
      {isAdmin && (
        <div className="mb-4">
          <select
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">جميع الفروع</option>
            <option value="رياض">رياض</option>
            <option value="جدة">جدة</option>
          </select>
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider text-center">
                رقم الطلب
              </th>
              <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider text-center">
                المستخدم
              </th>

              <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider text-center">
                نوع المشروع
              </th>
              <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider text-center">
                رقم امر العمل
              </th>
              <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider text-center">
                نوع امر الطلب
              </th>
              <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider text-center">
                وصف العمل
              </th>
              <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider text-center">
                المنطقة
              </th>
              <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider text-center">
                المكتب
              </th>
              <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider text-center">
                المقاول
              </th>
              <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider text-center">
                المستشار
              </th>
              <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider text-center">
                الحالة
              </th>
              <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider text-center">
                الإجراءات
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredRequests.map((request) => (
              <tr
                key={request.id}
                className="hover:bg-gray-50 transition-colors duration-150"
              >
                <td className="px-3 py-2 whitespace-nowrap text-center text-sm">
                  {request.id}
                </td>
                <td className="px-3 py-2 whitespace-nowrap text-center text-sm">
                  <div className="flex items-center flex-col justify-center">
                    <span className="text-sm font-medium">
                      {request.userName}
                    </span>
                  </div>
                </td>
                <td className="px-3 py-2 whitespace-nowrap text-center text-sm">
                  {request.type}
                </td>
                <td className="px-3 py-2 whitespace-nowrap text-center text-sm">
                  {request.faultNumber}
                </td>
                <td className="px-3 py-2 whitespace-nowrap text-center text-sm">
                  {request.workOrderType}
                </td>
                <td className="px-3 py-2 whitespace-nowrap text-center text-sm">
                  {request.workDescription}
                </td>
                <td className="px-3 py-2 whitespace-nowrap text-center text-sm">
                  {request.district}
                </td>
                <td className="px-3 py-2 whitespace-nowrap text-center text-sm">
                  {request.office}
                </td>
                <td className="px-3 py-2 whitespace-nowrap text-center text-sm">
                  {request.contractor}
                </td>
                <td className="px-3 py-2 whitespace-nowrap text-center text-sm">
                  {request.consultant}
                </td>
                <td className="px-3 py-2 whitespace-nowrap text-center text-sm">
                  <span
                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      request.situation === "لا يحتاج تصريح"
                        ? "bg-green-100 text-green-800"
                        : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {request.situation}
                  </span>
                </td>
                <td className="px-3 py-2 whitespace-nowrap text-center text-sm space-x-2">
                  <button
                    onClick={() => onView(request)}
                    className="text-blue-600 hover:text-blue-900 transition-colors duration-200"
                    title="عرض التفاصيل"
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
                  <button
                    onClick={() => handleApprove(request)}
                    disabled={processingId === request.id}
                    className="text-green-600 hover:text-green-900 transition-colors duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
                    title="موافقة"
                  >
                    <FontAwesomeIcon icon={faCheck} />
                  </button>
                  <button
                    onClick={() => handleReject(request)}
                    disabled={processingId === request.id}
                    className="text-red-600 hover:text-red-900 transition-colors duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
                    title="رفض"
                  >
                    <FontAwesomeIcon icon={faTimes} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Rejection Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
          <div className="bg-white p-6 rounded-lg shadow-xl w-96">
            <h3 className="text-lg font-semibold mb-4">سبب الرفض</h3>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md mb-4"
              rows="4"
              placeholder="أدخل سبب الرفض..."
            />
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectionReason("");
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                إلغاء
              </button>
              <button
                onClick={submitRejection}
                disabled={processingId === selectedProject?.id}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                تأكيد الرفض
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default RequestsTable;