import React from "react";
import { Link } from "react-router-dom";

const Card = ({ to, icon, title, description, bgColor }) => {
  return (
    <Link
      to={to}
      className={`flex flex-col items-center cursor-pointer hover:scale-105 transition-all ${bgColor} text-white p-6 rounded-lg shadow-lg w-[250px] h-[200px]`}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-16 w-16 mb-4"
        viewBox="0 0 20 20"
        fill="currentColor"
        aria-hidden="true"
      >
        <path fillRule="evenodd" d={icon} clipRule="evenodd" />
      </svg>
      <h2 className="text-xl font-semibold">{title}</h2>
      <p className="text-sm">{description}</p>
    </Link>
  );
};

function OperateMaintains() {
  const cards = [
    {
      to: "/Sub-page/maintains",
      icon: "M8 4a1 1 0 00-1 1v6a1 1 0 001 1h8a1 1 0 001-1V5a1 1 0 00-1-1H8zM7 3a2 2 0 012-2h6a2 2 0 012 2v7H7V3z",
      title: "الصيانة",
      description: "طلبات الصيانة",
      bgColor: "bg-secondaryColor",
    },
    {
      to: "/Sub-page/construction",
      icon: "M4 3h12l1 2v10H3V5l1-2zM3 15h14v2H3v-2zM9 6h2v6H9V6zM5 6h2v6H5V6zM13 6h2v6h-2V6z",
      title: "الإنشاءات",
      description: "طلبات الإنشاءات",
      bgColor: "bg-mainColor",
    },
    {
      to: "/Sub-page/emergency",
      icon: "M10 2a1 1 0 00-1 1v2H5a1 1 0 000 2h4v2H7a1 1 0 000 2h2v2H5a1 1 0 000 2h4v2a1 1 0 102 0v-2h4a1 1 0 000-2h-4v-2h2a1 1 0 000-2h-2V7h4a1 1 0 000-2h-4V3a1 1 0 00-1-1z",
      title: "الطوارئ",
      description: "طلبات الطوارئ",
      bgColor: "bg-red-500",
    },
    {
      to: "/Sub-page/rehabilitation",
      icon: "M12 2l4 4-1.5 1.5L14 5l-2 2 3 3-1.5 1.5-3-3-2 2 2.5 2.5-1.5 1.5L6 13l-2 2H2v-2l2-2L2 7h2l2 2 2.5-2.5L9 5l1-1 2-2z",
      title: "أعمال التأهيل",
      description: "طلبات التأهيل",
      bgColor: "bg-green-500",
    },
  ];

  return (
    <div
      
      className="w-full min-h-screen  flex justify-center items-center gap-10 flex-wrap"
    >
      {cards.map((card, index) => (
        <Card key={index} {...card} />
      ))}
    </div>
  );
}

export default OperateMaintains;
