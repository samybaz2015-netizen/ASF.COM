import React, { useEffect, useReducer, useState } from "react";
import axios from "../../api/apiClient";
import Swal from "sweetalert2";
import { FaCheck, FaTimes, FaSearch } from "react-icons/fa";
import { getCookie } from "../../Pages/Login/Login";
import { Url } from "../../function/FunctionApi";
import LeaveEmployees from "./LeaveEmployees";
import EmployeeLeaveCalendar from "./EmployeeLeaveCalendar";

const API_URL = Url + "leaverequests";

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

function LeaveRequestss() {
  const [state, dispatch] = useReducer(leaveReducer, initialState);
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch Leave Requests
  useEffect(() => {
    axios
      .get(`${API_URL}/all`)
      .then((response) => {
        if (response.data.statusCode === 200) {
          dispatch({ type: "SET_REQUESTS", payload: response.data.data });
        }
      })
      .catch((error) => console.error("Error fetching leave requests:", error));
  }, []);
  const userCookie = getCookie("user");
  const token = JSON.parse(userCookie).token;

  const updateRequestStatus = (id, status) => {
    if (status === "Rejected") {
      Swal.fire({
        title: "رفض الإجازة",
        text: "يرجى إدخال سبب الرفض",
        input: 'textarea',
        inputPlaceholder: 'اكتب سبب الرفض هنا...',
        inputAttributes: {
          'aria-label': 'اكتب سبب الرفض هنا'
        },
        showCancelButton: true,
        confirmButtonText: 'رفض',
        cancelButtonText: 'إلغاء',
        inputValidator: (value) => {
          if (!value) {
            return 'يجب إدخال سبب الرفض!';
          }
        }
      }).then((result) => {
        if (result.isConfirmed) {
          axios
            .put(
              `${API_URL}/update-status/${id}?status=${status}`,
              { reason: result.value },
              {
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`,
                },
              }
            )
            .then(() => {
              dispatch({ type: "UPDATE_STATUS", payload: { id, status } });
              Swal.fire(
                "تم الرفض!",
                "تم رفض طلب الإجازة بنجاح.",
                "success"
              );
            })
            .catch((error) => {
              console.error("Error updating leave request:", error);
              Swal.fire("خطأ", "فشل في تحديث طلب الإجازة.", "error");
            });
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
          axios
            .put(
              `${API_URL}/update-status/${id}?status=${status}`,
              null,
              {
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`,
                },
              }
            )
            .then(() => {
              dispatch({ type: "UPDATE_STATUS", payload: { id, status } });
              Swal.fire(
                "تم القبول!",
                "تم قبول طلب الإجازة بنجاح.",
                "success"
              );
            })
            .catch((error) => {
              console.error("Error updating leave request:", error);
              Swal.fire("خطأ", "فشل في تحديث طلب الإجازة.", "error");
            });
        }
      });
    }
  };

  const filteredRequests = state.requests.filter((req) =>
    req.employeeName.toLowerCase().includes(searchTerm.toLowerCase())
  );

 const [selectedEmployee, setSelectedEmployee] = useState(null);

return (
  <div className="mt-32 max-w-7xl mx-auto p-6">

    {!selectedEmployee ? (
      <LeaveEmployees onSelect={setSelectedEmployee} />
    ) : (
      <EmployeeLeaveCalendar
        employee={selectedEmployee}
        onBack={() => setSelectedEmployee(null)}
      />
    )}

  </div>
);
}

export default LeaveRequestss;
