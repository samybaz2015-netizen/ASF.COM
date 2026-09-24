import React, { useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { Url } from "../../function/FunctionApi";
import axiosInstance from "../../api/apiClient";

const BranchSelect = ({ value, onChange }) => {
  const [branches, setBranches] = useState([]);

  const fetchData = async () => {
    try {
      const response = await axiosInstance.get(`/Branch`);
      setBranches(response.data.data); // Assuming the branch data is in `data.data`
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "خطأ",
        text: "فشل تحميل البيانات. حاول مرة أخرى.",
      });
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
   <div className="groub_fe">
      <label>الفرع</label>
      <select name="branch" value={value} onChange={onChange}>
        <option value="">اختر الفرع</option>
        {branches.map((branch) => (
          <option key={branch.id} value={branch.id}>
            {branch.name}
          </option>
        ))}
      </select>
    </div>
  );
};

export default BranchSelect;
