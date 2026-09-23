import React, { useEffect, useState } from "react";
import axios from "axios";
import { Url } from "../../function/FunctionApi";

const SelectDistrict = ({ value, onChange, officeName }) => {
  const [districts, setDistricts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredDistricts, setFilteredDistricts] = useState([]);

  useEffect(() => {
    if (!officeName) {
      setDistricts([]);
      return;
    }

    const fetchDistricts = async () => {
      try {
        setLoading(true);
        let response;
        if (officeName === "all") {
          response = await axios.get(`${Url}Neighborhood`);
        } else {
          response = await axios.get(
            `${Url}Office/GetByOffice?officeName=${officeName.trim()}`
          );
        }

        if (response.status === 200 && response.data.data) {
          setDistricts(response.data.data);
          setFilteredDistricts(response.data.data);
        } else {
          setDistricts([]);
          setFilteredDistricts([]);
        }
      } catch (error) {
        setDistricts([]);
        setFilteredDistricts([]);
        console.error("Error fetching districts:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDistricts();
  }, [officeName]);

  useEffect(() => {
    const newFiltered = districts.filter((district) =>
      district.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredDistricts(newFiltered);
    if (newFiltered.length === 1) {
      onChange({ target: { name: "District", value: newFiltered[0].name } });
    }
  }, [searchTerm, districts, onChange]);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex flex-col items-start w-full md:w-[48%] relative">
      <label className="text-gray-700 font-medium">الحي</label>
      <input
        type="text"
        placeholder="بحث عن الحي..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-32   md:w-48 p-2 top-[35px]  bg-slate-700 text-white placeholder:!text-white z-50 left-0 absolute border  rounded-md focus:outline-none"
      />
      <div className="relative w-full ">
        <select
          name="District"
          value={value || ""}
          onChange={onChange}
          required
          className="bg-gray-50 border  border-gray-300 text-gray-900 text-sm rounded-lg  w-full p-3"
        >
          <option value="" disabled>
            اختر الحي
          </option>
          {filteredDistricts.length > 0 ? (
            filteredDistricts.map((district) => (
              <option key={district.id} value={district.name}>
                {district.name}
              </option>
            ))
          ) : (
            <option disabled>لا توجد نتائج مطابقة</option>
          )}
        </select>
      </div>
    </div>
  );
};

export default SelectDistrict;
