import React, { useState, useEffect } from "react";
import Sidebar from "../../Component/Sidebar/Sidebar";
import Header from "../../Component/Header/Header";
import Orders from "./Project";
import ChangesOrder from "./ChangesOrder";
import { useParams } from "react-router-dom";
import { fetchDataWithRetries } from "../../function/FunctionApi";
import Skeleton from "@mui/material/Skeleton";
import SkeletonProject from "./SkeletonProject";
import "./Project.css";

function Order() {
  const { id, type } = useParams();
  const [apiData, setApiData] = useState(null);
  const [changesData, setChangesData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingChanges, setLoadingChanges] = useState(true);
  const [error, setError] = useState(null);
  const [errorChanges, setErrorChanges] = useState(null);
  const getType = () => {
    const typesMap = {
      operation: "operations",
      newproject: "new",
      maintains: "main",
    };
    return typesMap[type] || "private";
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        await fetchDataWithRetries(
          `Search/search-by-orderidWithType?orderId=${id}&type=${type}`,
          setApiData
        );
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]); 
  
  console.log(apiData);
  useEffect(() => { 

    const fetchChangesData = async () => {
      try {
        await fetchDataWithRetries(
          `Search/${id}/changes?projectType=${getType()}`,
          setChangesData
        );
      } catch (err) {
        setErrorChanges(err.message);
      } finally {
        setLoadingChanges(false);
      }
    };
    fetchChangesData();
  }, [id]);

  if (loading || loadingChanges) {
    return (
      <div className="apDiv Order">
        <div className="body_container" dir="rtl">
        
          <div className="contantOrder">
            <SkeletonProject />
            <div className="changes-order-container">
              <h2 className="changes-title">التغيرات التي طرأت على الطلب</h2>
              <div className="changes-cards-container">
                {[...Array(3)].map((_, index) => (
                  <div key={index} className="change-card">
                    <div className="change-details">
                      <Skeleton variant="text" width={100} height={20} />
                      <Skeleton variant="text" width={150} height={20} />
                      <Skeleton variant="text" width={250} height={40} />
                    </div>
                    <Skeleton variant="circular" width={50} height={50} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return <div>حدث خطأ في تحميل البيانات الأساسية: {error}</div>;
  }

  if (errorChanges) {
    return <div>حدث خطأ في تحميل بيانات التغييرات: {errorChanges}</div>;
  }
  return (
    <div className="apDiv Order">
        <div className="contantOrder">
          {apiData && <Orders ApiData={apiData} id={id} type={type} />}
          <ChangesOrder changesData={changesData} />
        </div>
    </div>
  );
}

export default Order;
