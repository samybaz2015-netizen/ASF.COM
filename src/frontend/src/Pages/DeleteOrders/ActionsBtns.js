import { FaUndo, FaTrash } from "react-icons/fa";

function ActionButtons({ onRetrieve, onDelete }) {
  return (
    <div className="p-2 !w-[100%] flex items-center justify-between bg-gray-100 rounded-lg shadow-md  mt-2">
      <button
        className="flex items-center gap-2 px-4 py-2 text-white bg-green-500 rounded-md hover:bg-green-600 focus:outline-none focus:ring focus:ring-green-300"
        onClick={onRetrieve}
      >
        <FaUndo />
        <span>استرجاع</span>
      </button>
      <button
        className="flex items-center gap-2 px-4 py-2 text-white bg-red-500 rounded-md hover:bg-red-600 focus:outline-none focus:ring focus:ring-red-300"
        onClick={onDelete}
      >
        <FaTrash />
        <span>حذف</span>
      </button>
    </div>
  );
}

export default ActionButtons;
