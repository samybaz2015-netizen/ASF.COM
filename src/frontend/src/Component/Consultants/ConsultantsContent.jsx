import axios from "axios";
import React, { useEffect, useState } from "react";
import { FaEdit, FaTrash } from "react-icons/fa";
import Swal from "sweetalert2";
import { Url } from "../../function/FunctionApi";

function ConsultantsContent() {
  const [consultants, setConsultants] = useState([]);
  const [name, setName] = useState("");
  const [editingId, setEditingId] = useState(null);

  const fetchData = async () => {
    try {
      const response = await axios.get(`${Url}Consultants`);
      setConsultants(response.data.data);
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

  // Handle adding or updating a consultant
  const handleAddOrUpdate = async (name, id = null) => {
    try {
      let response;
      if (id) {
        // Update existing consultant
        response = await axios.put(`${Url}Consultants/${id}`, { name });
        setConsultants(
          consultants.map((consultant) =>
            consultant.id === id ? { ...consultant, name } : consultant
          )
        );
        Swal.fire({
          icon: "success",
          title: "تم التحديث",
          text: "تم تحديث الاستشاري بنجاح.",
        });
      } else {
        response = await axios.post(`${Url}Consultants`, { name });
        setConsultants([...consultants, { id: response.data.id, name }]);
        Swal.fire({
          icon: "success",
          title: "تم الإضافة",
          text: "تم إضافة الاستشاري بنجاح.",
        });

        fetchData();
      }
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "خطأ",
        text: `فشل ${id ? "تحديث" : "إضافة"} الاستشاري. حاول مرة أخرى.`,
      });
    }
    setName(""); // Clear input after adding/updating
    setEditingId(null);
  };

  // Handle editing a consultant
  const handleEdit = (id) => {
    setEditingId(id);
    const consultant = consultants.find((c) => c.id === id);
    setName(consultant.name);
    Swal.fire({
      title: "تحديث الاستشاري",
      input: "text",
      inputValue: consultant.name,
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

  // Handle deleting a consultant
  const handleDelete = (id) => {
    Swal.fire({
      title: "تأكيد الحذف",
      text: "هل أنت متأكد أنك تريد حذف هذا الاستشاري؟ لا يمكن التراجع عن هذا الإجراء.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "حذف",
      cancelButtonText: "إلغاء",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await axios.delete(`${Url}Consultants/${id}`);
          setConsultants(
            consultants.filter((consultant) => consultant.id !== id)
          );
          Swal.fire({
            icon: "success",
            title: "تم الحذف",
            text: "تم حذف الاستشاري بنجاح.",
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
            إدارة الاستشاريين
          </h4>
          <button
            onClick={() => {
              Swal.fire({
                title: "إضافة استشاري",
                input: "text",
                inputPlaceholder: "اسم الاستشاري",
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
            إضافة استشاري
          </button>
        </div>
        <div className="p-3">
          {consultants.length > 0 ? (
            <ul className="divide-gray-300">
              {consultants.map((consultant) => (
                <li
                  key={consultant.id}
                  className="flex justify-between items-center p-1 px-4 bg-gray-50 rounded-lg shadow-md mb-2 hover:bg-gray-100 transition duration-300"
                >
                  <div>
                    <h6 className="font-medium text-gray-900 text-xl">
                      {consultant.name}
                    </h6>
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
              لم يتم إضافة أي استشاري بعد.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default ConsultantsContent;
