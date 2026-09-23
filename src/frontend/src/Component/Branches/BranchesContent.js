import axios from "axios";
import React, { useEffect, useState } from "react";
import { FaEdit, FaTrash } from "react-icons/fa";
import Swal from "sweetalert2";
import { Url } from "../../function/FunctionApi";

function BranchesContent() {
  const [branches, setBranches] = useState([]);
  const [name, setName] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchData = async () => {
    try {
      const response = await axios.get(`${Url}Branch`);
      setBranches(response.data.data);
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

  const handleAddOrUpdate = async (name, id = null) => {
    try {
      let response;
      if (id) {
        response = await axios.put(`${Url}Branch/${id}`, { name });
        setBranches(
          branches.map((branch) =>
            branch.id === id ? { ...branch, name } : branch
          )
        );
        Swal.fire({
          icon: "success",
          title: "تم التحديث",
          text: "تم تحديث الفرع بنجاح.",
        });
      } else {
        response = await axios.post(`${Url}Branch`, { name });
        setBranches([...branches, { id: response.data.id, name }]);
        Swal.fire({
          icon: "success",
          title: "تم الإضافة",
          text: "تم إضافة الفرع بنجاح.",
        });

        fetchData();
      }
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "خطأ",
        text: `فشل ${id ? "تحديث" : "إضافة"} الفرع. حاول مرة أخرى.`,
      });
    }
    setName("");
    setEditingId(null);
  };

  const handleEdit = (id) => {
    setEditingId(id);
    const branch = branches.find((b) => b.id === id);
    setName(branch.name);
    Swal.fire({
      title: "تحديث الفرع",
      input: "text",
      inputValue: branch.name,
      showCancelButton: true,
      confirmButtonText: "تحديث",
      cancelButtonText: "إلغاء",
      preConfirm: (newName) => {
        if (newName) {
          handleAddOrUpdate(newName, id);
        } else {
          Swal.showValidationMessage("الاسم مطلوب");
        }
      },
    });
  };

  const handleDelete = (id) => {
    Swal.fire({
      title: "تأكيد الحذف",
      text: "هل أنت متأكد أنك تريد حذف هذا الفرع؟ لا يمكن التراجع عن هذا الإجراء.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "حذف",
      cancelButtonText: "إلغاء",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await axios.delete(`${Url}Branch/${id}`);
          setBranches(branches.filter((branch) => branch.id !== id));
          Swal.fire({
            icon: "success",
            title: "تم الحذف",
            text: "تم حذف الفرع بنجاح.",
          });
        } catch (error) {
          Swal.fire({
            icon: "error",
            title: "خطأ",
            text: "فشل حذف الفرع. حاول مرة أخرى.",
          });
        }
      }
    });
  };

  const filteredBranches = branches.filter((branch) =>
    branch.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 min-h-screen">
      <div className="w-[95%] mx-auto bg-white shadow-sm rounded-lg p-8">
        <div className="mb-6 p-4 mx-auto flex items-center justify-between">
          <h4 className="text-center text-green-700 font-bold mb-6">
            إدارة الفروع
          </h4>
          <input
            type="text"
            placeholder="ابحث عن فرع"
            className="border p-2 rounded-lg w-1/3"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button
            onClick={() => {
              Swal.fire({
                title: "إضافة فرع",
                input: "text",
                inputPlaceholder: "اسم الفرع",
                showCancelButton: true,
                confirmButtonText: "إضافة",
                cancelButtonText: "إلغاء",
                preConfirm: (newName) => {
                  if (newName) {
                    handleAddOrUpdate(newName);
                  } else {
                    Swal.showValidationMessage("الاسم مطلوب");
                  }
                },
              });
            }}
            className="!bg-secondaryColor text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition duration-300"
          >
            إضافة فرع
          </button>
        </div>
        <div className="p-3">
          {filteredBranches.length > 0 ? (
            <ul className="divide-gray-300">
              {filteredBranches.map((branch) => (
                <li
                  key={branch.id}
                  className="flex justify-between items-center p-1 px-4 bg-gray-50 rounded-lg shadow-md mb-2 hover:bg-gray-100 transition duration-300"
                >
                  <div>
                    <h6 className="font-medium text-gray-900 text-xl">
                      {branch.name}
                    </h6>
                  </div>
                  <div className="flex gap-4">
                    {/* <button
                      onClick={() => handleEdit(branch.id)}
                      className="!bg-blue-500 text-white rounded-full px-2 py-2 hover:bg-blue-600 transition duration-300"
                    >
                      <FaEdit className="" />
                    </button> */}
                    {/* <button
                      onClick={() => handleDelete(branch.id)}
                      className="bg-red-500 rounded-full text-white p-2 hover:bg-red-600 transition duration-300"
                    >
                      <FaTrash />
                    </button> */}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-center text-gray-500">
              لم يتم إضافة أي فرع بعد.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default BranchesContent;
