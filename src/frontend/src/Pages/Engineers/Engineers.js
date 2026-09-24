import React, { useEffect, useState, useMemo } from "react";
import { fetchDataWithRetries } from "../../function/FunctionApi";
import profilePlaceholder from "../../Image/team-01.png";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEllipsis, faEdit, faTrash } from "@fortawesome/free-solid-svg-icons";
import { Link } from "react-router-dom";
import { Url } from "../../function/FunctionApi";
import axios from "axios";
import Swal from "sweetalert2";

function Engineers() {
  const [accounts, setAccounts] = useState([]);
  const [filter, setFilter] = useState("منطقة الرياض");
  const [popupVisible, setPopupVisible] = useState(null);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [accountToDelete, setAccountToDelete] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [loadingDelete, setLoadingDelete] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const getData = async () => {
      try {
        setLoading(true);
        // النقطة تعيد صفحة مغلّفة { totalCount, page, data } لا مصفوفة،
        // فكان accounts.filter يسقط وتظهر الصفحة بيضاء بالكامل.
        await fetchDataWithRetries("Account/accounts", (payload) =>
          setAccounts(Array.isArray(payload) ? payload : payload?.data ?? [])
        );
      } catch (error) {
        setError("Error fetching accounts data. Please try again.");
        console.error("Error fetching accounts data:", error);
      } finally {
        setLoading(false);
      }
    };
    getData();
  }, []);

  const handleFilterChange = (branch) => {
    setFilter(branch);
    setPopupVisible(null);
  };

  const togglePopup = (id, event) => {
    event.stopPropagation();
    setPopupVisible((prevId) => (prevId === id ? null : id));
  };

  const handleDeleteClick = (account, event) => {
    event.stopPropagation();
    setAccountToDelete(account);
    setDeleteModalVisible(true);
    setPopupVisible(null);
  };

  const handleConfirmDelete = async () => {
    if (!accountToDelete) return;
    
    setLoadingDelete(true);
    try {
      await axios.delete(
        `${Url}Account/remove-account?userName=${accountToDelete.userName}`
      );
      setAccounts((prevAccounts) =>
        prevAccounts.filter(
          (account) => account.userName !== accountToDelete.userName
        )
      );
      setDeleteModalVisible(false);
      setAccountToDelete(null);
      setError(null);
    } catch (error) {
      console.error("Error deleting account:", error);
      setError("Error deleting account. Please try again.");
    } finally {
      setLoadingDelete(false);
    }
  };

  const handleCancelDelete = () => {
    setDeleteModalVisible(false);
    setAccountToDelete(null);
  };

  const handleToggleAccountStatus = async (userId) => {
    try {
      setIsLoading(true);
      const response = await axios.post(
        `${Url}Account/toggle-account-status/${userId}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (response.status === 200) {
        // Update the accounts list
        setAccounts(accounts.map(account => 
          account.id === userId 
            ? { ...account, emailConfirmed: !account.emailConfirmed }
            : account
        ));
        
        Swal.fire({
          title: "تم التحديث بنجاح",
          text: "تم تحديث حالة الحساب بنجاح",
          icon: "success",
          confirmButtonText: "حسناً",
          confirmButtonColor: "#3085d6",
        });
      }
    } catch (error) {
      console.error("Error toggling account status:", error);
      Swal.fire({
        title: "خطأ",
        text: "حدث خطأ أثناء تحديث حالة الحساب",
        icon: "error",
        confirmButtonText: "حسناً",
        confirmButtonColor: "#3085d6",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest(".popup-menu") && !event.target.closest(".options-icon")) {
        setPopupVisible(null);
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, []);

  const getUserTypeDisplay = (userType) => {
    switch (userType?.toLowerCase()) {
      case "admin":
      case "ادمن":
        return "مشرف";
      case "supervisor":
      case "مشرف":
        return "مشرف";
      case "eng":
      case "مهندس":
      case "المهندس":
        return "مهندس";
      default:
        return userType;
    }
  };

  const filteredAccounts = useMemo(() => {
    return accounts.filter((account) => account.branchName == filter);
  }, [accounts, filter]);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => handleFilterChange("منطقة الرياض")}
              className={`px-6 py-2 rounded-md transition-colors min-w-[120px] ${
                filter === "منطقة الرياض"
                  ? "bg-[#2A385B] text-white"
                  : "bg-white text-[#2A385B] border border-[#2A385B] hover:bg-[#2A385B]/5"
              }`}
            >
              فرع الرياض
            </button>
            <button
              onClick={() => handleFilterChange("جدة")}
              className={`px-6 py-2 rounded-md transition-colors min-w-[120px] ${
                filter === "جدة"
                  ? "bg-[#2A385B] text-white"
                  : "bg-white text-[#2A385B] border border-[#2A385B] hover:bg-[#2A385B]/5"
              }`}
            >
              فرع جدة
            </button>
          </div>
          <Link
            to="/add-account"
            className="bg-[#BC915C] text-white px-6 py-2 rounded-md hover:bg-[#BC915C]/90 transition-colors"
          >
            إضافة حساب +
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center items-center min-h-[200px]">
            <div className="w-10 h-10 border-4 border-[#2A385B] border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : error ? (
          <div className="text-red-500 text-center p-8 bg-red-50 rounded-lg">
            {error}
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {filteredAccounts.length > 0 ? (
              filteredAccounts.map((account) => (
                <div
                  key={account.email}
                  className="bg-white rounded-lg shadow-sm p-6 flex items-center gap-4 hover:shadow-md transition-shadow relative"
                >
                  <img
                    src={account.userImage || profilePlaceholder}
                    alt={account.userName}
                    className="w-16 h-16 rounded-full object-cover border-2 border-[#2A385B]/10"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = profilePlaceholder;
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-[#2A385B] truncate">
                      {account.userName}
                    </h3>
                    <p className="text-sm text-[#2A385B]/60 truncate">
                      {account.email}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                          account.userType?.toLowerCase() === "admin"
                            ? "bg-[#2A385B]/10 text-[#2A385B]"
                            : account.userType?.toLowerCase() === "supervisor"
                            ? "bg-[#BC915C]/10 text-[#BC915C]"
                            : "bg-[#2A385B]/10 text-[#2A385B]"
                        }`}
                      >
                        {getUserTypeDisplay(account.userType)}
                      </span>
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                          account.emailConfirmed
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {account.emailConfirmed ? "نشط" : "غير نشط"}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleAccountStatus(account.id)}
                      disabled={isLoading}
                      className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                        account.emailConfirmed
                          ? "bg-red-100 text-red-700 hover:bg-red-200"
                          : "bg-green-100 text-green-700 hover:bg-green-200"
                      }`}
                    >
                      {isLoading ? (
                        <span className="flex items-center gap-2">
                          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            />
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            />
                          </svg>
                          جاري التحميل...
                        </span>
                      ) : account.emailConfirmed ? (
                        "تعطيل الحساب"
                      ) : (
                        "تفعيل الحساب"
                      )}
                    </button>
                    <div className="relative">
                      <button
                        className="options-icon text-[#2A385B]/50 hover:text-[#2A385B] p-2 rounded-md hover:bg-[#2A385B]/5 transition-colors"
                        onClick={(e) => togglePopup(account.id, e)}
                      >
                        <FontAwesomeIcon icon={faEllipsis} />
                      </button>
                      {popupVisible === account.id && (
                        <div className="popup-menu absolute top-full right-0 mt-2 bg-white rounded-lg shadow-lg p-2 min-w-[150px] z-10">
                          <Link
                            to={`/add-account/${account.id}`}
                            className="flex items-center gap-2 px-4 py-2 text-[#2A385B]/80 hover:bg-[#2A385B]/5 rounded-md transition-colors"
                          >
                            <FontAwesomeIcon icon={faEdit} />
                            تعديل
                          </Link>
                          <button
                            className="flex items-center gap-2 px-4 py-2 text-red-500 hover:bg-red-50 rounded-md transition-colors w-full"
                            onClick={(e) => handleDeleteClick(account, e)}
                          >
                            <FontAwesomeIcon icon={faTrash} />
                            مسح
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-[#2A385B]/60 p-8 bg-white rounded-lg">
                لا توجد بيانات متاحة
              </div>
            )}
          </div>
        )}

        {deleteModalVisible && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-xl font-semibold text-[#2A385B] mb-4">
                تأكيد الحذف
              </h3>
              <p className="text-[#2A385B]/80 mb-6">
                هل أنت متأكد من حذف {getUserTypeDisplay(accountToDelete?.userType)} {accountToDelete?.userName}؟
              </p>
              <div className="flex justify-center gap-4">
                <button
                  onClick={handleConfirmDelete}
                  disabled={loadingDelete}
                  className={`px-6 py-2 bg-red-500 text-white rounded-md transition-colors ${
                    loadingDelete
                      ? "opacity-50 cursor-not-allowed"
                      : "hover:bg-red-600"
                  }`}
                >
                  {loadingDelete ? "جارٍ الحذف..." : "تأكيد"}
                </button>
                <button
                  onClick={handleCancelDelete}
                  className="px-6 py-2 bg-[#2A385B]/10 text-[#2A385B] rounded-md hover:bg-[#2A385B]/20 transition-colors"
                >
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Engineers;
