import { useEffect, useState, useCallback, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faSearch, faChevronLeft, faChevronRight,
  faTimes, faTrash, faPlus, faSpinner,
} from "@fortawesome/free-solid-svg-icons";
import { Link } from "react-router-dom";
import axios from "axios";
import Swal from "sweetalert2";

import { Url } from "../../function/FunctionApi";
import { USER_TYPES, authHeaders, myType, btnClass } from "./AccountsConstants";
import AccountRow from "./Accountrow";
import PermissionsModal from "./PermissionsModal";

export default function Accounts() {
  const [userType, setUserType] = useState("eng");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const [accounts, setAccounts] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState(null);

  const [popup, setPopup] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [permTarget, setPermTarget] = useState(null);

  const searchRef = useRef(null);

  const fetchAccounts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page, pageSize, userType,
        ...(search ? { search } : {}),
      });
      const res = await axios.get(`${Url}Account/accounts?${params}`, { headers: authHeaders() });
      const body = res.data;
      setAccounts(body.data || []);
      setTotalPages(body.totalPages || 1);
      setTotalCount(body.totalCount || 0);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [page, userType, search]);

  useEffect(() => { fetchAccounts(); }, [fetchAccounts]);

  const changeType = (t) => { setUserType(t); setPage(1); };
  const changeSearch = (v) => { setSearch(v); setPage(1); };

  useEffect(() => {
    const h = (e) => {
      if (!e.target.closest("[data-popup]") && !e.target.closest("[data-popup-btn]"))
        setPopup(null);
    };
    document.addEventListener("click", h);
    return () => document.removeEventListener("click", h);
  }, []);

  const handleToggle = async (acc) => {
    setTogglingId(acc.id);
    try {
      await axios.post(`${Url}Account/toggle-account-status/${acc.id}`, {}, { headers: authHeaders() });
      setAccounts((prev) =>
        prev.map((a) => a.id === acc.id ? { ...a, emailConfirmed: !a.emailConfirmed } : a),
      );
    } catch {
      Swal.fire({ icon: "error", title: "خطأ", text: "تعذّر تحديث الحالة", confirmButtonColor: "#2A385B" });
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await axios.delete(`${Url}Account/remove-account?userName=${deleteTarget.userName}`, {
        headers: authHeaders(),
      });
      setDeleteTarget(null);
      fetchAccounts();
    } catch {
      Swal.fire({ icon: "error", title: "خطأ", text: "تعذّر حذف الحساب", confirmButtonColor: "#2A385B" });
    }
  };

  const isAdmin = myType() === "admin";
  const isSupervisor = myType() === "supervisor";

  const visibleTypes = USER_TYPES.filter((t) => {
    if (isAdmin) return true;
    if (isSupervisor) return ["officemanager", "eng", "contractor"].includes(t.key);
    return ["eng", "contractor"].includes(t.key);
  });

  return (
    <div className="min-h-screen bg-[#F4F6FA] p-4 md:p-8 font-cairo box-border overflow-x-hidden">

      {/* Header */}
      <div className="flex justify-between items-center flex-wrap gap-3 mb-6">
        <div>
          <h1 className="m-0 text-2xl font-extrabold text-mainColor">إدارة الحسابات</h1>
          <p className="mt-1 mb-0 text-sm text-[rgba(42,56,91,0.3)]">{totalCount} حساب مسجّل</p>
        </div>
        <Link
          to="/add-account"
          className="flex items-center gap-2 bg-secondaryColor text-white px-6 py-2.5 rounded-[10px] font-bold text-sm no-underline shadow-[0_4px_14px_rgba(188,145,92,0.1)]"
        >
          <FontAwesomeIcon icon={faPlus} />
          إضافة حساب
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl p-4 px-5 mb-5 flex gap-4 flex-wrap items-center shadow-[0_2px_10px_rgba(0,0,0,0.05)]">
        <div className="flex gap-2 flex-wrap flex-1">
          {visibleTypes.map((t) => (
            <button
              key={t.key}
              onClick={() => changeType(t.key)}
              className={`px-4 py-2 rounded-lg font-semibold text-sm cursor-pointer border-none transition-all font-cairo
                ${userType === t.key ? "bg-mainColor text-white" : "bg-[rgba(42,56,91,0.08)] text-mainColor"}`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="relative min-w-[220px]">
          <FontAwesomeIcon
            icon={faSearch}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[rgba(42,56,91,0.3)]"
          />
          <input
            ref={searchRef}
            value={search}
            onChange={(e) => changeSearch(e.target.value)}
            placeholder="بحث باسم ..."
            className="w-full py-2 pr-9 pl-3 rounded-lg border-[1.5px] border-[rgba(42,56,91,0.08)] font-cairo text-sm text-mainColor bg-[#F4F6FA] outline-none box-border"
          />
          {search && (
            <button
              onClick={() => changeSearch("")}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 bg-transparent border-none cursor-pointer text-[rgba(42,56,91,0.3)]"
            >
              <FontAwesomeIcon icon={faTimes} />
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.05)] overflow-x-auto overflow-y-visible [-webkit-overflow-scrolling:touch]">
        {loading ? (
          <div className="flex justify-center items-center h-[260px]">
            <FontAwesomeIcon icon={faSpinner} spin className="text-3xl text-mainColor" />
          </div>
        ) : accounts.length === 0 ? (
          <div className="text-center py-16 text-[rgba(42,56,91,0.3)] text-base">لا توجد نتائج</div>
        ) : (
          <table className="w-full min-w-[700px] border-collapse">
            <thead>
              <tr className="bg-[#F4F6FA] border-b-2 border-[rgba(42,56,91,0.08)]">
                {["المستخدم", "البريد", "النوع", "الحالة", "الصلاحيات", "الإجراءات"].map((h) => (
                  <th key={h} className="py-3.5 px-5 text-right text-xs font-bold text-[rgba(42,56,91,0.3)] tracking-wide">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {accounts.map((acc, i) => (
                <AccountRow
                  key={acc.id}
                  acc={acc}
                  isLast={i === accounts.length - 1}
                  togglingId={togglingId}
                  popup={popup}
                  setPopup={setPopup}
                  onToggle={handleToggle}
                  onDeleteClick={() => { setDeleteTarget(acc); setPopup(null); }}
                  onPermClick={() => { setPermTarget(acc); setPopup(null); }}
                />
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-6">
          <PagBtn disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            <FontAwesomeIcon icon={faChevronRight} />
          </PagBtn>

          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
            .reduce((acc, p, idx, arr) => {
              if (idx > 0 && p - arr[idx - 1] > 1) acc.push("…");
              acc.push(p);
              return acc;
            }, [])
            .map((p, i) =>
              p === "…" ? (
                <span key={`d${i}`} className="text-[rgba(42,56,91,0.3)] px-1">…</span>
              ) : (
                <PagBtn key={p} active={p === page} onClick={() => setPage(p)}>{p}</PagBtn>
              ),
            )}

          <PagBtn disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
            <FontAwesomeIcon icon={faChevronLeft} />
          </PagBtn>
        </div>
      )}

      {/* Delete Modal */}
      {deleteTarget && (
        <div
          onClick={(e) => { if (e.target === e.currentTarget) setDeleteTarget(null); }}
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-[1000] p-4"
        >
          <div  className="bg-white rounded-2xl p-6 w-full max-w-[400px] shadow-[0_20px_60px_rgba(0,0,0,0.2)] font-cairo box-border overflow-x-hidden text-center">
            <div className="w-[60px] h-[60px] rounded-full bg-[rgba(239,68,68,0.1)] flex items-center justify-center mx-auto mb-4">
              <FontAwesomeIcon icon={faTrash} className="text-red-500 text-2xl" />
            </div>
            <h3 className="m-0 mb-2 text-mainColor text-lg">تأكيد الحذف</h3>
            <p className="m-0 mb-6 text-[rgba(42,56,91,0.3)] text-sm">
              هل أنت متأكد من حذف حساب{" "}
              <strong className="text-mainColor">{deleteTarget.userName}</strong>؟
            </p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => setDeleteTarget(null)} className={btnClass("light")}>إلغاء</button>
              <button onClick={handleDelete} className={btnClass("red")}>حذف</button>
            </div>
          </div>
        </div>
      )}

      {/* Permissions Modal */}
      {permTarget && (
        <PermissionsModal
          acc={permTarget}
          onClose={() => { setPermTarget(null); fetchAccounts(); }}
        />
      )}
    </div>
  );
}

function PagBtn({ children, active, disabled, onClick }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-9 h-9 rounded-lg border-none font-cairo font-bold text-sm transition-all
        ${active ? "bg-mainColor text-white shadow-[0_4px_12px_rgba(42,56,91,0.3)]" : "bg-white text-mainColor shadow-[0_1px_4px_rgba(0,0,0,0.08)]"}
        ${disabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}`}
    >
      {children}
    </button>
  );
}