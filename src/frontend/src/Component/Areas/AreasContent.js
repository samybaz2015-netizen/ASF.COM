import axios from "axios";
import React, { useEffect, useState } from "react";
import { FaEdit, FaTrash } from "react-icons/fa";
import Swal from "sweetalert2";
import { Url } from "../../function/FunctionApi";

function AreasContent() {
  const [consultants, setConsultants] = useState([]);
  const [name, setName] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [offices, setOffices] = useState([]);
  const [selectedOffice, setSelectedOffice] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const fetchData = async () => {
    try {
      const response = await axios.get(`${Url}Neighborhood`);
      setConsultants(response.data.data);
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "خطأ",
        text: "فشل تحميل البيانات. حاول مرة أخرى.",
      });
    }
  };

  const fetchOffices = async () => {
    try {
      const response = await axios.get(`${Url}Office`);
      setOffices(response.data.data);
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "خطأ",
        text: "فشل تحميل البيانات المتعلقة بالمكاتب. حاول مرة أخرى.",
      });
    }
  };

  useEffect(() => {
    fetchData();
    fetchOffices(); // Fetch offices on component mount
  }, []);

  const handleAddOrUpdate = async (name, officeId, id = null) => {
    try {
      let response;
      if (id) {
        // Update area with officeId
        response = await axios.put(`${Url}Neighborhood/${id}`, {
          name,
          officeId,
        });
        setConsultants(
          consultants.map((consultant) =>
            consultant.id === id
              ? { ...consultant, name, officeId }
              : consultant
          )
        );
        Swal.fire({
          icon: "success",
          title: "تم التحديث",
          text: "تم تحديث الاستشاري بنجاح.",
        });
      } else {
        // Add new area with officeId
        response = await axios.post(`${Url}Neighborhood`, { name, officeId });
        setConsultants([
          ...consultants,
          { id: response.data.id, name, officeId },
        ]);
        Swal.fire({
          icon: "success",
          title: "تم الإضافة",
          text: "تم إضافة المنطقه بنجاح.",
        });
        fetchData();
      }
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "خطأ",
        text: `فشل ${id ? "تحديث" : "إضافة"} المنطقه. حاول مرة أخرى.`,
      });
    }
    setName("");
    setSelectedOffice(null);
    setEditingId(null);
  };
  const handleSearch = (event) => {
    setSearchTerm(event.target.value);
  };

  const filteredConsultants = consultants.filter((consultant) =>
    consultant.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEdit = (id) => {
    setEditingId(id);
    const consultant = consultants.find((c) => c.id === id);
    setName(consultant.name);
    setSelectedOffice(consultant.officeId); // Set the selected office
    Swal.fire({
      title: "تحديث المنطقه",
      html: `
        <input type="text" id="name" class="swal2-input" value="${
          consultant.name
        }" placeholder="اسم المنطقه">
        <select id="office" class="swal2-input w-[70%] mx-auto text-white p-2 my-3 bg-gray-600 text-center">
          ${offices
            .map(
              (office) => `
            <option class ='w-full text-white bg-gray-400 rounded p-2' value="${
              office.id
            }" ${consultant.officeId === office.id ? "selected" : ""}>
              ${office.name}
            </option>
          `
            )
            .join("")}
        </select>
      `,
      showCancelButton: true,
      confirmButtonText: "تحديث",
      cancelButtonText: "إلغاء",
      preConfirm: () => {
        const newName = document.getElementById("name").value;
        const newOfficeId = document.getElementById("office").value;
        if (newName) {
          handleAddOrUpdate(newName, newOfficeId, id);
        } else {
          Swal.showValidationMessage("الاسم مطلوب");
        }
      },
    });
  };

  const handleDelete = (id) => {
    Swal.fire({
      title: "تأكيد الحذف",
      text: "هل أنت متأكد أنك تريد حذف هذا المنطقه لا يمكن التراجع عن هذا الإجراء.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "حذف",
      cancelButtonText: "إلغاء",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await axios.delete(`${Url}Neighborhood/${id}`);
          setConsultants(
            consultants.filter((consultant) => consultant.id !== id)
          );
          Swal.fire({
            icon: "success",
            title: "تم الحذف",
            text: "تم حذف المنطقه بنجاح.",
          });
        } catch (error) {
          Swal.fire({
            icon: "error",
            title: "خطأ",
            text: "فشل حذف الاستشاري. حاول مرة أخرى.",
          });
        }
      }
    });
  };

  return (
    <div className="p-6  min-h-screen">
      <div className=" w-[95%] mx-auto bg-white shadow-sm rounded-lg p-8">
        <div className="mb-6 p-4 mx-auto flex items-center justify-between">
          <h4 className="text-center text-green-700 font-bold mb-6">
            إدارة المناطق
          </h4>
          <div className="mb-6 p-4 mx-auto flex items-center justify-between">
            <input
              type="text"
              placeholder="ابحث عن الحي"
              value={searchTerm}
              onChange={handleSearch}
              className="border p-2 focus:outline-none  rounded-md"
            />
          </div>
          <button
            onClick={() => {
              Swal.fire({
                title: "إضافة الحي",
                html: `
                  <input type="text" id="name" class="swal2-input" placeholder="اسم الحي">
                  <select id="office" class="swal2-input w-[70%] mx-auto my-2 bg-slate-400">
                    ${offices
                      .map(
                        (office) => `
                      <option value="${office.id}">${office.name}</option>
                    `
                      )
                      .join("")}
                  </select>
                `,
                showCancelButton: true,
                confirmButtonText: "إضافة",
                cancelButtonText: "إلغاء",
                preConfirm: () => {
                  const newName = document.getElementById("name").value;
                  const officeId = document.getElementById("office").value;
                  if (newName) {
                    handleAddOrUpdate(newName, officeId);
                  } else {
                    Swal.showValidationMessage("الاسم مطلوب");
                  }
                },
              });
            }}
            className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition duration-300"
          >
            إضافة حي
          </button>
        </div>
        <div className="p-3">
          {filteredConsultants.length > 0 ? (
            <ul className="divide-gray-300">
              {filteredConsultants.map((consultant) => (
                <li
                  key={consultant.id}
                  className="flex justify-between items-center p-1 px-4 bg-gray-50 rounded-lg shadow-md mb-2 hover:bg-gray-100 transition duration-300"
                >
                  <div>
                    <h6 className="font-medium text-gray-900 text-xl">
                      {consultant.name}
                    </h6>
                    <p>
                      {offices.find((o) => o.id === consultant.officeId)?.name}
                    </p>
                  </div>
                  <div className="flex gap-4">
                    <button
                      onClick={() => handleEdit(consultant.id)}
                      className="!bg-blue-500 text-white rounded-full px-2 py-2 hover:bg-blue-600 transition duration-300"
                    >
                      <FaEdit className="" />
                    </button>
                    <button
                      onClick={() => handleDelete(consultant.id)}
                      className="bg-red-500 rounded-full text-white p-2 hover:bg-red-600 transition duration-300"
                    >
                      <FaTrash />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-center text-gray-500">
              لم يتم إضافة أي منطقه بعد.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default AreasContent;
