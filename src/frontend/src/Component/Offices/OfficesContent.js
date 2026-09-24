import axios from "axios";
import React, { useEffect, useState } from "react";
import { FaEdit, FaTrash } from "react-icons/fa";
import Swal from "sweetalert2";
import { Url } from "../../function/FunctionApi";

function OfficesContent() {
  const [offices, setOffices] = useState([]);
  const [branches, setBranches] = useState([]);
  const [name, setName] = useState("");
  const [branchId, setBranchId] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const fetchData = async () => {
    try {
      const officesResponse = await axios.get(`${Url}Office`);
      const branchesResponse = await axios.get(`${Url}Branch`);
      setOffices(officesResponse.data.data);
      setBranches(branchesResponse.data.data);
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

  const handleAddOrUpdate = async (officeName, selectedBranchId, id = null) => {
    try {
      let response;
      if (id) {
        response = await axios.put(`${Url}Office/${id}`, {
          name: officeName,
          branchId: selectedBranchId,
        });
        setOffices(
          offices.map((office) =>
            office.id === id
              ? { ...office, name: officeName, branchId: selectedBranchId }
              : office
          )
        );
        Swal.fire({
          icon: "success",
          title: "تم التحديث",
          text: "تم تحديث المكتب بنجاح.",
        });
      } else {
        response = await axios.post(`${Url}Office`, {
          name: officeName,
          branchId: selectedBranchId,
        });
        setOffices([
          ...offices,
          {
            id: response.data.id,
            name: officeName,
            branchId: selectedBranchId,
          },
        ]);
        Swal.fire({
          icon: "success",
          title: "تم الإضافة",
          text: "تم إضافة المكتب بنجاح.",
        });
        fetchData();
      }
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "خطأ",
        text: `فشل ${id ? "تحديث" : "إضافة"} المكتب. حاول مرة أخرى.`,
      });
    }
    setName("");
    setBranchId("");
  };

  const handleEdit = (id) => {
    const office = offices.find((o) => o.id === id);
    setName(office.name);
    setBranchId(office.branchId);

    Swal.fire({
      title: "تحديث المكتب",
      html: `<input id='office-name' class='swal2-input' placeholder='اسم المكتب' value='${
        office.name
      }' />
             <select id='branch-select' class='swal2-input'>
               ${branches
                 .map(
                   (branch) =>
                     `<option value='${branch.id}' ${
                       branch.id === office.branchId ? "selected" : ""
                     }>${branch.name}</option>`
                 )
                 .join("")}
             </select>`,
      showCancelButton: true,
      confirmButtonText: "تحديث",
      cancelButtonText: "إلغاء",
      preConfirm: () => {
        const updatedName = document.getElementById("office-name").value;
        const updatedBranchId = document.getElementById("branch-select").value;
        if (updatedName && updatedBranchId) {
          handleAddOrUpdate(updatedName, updatedBranchId, id);
        } else {
          Swal.showValidationMessage("جميع الحقول مطلوبة");
        }
      },
    });
  };

  const handleDelete = (id) => {
    Swal.fire({
      title: "تأكيد الحذف",
      text: "هل أنت متأكد أنك تريد حذف هذا المكتب؟ لا يمكن التراجع عن هذا الإجراء.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "حذف",
      cancelButtonText: "إلغاء",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await axios.delete(`${Url}Office/${id}`);
          setOffices(offices.filter((office) => office.id !== id));
          Swal.fire({
            icon: "success",
            title: "تم الحذف",
            text: "تم حذف المكتب بنجاح.",
          });
        } catch (error) {
          Swal.fire({
            icon: "error",
            title: "خطأ",
            text: "فشل حذف المكتب. حاول مرة أخرى.",
          });
        }
      }
    });
  };

  const filteredOffices = offices.filter((office) =>
    office.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 min-h-screen">
      <div className="w-[95%] mx-auto bg-white shadow-sm rounded-lg p-8">
        <div className="mb-6 p-4 mx-auto flex items-center justify-between">
          <h4 className="text-center text-green-700 font-bold mb-6">
            إدارة المكاتب
          </h4>
          <input
            type="text"
            placeholder="بحث عن مكتب..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="border border-gray-300 rounded-lg px-4 py-2"
          />

          <button
            onClick={() => {
              Swal.fire({
                title: "إضافة مكتب",
                html: `<input id='office-name' class='swal2-input' placeholder='اسم المكتب' />
                       <select id='branch-select' class='swal2-input'>
                         <option value='' disabled selected>اختر فرع</option>
                         ${branches
                           .map(
                             (branch) =>
                               `<option value='${branch.id}'>${branch.name}</option>`
                           )
                           .join("")}
                       </select>`,
                showCancelButton: true,
                confirmButtonText: "إضافة",
                cancelButtonText: "إلغاء",
                preConfirm: () => {
                  const newName = document.getElementById("office-name").value;
                  const newBranchId =
                    document.getElementById("branch-select").value;
                  if (newName && newBranchId) {
                    handleAddOrUpdate(newName, newBranchId);
                  } else {
                    Swal.showValidationMessage("جميع الحقول مطلوبة");
                  }
                },
              });
            }}
            className="!bg-secondaryColor text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition duration-300"
          >
            إضافة مكتب
          </button>
        </div>
        <div className="p-3">
          {filteredOffices.length > 0 ? (
            <ul className="divide-gray-300">
              {filteredOffices.map((office) => (
                <li
                  key={office.id}
                  className="flex justify-between items-center p-1 px-4 bg-gray-50 rounded-lg shadow-md mb-2 hover:bg-gray-100 transition duration-300"
                >
                  <div>
                    <h6 className="font-medium text-gray-900 text-xl">
                      {office.name}
                    </h6>
                    <p className="text-sm text-gray-500">
                      {branches.find((branch) => branch.id === office.branchId)
                        ?.name || "فرع غير معروف"}
                    </p>
                  </div>
                  <div className="flex gap-4">
                    <button
                      onClick={() => handleEdit(office.id)}
                      className="!bg-blue-500 text-white rounded-full px-2 py-2 hover:bg-blue-600 transition duration-300"
                    >
                      <FaEdit />
                    </button>
                    <button
                      onClick={() => handleDelete(office.id)}
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
              لم يتم إضافة أي مكتب بعد.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default OfficesContent;
