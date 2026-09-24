import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { Url } from "../../function/FunctionApi";

const SelectWorkOrderType = ({ value, handleChange }) => {
  const [workOrderTypes, setWorkOrderTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchWorkOrderTypes = async () => {
      try {
        const response = await axios.get(`${Url}WorkOrderType`);
        if (response.status === 200 && response.data.data) {
          setWorkOrderTypes(response.data.data);
        }
      } catch (error) {
        console.error("Error fetching work order types:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchWorkOrderTypes();
  }, []);

  // Filter options based on searchTerm
  const filteredWorkOrderTypes = useMemo(() => {
    return workOrderTypes.filter((type) =>
      type.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, workOrderTypes]);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex relative flex-col items-start w-full lg:w-[48%]">
      <label htmlFor="workOrderType" className="font-medium text-gray-700">
        نوع أمر العمل
      </label>

      {/* Search Input */}
      <input
        type="text"
        placeholder="بحث عن نوع أمر العمل..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-32   md:w-48 p-2 top-[35px]  bg-slate-700 text-white placeholder:!text-white z-50 left-0 absolute border  rounded-md focus:outline-none"
      />

      {/* Dropdown */}
      <select
        id="WorkOrderType"
        name="WorkOrderType"
        value={value}
        onChange={handleChange}
        required
        className="w-full p-3 mt-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-900 text-sm focus:ring-blue-500 focus:border-blue-500"
      >
        <option value="" disabled>
          اختر نوع أمر العمل
        </option>
        {filteredWorkOrderTypes.length > 0 ? (
          filteredWorkOrderTypes.map((type) => (
            <option key={type.id} value={type.name}>
              {type.name}
            </option>
          ))
        ) : (
          <option disabled>لا توجد نتائج مطابقة</option>
        )}
      </select>
    </div>
  );
};

export default SelectWorkOrderType;
