import React, { useEffect, useReducer, useState } from "react";
import apiClient from "../../api/apiClient";
import Swal from "sweetalert2";
import { FaCheck, FaTimes, FaSearch } from "react-icons/fa";
import LeaveEmployees from "./LeaveEmployees";
import axiosInstance from "../../api/apiClient";

const API_URL = "leaverequests"; 

const BRANCHES = [
  { value: "", label: "كل الفروع" },
  { value: "2", label: "الرياض" },
  { value: "1", label: "جدة" },
];

const initialState = { requests: [] };

function leaveReducer(state, action) {
  switch (action.type) {
    case "SET_REQUESTS":
      return { requests: action.payload };
    case "UPDATE_STATUS":
      return {
        requests: state.requests.map((req) =>
          req.id === action.payload.id
            ? { ...req, status: action.payload.status }
            : req
        ),
      };
    default:
      return state;
  }
}

function LeaveRequests() {
  const [state, dispatch] = useReducer(leaveReducer, initialState);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBranch, setSelectedBranch] = useState("");

  useEffect(() => {
    axiosInstance
      .get(`${API_URL}/all`)
      .then((response) => {
        if (response.data.statusCode === 200) {
          dispatch({ type: "SET_REQUESTS", payload: response.data.data });
        }
      })
      .catch((error) => console.error("Error fetching leave requests:", error));
  }, []);

  const updateRequestStatus = (id, status) => {
    if (status === "Rejected") {
      Swal.fire({
        title: "رفض الإجازة",
        text: "يرجى إدخال سبب الرفض",
        input: "textarea",
        inputPlaceholder: "اكتب سبب الرفض هنا...",
        inputAttributes: { "aria-label": "اكتب سبب الرفض هنا" },
        showCancelButton: true,
        confirmButtonText: "رفض",
        cancelButtonText: "إلغاء",
        inputValidator: (value) => {
          if (!value) return "يجب إدخال سبب الرفض!";
        },
      }).then((result) => {
        if (result.isConfirmed) {
          axiosInstance
            .put(`${API_URL}/update-status/${id}?status=${status}`, {
              reason: result.value,
            })
            .then(() => {
              dispatch({ type: "UPDATE_STATUS", payload: { id, status } });
              Swal.fire("تم الرفض!", "تم رفض طلب الإجازة بنجاح.", "success");
            })
            .catch(() =>
              Swal.fire("خطأ", "فشل في تحديث طلب الإجازة.", "error")
            );
        }
      });
    } else {
      Swal.fire({
        title: "قبول الإجازة",
        text: "هل أنت متأكد من قبول هذه الإجازة؟",
        icon: "success",
        showCancelButton: true,
        confirmButtonText: "نعم، قبول",
        cancelButtonText: "إلغاء",
      }).then((result) => {
        if (result.isConfirmed) {
          apiClient
            .put(`${API_URL}/update-status/${id}?status=${status}`, null)
            .then(() => {
              dispatch({ type: "UPDATE_STATUS", payload: { id, status } });
              Swal.fire("تم القبول!", "تم قبول طلب الإجازة بنجاح.", "success");
            })
            .catch(() =>
              Swal.fire("خطأ", "فشل في تحديث طلب الإجازة.", "error")
            );
        }
      });
    }
  };

  return (
    <div
      style={{
        marginTop: "8rem",
        width: "100%",
        minWidth: 0,
        overflow: "hidden",
      }}
    >
      <LeaveEmployees
        selectedBranch={selectedBranch}
        onBranchChange={setSelectedBranch}
        branches={BRANCHES}
      />
    </div>
  );
}

export default LeaveRequests;