import React from "react";

const StatusSelection = ({ setCompleted }) => {
  return (
    <div className="w-full flex justify-center items-center h-[45vh] gap-10">
      <div
        onClick={() => setCompleted(true)}
        className="flex flex-col items-center cursor-pointer hover:scale-105 transition-all bg-secondaryColor text-white p-6 rounded-lg shadow-lg w-[250px] h-[200px]"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-16 w-16 mb-4"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M16 7a1 1 0 00-1 1v6a1 1 0 001 1 1 1 0 001-1V8a1 1 0 00-1-1zM5 7a1 1 0 00-1 1v6a1 1 0 001 1 1 1 0 001-1V8a1 1 0 00-1-1z"
            clipRule="evenodd"
          />
        </svg>
        <h2 className="text-xl font-semibold">تم التنفيذ</h2>
        <p className="text-sm">الطلبات المكتملة</p>
      </div>

      <div
        onClick={() => setCompleted(false)}
        className="flex flex-col items-center cursor-pointer hover:scale-105 transition-all bg-mainColor text-white p-6 rounded-lg shadow-lg w-[250px] h-[200px]"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-16 w-16 mb-4"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M8 4a1 1 0 00-1 1v6a1 1 0 001 1h8a1 1 0 001-1V5a1 1 0 00-1-1H8zM7 3a2 2 0 012-2h6a2 2 0 012 2v7H7V3z"
            clipRule="evenodd"
          />
        </svg>
        <h2 className="text-xl font-semibold">تحت التنفيذ</h2>
        <p className="text-sm">الطلبات تحت التنفيذ </p>
      </div>
    </div>
  );
};

export default StatusSelection;
