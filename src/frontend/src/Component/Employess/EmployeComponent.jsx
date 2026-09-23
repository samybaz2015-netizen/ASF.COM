import React, { useReducer, useState, useEffect } from "react";
import axios from "../../api/apiClient";
import EmployeeForm from "./EmployeeForm";
import EmployeeList from "./EmployeeList";
import SearchBar from "./SearchBar";
import { FaPlus, FaUsers, FaFileExcel } from "react-icons/fa";
import Swal from "sweetalert2";
import useExportEmployees from "../../hooks/useExportEmployees";

const API_URL = "/Employees";

// Initial state
const initialState = { employees: [] };

// Reducer function
function employeeReducer(state, action) {
  switch (action.type) {
    case "SET_EMPLOYEES":
      return { employees: action.payload };
    case "ADD_EMPLOYEE":
      return { employees: [...state.employees, action.payload] };
    case "DELETE_EMPLOYEE":
      return {
        employees: state.employees.filter((emp) => emp.id !== action.payload),
      };
    case "UPDATE_EMPLOYEE":
      return {
        employees: state.employees.map((emp) =>
          emp.id === action.payload.id ? action.payload : emp
        ),
      };
    default:
      return state;
  }
}

function WorkersComponents() {
  const [state, dispatch] = useReducer(employeeReducer, initialState);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    nationalId: "",
    city: "",
    phone: "",
    email: "",
    salary: "",
    graduationDate: "",
    employmentDate: "",
    workersProfession: "",
    cvImage: null,
    residencePhoto: null,
    licensePhoto: null,
    userImage: null,
  });
  const [loading, setLoading] = useState({
    get: false,
    create: false,
    update: false,
    delete: false,
    updateId: null,
    deleteId: null,
  });
  const { exportToExcel } = useExportEmployees();

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      setLoading((prev) => ({ ...prev, get: true }));
      const response = await axios.get(`${API_URL}`);
      if (response.data.statusCode === 200) {
        dispatch({ type: "SET_EMPLOYEES", payload: response.data.data });
      } else {
        Swal.fire({
          title: "خطأ",
          text: response.data.message || "فشل في جلب بيانات الموظفين",
          icon: "error",
          confirmButtonText: "حسناً",
          confirmButtonColor: "#3085d6",
        });
      }
    } catch (error) {
      Swal.fire({
        title: "خطأ",
        text: "حدث خطأ أثناء جلب بيانات الموظفين",
        icon: "error",
        confirmButtonText: "حسناً",
        confirmButtonColor: "#3085d6",
      });
    } finally {
      setLoading((prev) => ({ ...prev, get: false }));
    }
  };

  const handleInputChange = (e) => {
    const { name, value, files } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: files ? files[0] : value,
    }));
  };

  const handleSubmit = async (e) => {
    console.log("Parent handleSubmit called");
    e.preventDefault();
    const formDataToSend = new FormData();

    // Add text fields
    formDataToSend.append("Name", formData.name);
    formDataToSend.append("NationalId", formData.nationalId);
    formDataToSend.append("City", formData.city);
    formDataToSend.append("Phone", formData.phone);
    formDataToSend.append("Email", formData.email);
    formDataToSend.append("Salary", formData.salary);
    formDataToSend.append("WorkersProfession", formData.workersProfession);

    // Add date fields with proper format
    if (formData.graduationDate) {
      formDataToSend.append(
        "GraduationDate",
        new Date(formData.graduationDate).toISOString()
      );
    }
    if (formData.employmentDate) {
      formDataToSend.append(
        "EmploymentDate",
        new Date(formData.employmentDate).toISOString()
      );
    }

    // Add binary files
    if (formData.cvImage) {
      formDataToSend.append("CvImage", formData.cvImage);
    }
    if (formData.residencePhoto) {
      formDataToSend.append("ResidencePhoto", formData.residencePhoto);
    }
    if (formData.licensePhoto) {
      formDataToSend.append("LicensePhoto", formData.licensePhoto);
    }
    if (formData.userImage) {
      formDataToSend.append("UserImage", formData.userImage);
    }

    try {
      setLoading((prev) => ({
        ...prev,
        [selectedEmployee ? "update" : "create"]: true,
      }));
      const url = selectedEmployee
        ? `${API_URL}/${selectedEmployee.id}`
        : `${API_URL}`;
      const method = selectedEmployee ? "put" : "post";

      const response = await axios[method](url, formDataToSend, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (response.data.statusCode === 200) {
        Swal.fire({
          title: "نجاح",
          text: selectedEmployee
            ? "تم تحديث بيانات الموظف بنجاح"
            : "تم إضافة الموظف بنجاح",
          icon: "success",
          confirmButtonText: "حسناً",
          confirmButtonColor: "#3085d6",
        });
        setShowModal(false);
        resetForm();
        fetchEmployees();
      } else {
        Swal.fire({
          title: "خطأ",
          text:
            response.data.message ||
            (selectedEmployee
              ? "فشل في تحديث بيانات الموظف"
              : "فشل في إضافة الموظف"),
          icon: "error",
          confirmButtonText: "حسناً",
          confirmButtonColor: "#3085d6",
        });
      }
    } catch (error) {
      Swal.fire({
        title: "خطأ",
        text: selectedEmployee
          ? "حدث خطأ أثناء تحديث بيانات الموظف"
          : "حدث خطأ أثناء إضافة الموظف",
        icon: "error",
        confirmButtonText: "حسناً",
        confirmButtonColor: "#3085d6",
      });
    } finally {
      setLoading((prev) => ({
        ...prev,
        [selectedEmployee ? "update" : "create"]: false,
      }));
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      nationalId: "",
      city: "",
      phone: "",
      email: "",
      salary: "",
      graduationDate: "",
      employmentDate: "",
      workersProfession: "",
      cvImage: null,
      residencePhoto: null,
      licensePhoto: null,
      userImage: null,
    });
    setSelectedEmployee(null);
  };

  const handleEdit = (employee) => {
    setSelectedEmployee(employee);
    setFormData({
      name: employee.name,
      nationalId: employee.nationalId,
      city: employee.city,
      phone: employee.phone,
      email: employee.email,
      salary: employee.salary,
      graduationDate: employee.graduationDate?.split("T")[0],
      employmentDate: employee.employmentDate?.split("T")[0],
      workersProfession: employee.workersProfession || "",
      cvImage: null,
      residencePhoto: null,
      licensePhoto: null,
      userImage: null,
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: "هل أنت متأكد؟",
      text: "لن تتمكن من استعادة هذا الموظف!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "نعم، احذف",
      cancelButtonText: "إلغاء",
    });

    if (result.isConfirmed) {
      try {
        setLoading((prev) => ({ ...prev, delete: true, deleteId: id }));
        const response = await axios.delete(`${API_URL}/${id}`);
        Swal.fire({
          title: "تم الحذف!",
          text: "تم حذف الموظف بنجاح",
          icon: "success",
          confirmButtonText: "حسناً",
          confirmButtonColor: "#3085d6",
        });
        dispatch({ type: "DELETE_EMPLOYEE", payload: id });
        fetchEmployees();
      } catch (error) {
        Swal.fire({
          title: "خطأ",
          text: "حدث خطأ أثناء حذف الموظف",
          icon: "error",
          confirmButtonText: "حسناً",
          confirmButtonColor: "#3085d6",
        });
      } finally {
        setLoading((prev) => ({ ...prev, delete: false, deleteId: null }));
      }
    }
  };

  return (
   <div className="w-full px-4 py-8">
  <div className="flex flex-col items-start gap-6 mb-6">
    <h1 className="text-2xl font-bold text-gray-800">إدارة الموظفين</h1>
    <div className="flex items-center gap-4">
      <button
        onClick={() => exportToExcel(state.employees)}
        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
      >
        <FaFileExcel className="text-lg" />
        <span>تصدير إلى Excel</span>
      </button>
      <button
        onClick={() => {
          setSelectedEmployee(null);
          resetForm();
          setShowModal(true);
        }}
        className="px-4 py-2 bg-mainColor text-white rounded-lg hover:bg-mainColor/90 transition-colors"
      >
        إضافة موظف جديد
      </button>
    </div>
  </div>

  <SearchBar searchTerm={searchTerm} onSearchChange={setSearchTerm} />

  <EmployeeList
    employees={state.employees.filter((emp) =>
      emp.name.toLowerCase().includes(searchTerm.toLowerCase())
    )}
    onEdit={handleEdit}
    onDelete={handleDelete}
    loading={loading}
  />

  {showModal && (
    <EmployeeForm
      formData={formData}
      onInputChange={handleInputChange}
      handleSubmit={handleSubmit}
      onClose={() => {
        setShowModal(false);
        resetForm();
      }}
      loading={loading}
      selectedEmployee={selectedEmployee}
    />
  )}
</div>
  );
}

export default WorkersComponents;
