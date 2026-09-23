import React, { useEffect, useState } from "react";
import FormArchivedRequest from "../../Component/SubmitApplicationComp/SubmitApplication/SubmitApplication";
import { useParams, useSearchParams } from "react-router-dom";
import axios from "axios";
import { Url } from "../../function/FunctionApi";
import { useLocation } from "react-router-dom";

function MainPage({ userData }) {
  const [searchParams] = useSearchParams();

  const office = searchParams.get("office");
console.log('offfice+++++++++++++')
console.log(office)

  const { id } = useParams();
  const [apiData, setApiData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    window.scrollTo(0, 0);

    const fetchData = async () => {
      try {
        if (id) {
          const token = userData?.token;

          const response = await axios.get(
            `${Url}OrderForSubscribe/filter-orders`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );

          const filteredData = response.data.filter((item) => item.id == id);

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
      <FormArchivedRequest userData={userData} apiData={apiData} />
    </>
  );
}

export default MainPage;
