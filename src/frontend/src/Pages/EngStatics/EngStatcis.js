import React, { useState, useEffect } from "react";
import { FaTools, FaCogs, FaBuilding, FaRegHandshake } from "react-icons/fa";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { fetchDataWithRetries } from "../../function/FunctionApi"; // API helper function

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

function EngStatcis() {
  const [projectStats, setProjectStats] = useState([]);
  const [weeklyData, setWeeklyData] = useState([]);
  const [data, setData] = useState(null);

  useEffect(() => {
    fetchDataWithRetries("Account/get-projects-count-and-weekly", setData);
  }, []);

  useEffect(() => {
    if (data) {
      const {
        countRehabilitationworks = 0,
        countPrivate = 0,
        countConstruction = 0,
        countEmergency = 0,
        countMaintenance = 0,
        weeklyData = [],
      } = data.data;

      setProjectStats([
        {
          label: "أعمال التأهيل",
          count: countRehabilitationworks,
          icon: <FaBuilding size={30} className="text-blue-600" />,
        },
        {
          label: "مشاريع خاصة",
          count: countPrivate,
          icon: <FaRegHandshake size={30} className="text-red-600" />,
        },
        {
          label: "مشاريع الإنشاء",
          count: countConstruction,
          icon: <FaCogs size={30} className="text-green-600" />,
        },
        {
          label: "مشاريع الطوارئ",
          count: countEmergency,
          icon: <FaTools size={30} className="text-orange-600" />,
        },
        {
          label: "مشاريع الصيانة",
          count: countMaintenance,
          icon: <FaTools size={30} className="text-purple-600" />,
        },
      ]);

      setWeeklyData(weeklyData);
    }
  }, [data]);

  // Prepare chart data dynamically
  const chartData = {
    labels: weeklyData.map((week) => `الأسبوع ${week.week}`),
    datasets: [
      {
        label: "عدد المشاريع",
        data: weeklyData.map((week) => week.projectCount),
        backgroundColor: "rgba(54, 162, 235, 0.6)",
        borderColor: "rgba(54, 162, 235, 1)",
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { position: "top" },
      title: { display: true, text: "رسم بياني لآخر المشاريع خلال الشهر" },
    },
    maintainAspectRatio: false,
  };

  return (
    <div className="p-4 my-12 bg-gray-50 mt-20 min-h-screen">
      <h1 className="text-2xl font-bold text-center mb-6 text-gray-800">
        إحصائيات المشاريع
      </h1>

      {/* Statistics Section */}
      <div className="w-[90%] my-12 mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        {projectStats.map((stat, index) => (
          <div
            key={index}
            className="bg-white shadow-sm rounded-lg p-4 text-center hover:scale-105 transition-transform duration-200"
          >
            <div className="mb-3">{stat.icon}</div>
            <h2 className="text-lg font-semibold text-gray-700 mb-1">
              {stat.label}
            </h2>
            <p className="text-xl font-bold text-blue-600">{stat.count}</p>
          </div>
        ))}
      </div>

      {/* Chart Section */}
      <div className="bg-white shadow-sm rounded-lg p-4 mb-6">
        <h2 className="text-lg font-semibold text-center text-gray-800 mb-3">
          رسم بياني لآخر المشاريع خلال الشهر
        </h2>
        <div className="relative h-56 sm:h-72 md:h-96">
          <Bar data={chartData} options={chartOptions} />
        </div>
      </div>
    </div>
  );
}

export default EngStatcis;
