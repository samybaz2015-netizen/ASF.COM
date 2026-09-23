import axios from "axios";
import { useEffect, useState } from "react";
import { Url } from "../../function/FunctionApi";
import PropTypes from "prop-types";

const Filter = ({ name, value, onChange }) => {
  const [options, setOptions] = useState([]);
  const [office, setOffice] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [taskTypes, setTaskTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchData = async (url, setter) => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(`${Url}${url}`);
      setter(response.data.data);
    } catch (err) {
      console.error(`Error fetching ${url}:`, err);
      setError(`Failed to load ${url} data`);
      setter([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchBranches = async () => {
    try {
      setLoading(true);
      setError(null);
      const [branchesResponse, taskTypesResponse, officesResponse] =
        await Promise.all([
          axios.get(`${Url}Branch`),
          axios.get(`${Url}WorkOrderType`),
          axios.get(`${Url}Office`),
        ]);

      setOffice(officesResponse.data.data);
      setOptions(branchesResponse.data.data);
      setTaskTypes(taskTypesResponse.data.data);
    } catch (err) {
      console.error("Error fetching branches data:", err);
      setError("Failed to load filter data");
      setOptions([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchDistricts = async () => {
    await fetchData("Neighborhood", setDistricts);
  };

  useEffect(() => {
    if (name === "district") {
      fetchDistricts();
    } else {
      fetchBranches();
    }
  }, [name]);

  const inputTypes = {
    requestNumber: {
      type: "number",
      placeholder: "رقم الطلب",
      icon: "fa-hashtag",
      label: "رقم الطلب",
    },
    contractor: {
      type: "text",
      placeholder: "المقاول",
      icon: "fa-building",
      label: "المقاول",
    },
    projectType: {
      type: "text",
      placeholder: "نوع المشروع",
      icon: "fa-project-diagram",
      label: "نوع المشروع",
    },
    startDate: {
      type: "date",
      placeholder: "تاريخ البدء",
      icon: "fa-calendar",
      label: "تاريخ البدء",
    },
    endDate: {
      type: "date",
      placeholder: "تاريخ الانتهاء",
      icon: "fa-calendar",
      label: "تاريخ الانتهاء",
    },
    consultant: {
      type: "text",
      placeholder: "الاستشاري",
      icon: "fa-user-tie",
      label: "الاستشاري",
    },
    stationNumber: {
      type: "text",
      placeholder: "رقم المحطة",
      icon: "fa-map-marker-alt",
      label: "رقم المحطة",
    },
    district: {
      type: "text",
      placeholder: "المنطقة",
      icon: "fa-map",
      label: "المنطقة",
    },
    situation: {
      type: "text",
      placeholder: "حالة الطلب",
      icon: "fa-info-circle",
      label: "حالة الطلب",
    },
    orderType: {
      type: "text",
      placeholder: "أمر العمل",
      icon: "fa-tasks",
      label: "أمر العمل",
    },
    faultNumber: {
      type: "text",
      placeholder: "رقم أمر العمل",
      icon: "fa-barcode",
      label: "رقم أمر العمل",
    },
    situation1: {
      type: "text",
      placeholder: "موقف التنفيذ",
      icon: "fa-chart-line",
      label: "موقف التنفيذ",
    },
    office: {
      type: "text",
      placeholder: "المكتب",
      icon: "fa-building",
      label: "المكتب",
    },
    actualValue: {
      type: "text",
      placeholder: "القيمة الفعلية",
      icon: "fa-money-bill",
      label: "القيمة الفعلية",
    },
    extractValue: {
      type: "text",
      placeholder: "رقم المستخلص",
      icon: "fa-file-invoice",
      label: "رقم المستخلص",
    },
    estimatedValue: {
      type: "text",
      placeholder: "القيمة التقديرية",
      icon: "fa-calculator",
      label: "القيمة التقديرية",
    },
    orderDate: {
      type: "date",
      placeholder: "تاريخ التنفيذ",
      icon: "fa-calendar-check",
      label: "تاريخ التنفيذ",
    },
    receiveDate: {
      type: "date",
      placeholder: "تاريخ الاستلام",
      icon: "fa-calendar-plus",
      label: "تاريخ الاستلام",
    },
    jobDescription: {
      type: "text",
      placeholder: "الوصف",
      icon: "fa-file-alt",
      label: "الوصف",
    },
    cableLength: {
      type: "number",
      placeholder: "طول الكابل",
      icon: "fa-ruler",
      label: "طول الكابل",
    },
    cableCompletion: {
      type: "number",
      placeholder: "نسبة اكتمال الكابل",
      icon: "fa-percentage",
      label: "نسبة اكتمال الكابل",
    },
    requestStatus: {
      type: "select",
      placeholder: "حالة الطلب",
      icon: "fa-tasks",
      label: "حالة الطلب",
    },
  };

  const getInputProps = (name) => {
    return (
      inputTypes[name] || {
        type: "text",
        placeholder: "أدخل قيمة",
        icon: "fa-edit",
        label: "حقل إدخال",
      }
    );
  };

  const { type, placeholder, icon, label } = getInputProps(name);

  const renderSelect = (options, defaultText) => (
    <div className="w-full">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <div className="relative">
        <i
          className={`fas ${icon} absolute left-3 top-1/2 -translate-y-1/2 text-gray-400`}
        ></i>
        <select
          className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
          name={name}
          value={value}
          onChange={onChange}
          disabled={loading}
        >
          <option value="">{defaultText}</option>
          {options.map((option) => (
            <option key={option.name} value={option.name}>
              {option.name}
            </option>
          ))}
        </select>
        <i className="fas fa-chevron-down absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"></i>
      </div>
    </div>
  );

  const renderInput = () => {
    if (loading)
      return (
        <div className="w-full py-2 text-center text-gray-500 text-sm">
          جاري التحميل...
        </div>
      );

    if (error)
      return (
        <div className="w-full py-2 text-center text-red-500 text-sm bg-red-50 rounded-md">
          {error}
        </div>
      );

    switch (name) {
      case "startDate":
      case "endDate":
        return (
          <div className="w-full">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {label}
            </label>
            <div className="relative">
              <i
                className={`fas ${icon} absolute left-3 top-1/2 -translate-y-1/2 text-gray-400`}
              ></i>
              <input
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                type={type}
                name={name}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
              />
            </div>
          </div>
        );

      case "district":
        return renderSelect(districts, "اختر الحي");

      case "projectType":
        return (
          <div className="w-full">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {label}
            </label>
            <div className="relative">
              <i
                className={`fas ${icon} absolute left-3 top-1/2 -translate-y-1/2 text-gray-400`}
              ></i>
              <select
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                name={name}
                value={value}
                onChange={onChange}
              >
                <option value="">اختر نوع المشروع</option>
                <option value="الإنشاءات">الانشائات</option>
                <option value="الصيانة">الصيانه</option>
                <option value="الطوارئ">الطوارئ</option>
                <option value="أعمال التاهيل">اعمال التاهيل</option>
                <option value="المشاريع الخاصة">المشاريع الخاصه</option>
              </select>
              <i className="fas fa-chevron-down absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"></i>
            </div>
          </div>
        );

      case "situation":
        return (
          <div className="w-full">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {label}
            </label>
            <div className="relative">
              <i
                className={`fas ${icon} absolute left-3 top-1/2 -translate-y-1/2 text-gray-400`}
              ></i>
              <select
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                name={name}
                value={value}
                onChange={onChange}
              >
                <option value="">اختر موقف التنفيذ</option>
                <option value="تحت التنفيذ">تحت التنفيذ</option>
                <option value="تم التنفيذ">تم التنفيذ</option>
                <option value="صدور شهادة الإنجاز">صدور شهادة الإنجاز</option>
                <option value="دخلت مستخلص">دخلت مستخلص</option>
                <option value="تم الصرف">تم الصرف</option>
              </select>
              <i className="fas fa-chevron-down absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"></i>
            </div>
          </div>
        );

      case "orderType":
        return (
          <div className="w-full">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {label}
            </label>
            <div className="relative">
              <i
                className={`fas ${icon} absolute left-3 top-1/2 -translate-y-1/2 text-gray-400`}
              ></i>
              <select
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                name={name}
                value={value}
                onChange={onChange}
              >
                <option value="">اختر نوع الأمر</option>
                <option value="توصيلات">توصيلات</option>
                <option value="مشاريع">مشاريع</option>
              </select>
              <i className="fas fa-chevron-down absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"></i>
            </div>
          </div>
        );

      case "office":
        return renderSelect(office, "المكتب");

      case "branch":
        return renderSelect(options, "الفرع");
      case "requestNumber":
        return renderSelect(taskTypes, "نوع أمر العمل");

      case "cableLength":
      case "cableCompletion":
        return (
          <div className="w-full">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {label}
            </label>
            <div className="relative">
              <i
                className={`fas ${icon} absolute left-3 top-1/2 -translate-y-1/2 text-gray-400`}
              ></i>
              <input
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                type={type}
                name={name}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                min={name === "cableCompletion" ? "0" : undefined}
                max={name === "cableCompletion" ? "100" : undefined}
              />
            </div>
          </div>
        );

      case "requestStatus":
        return (
          <div className="w-full">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              الارشفه
            </label>
            <div className="relative">
              <i
                className={`fas ${icon} absolute left-3 top-1/2 -translate-y-1/2 text-gray-400`}
              ></i>
              <select
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                name={name}
                value={value}
                onChange={onChange}
              >
                <option value="">اختر حالة الارشفه</option>
                <option value="true">تحت التنفيذ</option>
                <option value="false">تم التنفيذ</option>
              </select>
              <i className="fas fa-chevron-down absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"></i>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return <div className="mb-4">{renderInput()}</div>;
};

Filter.propTypes = {
  name: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  onChange: PropTypes.func.isRequired,
};

export default Filter;
