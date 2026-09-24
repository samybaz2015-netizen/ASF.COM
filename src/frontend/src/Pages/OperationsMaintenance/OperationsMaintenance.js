import React, { useEffect, useState } from "react";
import Banner from "../../Component/SubmitApplicationComp/Banner";
import Form from "./Form";
import img from "../../Image/Rectangle.png";
import { useParams } from "react-router-dom";
import axios from "axios";
import { Url } from "../../function/FunctionApi";

function MainPage({ userData }) {
  const { id } = useParams();
  const [apiData, setApiData] = useState(null);
  const [error, setError] = useState(null);
  console.log(id);
  useEffect(() => {
    window.scrollTo(0, 0);

    const fetchData = async () => {
      try {
        if (id) {
          const token = userData?.token;

          const response = await axios.get(
            `${Url}OperationsAndMaintenaceRequest/filter-orders`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );
          console.log("response++++++++++++++++++++++++++");
          console.log(response.data);
          const filteredData = response.data.filter((item) => item.id == id);
          console.log(filteredData);
          setApiData(filteredData.length > 0 ? filteredData[0] : null);
        }
      } catch (err) {
        setError("An error occurred while fetching data.");
      }
    };

    fetchData();
  }, [id, userData]);

  return (
    <>
      <Banner
        img={img}
        title={"تقديم طلب العمليات والصيانة"}
        Description={"قم بإضافة طلبك وتأكد من إدخال المعلومات بشكل صحيح"}
      />
      <Form userData={userData} apiData={apiData} />
    </>
  );
}

export default MainPage;
