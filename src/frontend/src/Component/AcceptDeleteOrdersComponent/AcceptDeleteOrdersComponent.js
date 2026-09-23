import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import axiosInstance from "../../api/apiClient";
import types from "../../util/ProjectsType";
import Swal from "sweetalert2";

function AcceptDeleteOrdersComponent() {
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [selectAll, setSelectAll] = useState(false);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["orders"],
    queryFn: async () => {
      const response = await axiosInstance.get("/Search/delete-requests");
      return response.data.data;
    },
    retry: 3,
  });

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedOrders(data.map(order => order.id));
    } else {
      setSelectedOrders([]);
    }
    setSelectAll(e.target.checked);
  };

  const handleSelectOrder = (orderId) => {
    setSelectedOrders(prev => {
      if (prev.includes(orderId)) {
        return prev.filter(id => id !== orderId);
      } else {
        return [...prev, orderId];
      }
    });
  };

  const handleRequest = (id, isApproved) => {
    Swal.fire({
      title: isApproved ? "تأكيد الموافقة" : "تأكيد الرفض",
      text: isApproved
        ? "هل أنت متأكد أنك تريد الموافقة على هذا الطلب؟"
        : "هل أنت متأكد أنك تريد رفض هذا الطلب؟",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: isApproved ? "نعم، موافقة!" : "نعم، رفض!",
      cancelButtonText: "إلغاء",
    }).then((result) => {
      if (result.isConfirmed) {
        axiosInstance
          .post("/Search/approve-delete", {
            requestId: id,
            isApproved: isApproved,
          })
          .then(() => {
            Swal.fire(
              isApproved ? "تمت الموافقة!" : "تم الرفض!",
              isApproved
                ? "تمت الموافقة على الطلب بنجاح!"
                : "تم رفض الطلب بنجاح!",
              "success"
            );
            refetch();
          })
          .catch(() => {
            Swal.fire("خطأ!", "حدث خطأ أثناء تنفيذ الإجراء!", "error");
          });
      }
    });
  };

  const handleBulkAction = (isApproved) => {
    if (selectedOrders.length === 0) {
      Swal.fire("تنبيه!", "الرجاء اختيار طلب واحد على الأقل", "warning");
      return;
    }

    Swal.fire({
      title: isApproved ? "تأكيد الموافقة الجماعية" : "تأكيد الرفض الجماعي",
      text: isApproved
        ? `هل أنت متأكد أنك تريد الموافقة على ${selectedOrders.length} طلب؟`
        : `هل أنت متأكد أنك تريد رفض ${selectedOrders.length} طلب؟`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: isApproved ? "نعم، موافقة!" : "نعم، رفض!",
      cancelButtonText: "إلغاء",
    }).then((result) => {
      if (result.isConfirmed) {
        const promises = selectedOrders.map(id =>
          axiosInstance.post("/Search/approve-delete", {
            requestId: id,
            isApproved: isApproved,
          })
        );

        Promise.all(promises)
          .then(() => {
            Swal.fire(
              isApproved ? "تمت الموافقة!" : "تم الرفض!",
              isApproved
                ? "تمت الموافقة على الطلبات بنجاح!"
                : "تم رفض الطلبات بنجاح!",
              "success"
            );
            setSelectedOrders([]);
            setSelectAll(false);
            refetch();
          })
          .catch(() => {
            Swal.fire("خطأ!", "حدث خطأ أثناء تنفيذ الإجراء!", "error");
          });
      }
    });
  };

  if (isLoading) {
    return <p className="text-center text-gray-500">جارٍ التحميل...</p>;
  }

  if (isError) {
    return (
      <p className="text-center text-red-500">حدث خطأ أثناء تحميل البيانات!</p>
    );
  }

  return (
    <div className=" mx-auto p-6">
      <div className="flex justify-between flex-wrap items-center gap-6 mb-6">
        <h2 className="text-2xl font-bold text-gray-800">
          طلبات الموافقة أو الحذف
        </h2>
        <div className="flex flex-wrap gap-2">
          <button
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-700"
            onClick={() => handleBulkAction(true)}
            disabled={selectedOrders.length === 0}
          >
            موافقة على المحدد ({selectedOrders.length})
          </button>
          <button
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-700"
            onClick={() => handleBulkAction(false)}
            disabled={selectedOrders.length === 0}
          >
            رفض المحدد ({selectedOrders.length})
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse border border-gray-300 bg-white">
          <thead className="bg-gray-100">
            <tr>
              <th className="border border-gray-300 p-3 text-gray-600">
                <input
                  type="checkbox"
                  checked={selectAll}
                  onChange={handleSelectAll}
                  className="form-checkbox h-5 w-5 text-blue-600"
                />
              </th>
              <th className="border border-gray-300 p-3 text-gray-600">#</th>
              <th className="border border-gray-300 p-3 text-gray-600">
                معرف الطلب
              </th>
              <th className="border border-gray-300 p-3 text-gray-600 hidden sm:table-cell">
                النوع
              </th>
              <th className="border border-gray-300 p-3 hidden sm:table-cell">
                مقدم الطلب
              </th>
              <th className="border border-gray-300 p-3">تمت الموافقة</th>
              <th className="border border-gray-300 p-3 hidden md:table-cell">
                تاريخ الطلب
              </th>
              <th className="border border-gray-300 p-3">الإجراءات</th>
            </tr>
          </thead>
          <tbody>
            {data.map((order, index) => (
              <tr key={order.id} className="text-center">
                <td className="border border-gray-300 p-3">
                  <input
                    type="checkbox"
                    checked={selectedOrders.includes(order.id)}
                    onChange={() => handleSelectOrder(order.id)}
                    className="form-checkbox h-5 w-5 text-blue-600"
                  />
                </td>
                <td className="border border-gray-300 p-3">{index + 1}</td>
                <td className="border border-gray-300 p-3">{order.orderId}</td>
                <td className="border border-gray-300 p-3 capitalize hidden sm:table-cell">
                  {types[order.type]}
                </td>
                <td className="border border-gray-300 p-3 hidden sm:table-cell">
                  {order.requestedBy}
                </td>
                <td className="border border-gray-300 p-3">
                  {order.isApproved ? (
                    <span className="text-green-600 font-semibold">نعم</span>
                  ) : (
                    <span className="text-red-600 font-semibold">لا</span>
                  )}
                </td>
                <td className="border border-gray-300 p-3 hidden md:table-cell">
                  {new Date(order.requestedAt).toLocaleString()}
                </td>
                <td className="border gap-2 border-gray-300 p-3 flex flex-col sm:flex-row sm:space-x-2">
                  <button
                    className="p-2 bg-green-500 text-white rounded hover:bg-green-700 w-full sm:w-auto"
                    onClick={() => handleRequest(order.id, true)}
                  >
                    موافقة
                  </button>
                  <button
                    className="p-2 bg-red-500 text-white rounded hover:bg-red-700 w-full sm:w-auto"
                    onClick={() => handleRequest(order.id, false)}
                  >
                    رفض
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default AcceptDeleteOrdersComponent;
