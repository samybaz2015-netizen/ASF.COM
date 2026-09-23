import React, { useState, useEffect, useMemo } from "react";
import * as XLSX from "xlsx";
import noDataImage from "../../Image/App Illustrations.jpg";
import img from "../../Image/microsoft-excel-icon 1.png";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import axios from "axios";
import { Url } from "../../function/FunctionApi";
import { Link } from "react-router-dom"; 

import {officeNameMap} from '../../util/officeConstants'
import Filter from "../../Component/FilterationOrders/FilterationOrders";
import axiosInstance from "../../api/apiClient";

const RequestCard = ({ request, isChecked, onChange }) => {
  const getProjectTypeRoute = (orderType) => {
    switch (orderType) {
      case "العمليات":
        return "operation";
      case "المشاريع":
        return "newproject";
      case "الصيانة":
        return "maintains";
      default:
        return "privateproject";
    }
  };

  const projectTypeRoute = getProjectTypeRoute(request.type);
  console.log("requestType", request);
  return (
    <div className="request-card">
      {request.type === "المشاريع الخاصة" ? (
        <Link to={`/project/${projectTypeRoute}/${request.id}`}>
          <p>الفرع: {request.branchName}</p>
          <p> مكان المشروع: {request.projectPlace}</p>
          <p> اسم العميل: {request.customer}</p>
          <p>نوع المشروع: {request.type}</p>
          <p>حالة الطلب: {request.isArchive ? "مؤرشف" : "غير مؤرشف"}</p>
        </Link>
      ) : ( 
        <Link to={`/project/${projectTypeRoute}/${request.id}`}>
          <p>الفرع: {request.branchName}</p>
          <p>رقم الطلب: {request.faultNumber || request.orderNumber}</p>
          <p>مقدم الطلب: {request.contractor}</p>
          <p>نوع المشروع: {request.type}</p>
          <p>حالة الطلب: {request.isArchive ? "مؤرشف" : "غير مؤرشف"}</p>
        </Link>
      )}
    </div>
  );
};



const Modal = ({ isOpen, onClose, onExport }) =>
  isOpen && (
    <div className="modal-open">
      <div className="modal-content">
        <h2>تصدير البيانات</h2>
        <p>هل أنت متأكد أنك تريد تصدير الطلبات المحددة إلى Excel؟</p>
        <button className="export-button" onClick={onExport}>
          تصدير
        </button>
        <button className="close-modal-button" onClick={onClose}>
          إغلاق
        </button>
      </div>
    </div>
  );

