import axios from "axios";
import React, { useEffect, useState } from "react";
import { FaEdit, FaTrash } from "react-icons/fa";
import Swal from "sweetalert2";
import { Url } from "../../function/FunctionApi";

function TaskTypeContent() {
  const [taskTypes, setTaskTypes] = useState([]);
  const [name, setName] = useState("");
  const [editingId, setEditingId] = useState(null);

  const fetchData = async () => {
    try {
      const response = await axios.get(`${Url}WorkOrderType`);
      setTaskTypes(response.data.data);
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

  // Handle adding or updating a task type
  const handleAddOrUpdate = async (name, id = null) => {
    try {
      let response;
      if (id) {
        // Update existing task type
        response = await axios.put(`${Url}WorkOrderType/${id}`, { name });
        setTaskTypes(
          taskTypes.map((taskType) =>
            taskType.id === id ? { ...taskType, name } : taskType
          )
        );
        Swal.fire({
          icon: "success",
          title: "تم التحديث",
          text: "تم تحديث نوع العمل بنجاح.",
        });
      } else {
        response = await axios.post(`${Url}WorkOrderType`, { name });
        setTaskTypes([...taskTypes, { id: response.data.id, name }]);
        Swal.fire({
          icon: "success",
          title: "تم الإضافة",
          text: "تم إضافة نوع العمل بنجاح.",
        });

        fetchData();
      }
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "خطأ",
        text: `فشل ${id ? "تحديث" : "إضافة"} نوع العمل. حاول مرة أخرى.`,
      });
    }
    setName(""); // Clear input after adding/updating
    setEditingId(null);
  };

  // Handle editing a task type
  const handleEdit = (id) => {
    setEditingId(id);
    const taskType = taskTypes.find((t) => t.id === id);
    setName(taskType.name);
    Swal.fire({
      title: "تحديث نوع العمل",
      input: "text",
      inputValue: taskType.name,
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

  // Handle deleting a task type
  const handleDelete = (id) => {
    Swal.fire({
      title: "تأكيد الحذف",
      text: "هل أنت متأكد أنك تريد حذف هذا النوع؟ لا يمكن التراجع عن هذا الإجراء.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "حذف",
      cancelButtonText: "إلغاء",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await axios.delete(`${Url}WorkOrderType/${id}`);
          setTaskTypes(taskTypes.filter((taskType) => taskType.id !== id));
          Swal.fire({
            icon: "success",
            title: "تم الحذف",
            text: "تم حذف نوع العمل بنجاح.",
          });
        } catch (error) {
          Swal.fire({
            icon: "error",
            title: "خطأ",
            text: "فشل حذف نوع العمل. حاول مرة أخرى.",
          });
        }
      }
    });
  };

  return (
    <div className="p-6 min-h-screen">
      <div className="w-[95%] mx-auto bg-white shadow-sm rounded-lg p-8">
        <div className="mb-6 p-4 mx-auto flex items-center justify-between">
          <h4 className="text-center text-green-700 font-bold mb-6">
            اضافه أنواع امر العمل
          </h4>

          <button
            onClick={() => {
              Swal.fire({
                title: "إضافة نوع عمل",
                input: "text",
                inputPlaceholder: "اسم نوع العمل",
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
            className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition duration-300"
          >
            إضافة نوع عمل
          </button>
        </div>
        <div className="p-3">
          {taskTypes.length > 0 ? (
            <ul className="divide-gray-300">
              {taskTypes.map((taskType) => (
                <li
                  key={taskType.id}
                  className="flex justify-between items-center p-1 px-4 bg-gray-50 rounded-lg shadow-md mb-2 hover:bg-gray-100 transition duration-300"
                >
                  <div>
                    <h6 className="font-medium text-gray-900 text-xl">
                      {taskType.name}
                    </h6>
                  </div>
                  <div className="flex gap-4">
                    <button
                      onClick={() => handleEdit(taskType.id)}
                      className="!bg-blue-500 text-white rounded-full px-2 py-2 hover:bg-blue-600 transition duration-300"
                    >
                      <FaEdit />
                    </button>
                    <button
                      onClick={() => handleDelete(taskType.id)}
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
              لم يتم إضافة أي نوع عمل بعد.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default TaskTypeContent;
