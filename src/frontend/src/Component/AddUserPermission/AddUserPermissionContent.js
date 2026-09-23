import React, { useEffect, useState } from "react";
import axios from "axios";
import { domain, Url } from "../../function/FunctionApi";
import Swal from "sweetalert2";

function AddUserPermissionContent() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Fetch data from the API
    axios
      .get(Url + "Account/engineers")
      .then((response) => {
        setUsers(response.data.data);
        setLoading(false);
      })
      .catch((error) => {
        console.error("حدث خطأ أثناء جلب البيانات!", error);
        setError(error);
        setLoading(false);
      });
  }, []);

  const handlePermissionToggle = async (id) => {
    const userToUpdate = users.find((user) => user.id === id);
    if (!userToUpdate) return;

    const updatedPermission = !userToUpdate.canCreateProjectOutsideCity;
    const actionText = updatedPermission ? "تفعيل" : "إلغاء تفعيل";

    const result = await Swal.fire({
      title: "تأكيد العملية",
      text: `هل أنت متأكد من ${actionText} صلاحية هذا المستخدم؟`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "نعم، تأكيد",
      cancelButtonText: "إلغاء",
    });

    if (result.isConfirmed) {
      try {
        await axios.put(Url + "Account/engineers/update-permission", {
          engineerId: id,
          canCreateOutsideCity: updatedPermission,
        });

        setUsers(
          users.map((user) =>
            user.id === id
              ? { ...user, canCreateProjectOutsideCity: updatedPermission }
              : user
          )
        );

        Swal.fire({
          title: "تم التحديث!",
          text: "تم تحديث صلاحية المستخدم بنجاح.",
          icon: "success",
          confirmButtonText: "حسنًا",
        });
      } catch (error) {
        console.error("حدث خطأ أثناء تحديث الصلاحية!", error);
        Swal.fire({
          title: "خطأ!",
          text: "حدث خطأ أثناء تحديث الصلاحية.",
          icon: "error",
          confirmButtonText: "حسنًا",
        });
      }
    }
  };

  if (loading) {
    return <div className="text-center py-10">جارٍ التحميل...</div>;
  }

  if (error) {
    return (
      <div className="text-center py-10 text-red-500">
        حدث خطأ أثناء جلب البيانات!
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">
        إدارة صلاحيات المستخدمين
      </h1>
      <div className="max-w-4xl mx-auto">
        {users.map((user) => (
          <div
            key={user.id}
            className="bg-white shadow-lg rounded-lg p-6 mb-6 hover:shadow-xl transition-shadow duration-300"
          >
            <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0 md:space-x-6">
              {/* User Image and Basic Info */}
              <div className="flex items-center space-x-4">
                <img
                  src={domain + user.userImage}
                  alt={user.displayName}
                  className="w-16 h-16 rounded-full border-2 border-blue-500"
                />
                <div>
                  <h2 className="text-xl font-semibold text-gray-800">
                    {user.displayName}
                  </h2>
                  <p className="text-sm text-gray-600">{user.email}</p>
                  <p className="text-sm text-gray-600">
                    الهاتف: {user.phoneNumber}
                  </p>
                </div>
              </div>

              {/* Additional User Details */}
              <div className="flex-1 text-right">
                {/* <p className="text-gray-700">
                  <span className="font-medium">نوع المستخدم:</span>{" "}
                  {user.userType}
                </p> */}
                {/* <p className="text-gray-700">
                  <span className="font-medium">الفرع:</span> {user.branchId}
                </p> */}
                <p className="text-gray-700">
                  <span className="font-medium">
                    إنشاء مشاريع خارج المدينة:
                  </span>{" "}
                  {user.canCreateProjectOutsideCity ? "نعم" : "لا"}
                </p>
              </div>

              {/* Permission Toggle */}
              <div className="flex items-center space-x-3">
                <label className="flex items-center gap-2 space-x-2">
                  <input
                    type="checkbox"
                    className="form-checkbox h-5 w-5 text-secondaryColor rounded"
                    checked={user.canCreateProjectOutsideCity}
                    onChange={() => handlePermissionToggle(user.id)}
                  />
                  <span className="text-gray-700">تفعيل الصلاحية</span>
                </label>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default AddUserPermissionContent;