const SearchRequests = () => {
  const [filters, setFilters] = useState({
    branch: "",
    requestNumber: "",
    contractor: "",
    projectType: "",
    requestStatus: "",
    searchQuery: "",
    startDate: "",
    endDate: "",
    consultant: "",
    stationNumber:	"" ,
    district: "",
  });
  const [apiData, setApiData] = useState([]);
  const [selectedRequests, setSelectedRequests] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await axiosInstance.get("Admin/AllOrders");
        setApiData([
          ...(response.data.maintencesOrders || []),
          ...(response.data.privateProjects || []),
          ...(response.data.newProjects || []),
          ...(response.data.operationOrders || []),
        ]);
        console.log(apiData);
      } catch (err) {
        setError("فشل في تحميل البيانات، يرجى المحاولة لاحقاً.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredRequests = useMemo(() => {
    return apiData.filter((request) => {
      const {
        branch,
        requestNumber,
        contractor,
        projectType,
        requestStatus,
        startDate,
        endDate,
        searchQuery,
        consultant,
        stationNumber,
        district,
      } = filters;
  
      const matchesBranch =
        !branch || request.branchName?.toLowerCase() === branch.toLowerCase();
      const matchesRequestNumber =
        !requestNumber ||
        request.orderNumber?.toString().includes(requestNumber);
      const matchesContractor =
        !contractor ||
        request.contractor?.toLowerCase().includes(contractor.toLowerCase());
      const matchesProjectType =
        !projectType ||
        (typeof request.type === "string" &&
          request.type.toLowerCase().includes(projectType.toLowerCase()));
      const matchesRequestStatus =
        !requestStatus || request.isArchived?.toString() === requestStatus;
      const matchesConsultant =
        !consultant ||
        request.consultant?.toLowerCase().includes(consultant.toLowerCase());
      const matchesStationNumber =
        !stationNumber ||
        request.stationNumber?.toString().includes(stationNumber);
      const matchesDistrict =
        !district ||
        request.district?.toLowerCase().includes(district.toLowerCase());
  
      const matchesDate =
        (!startDate || new Date(request.orderDate) >= new Date(startDate)) &&
        (!endDate || new Date(request.orderDate) <= new Date(endDate));
  
      const matchesSearchQuery =
        !searchQuery ||
        Object.values(request).some((value) =>
          value?.toString().toLowerCase().includes(searchQuery.toLowerCase())
        );
  
      return (
        matchesBranch &&
        matchesRequestNumber &&
        matchesContractor &&
        matchesProjectType &&
        matchesRequestStatus &&
        matchesConsultant &&
        matchesStationNumber &&
        matchesDistrict &&
        matchesDate &&
        matchesSearchQuery
      );
    });
  }, [apiData, filters]);
  

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prevFilters) => ({ ...prevFilters, [name]: value }));
  };

  const handleCheckboxChange = (index) => {
    setSelectedRequests((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  const handleSelectAll = () => {
    setSelectedRequests(
      selectedRequests.length === filteredRequests.length
        ? []
        : filteredRequests.map((_, index) => index)
    );
  };

  const exportToExcel = () => {
    const selectedData = filteredRequests.filter((_, index) =>
      selectedRequests.includes(index)
    );
    const worksheet = XLSX.utils.json_to_sheet(selectedData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Requests");
    XLSX.writeFile(workbook, "selected_requests.xlsx");
    setIsModalOpen(false);
  };

  if (loading) {
    return <Skeleton count={10} height={50} />;
  }

  if (error) {
    return <div>{error}</div>;
  }

  const renderFilterOptions = (key) => {
    const optionsMap = {
      branch: [
        { value: "", label: "الفرع" },
        { value: "الرياض", label: "الرياض" },
        { value: "جدة", label: "جدة" },
      ],
      projectType: [
        { value: "", label: "نوع المشروع" },
        { value: "ordersSubs", label: "مشتركين" },
        { value: "operationOrders", label: "عمليات وصيانة" },
        { value: "newProjects", label: "مشاريع" },
      ],
      requestStatus: [
        { value: "", label: "حالة الطلب" },
        { value: "true", label: "مؤرشف" },
        { value: "false", label: "غير مؤرشف" },
      ],
    };
    return optionsMap[key] || [];
  };

  return (
    <div className="search-requests-container">
      <div className="filters-container">
        {Object.keys(filters).map(
          (key) =>
            key !== "searchQuery" && (
              <Filter
                key={key}
                name={key}
                value={filters[key]}
                onChange={handleFilterChange}
                options={renderFilterOptions(key)}
              />
            )
        )}
      </div>

      <div className="cards-container">
        {filteredRequests.length > 0 ? (
          filteredRequests.map((request, index) => (
            <RequestCard
              key={index}
              request={request}
              isChecked={selectedRequests.includes(index)}
              onChange={() => handleCheckboxChange(index)}
            />
          ))
        ) : (
          <img src={noDataImage} alt="No Data" className="no-data-image" />
        )}
      </div>

      {selectedRequests.length > 0 && (
        <div className="div-open-modal">
          <button
            className="open-modal-button"
            onClick={() => setIsModalOpen(true)}
          >
            تصدير <img src={img} alt="Export to Excel" />
          </button>
        </div>
      )}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onExport={exportToExcel}
      />
    </div>
  );
};

export default SearchRequests;
