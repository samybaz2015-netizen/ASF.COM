import React, { useEffect, useState } from "react";
import Form from "./ConstructionForm";
import { useParams } from "react-router-dom";
import axios from "axios";
import { Url } from "../../function/FunctionApi";
import { LoadingModal } from "../../Component/Common/ModelComponents";

function Construction({ userData }) {
  const { id } = useParams();
  const [apiData, setApiData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    window.scrollTo(0, 0);
    const fetchData = async () => {
      try {
        if (id) {
          setLoading(true);
          const token = userData?.token;
          const response = await axios.get(`${Url}Construction/get-construction/${id}`, {
            headers: {
              Authorization: `Bearer ${token}`
            }
          });

          if (response.data.statusCode === 200) {
            setApiData(response.data.data);
          } else {
            setError("Failed to fetch construction data");
          }
        }
      } catch (err) {
        console.error("Error fetching construction data:", err);
        setError(err.response?.data?.message || "An error occurred while fetching data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, userData]);

  if (loading) {
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <LoadingModal />
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <div className="bg-white p-6 rounded-lg shadow-lg border border-red-200">
          <p className="text-red-500 text-center text-lg">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Form userData={userData} apiData={apiData} />
    </>
  );
}

export default Construction;
