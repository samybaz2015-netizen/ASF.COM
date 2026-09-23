import React, { useEffect, useState } from "react";
import Banner from "../../Component/Banner/Banner";
import AboutUs from "../../Component/AboutUs/AboutUs";
import LatestProjects from "../../Component/LatestProjects/LatestProjects";

function MainPage({userData}) {
    useEffect(() => {
        window.scrollTo(0, 0);
      }, []);
    return (
        <>
            <Banner userData={userData}/>
            <AboutUs userData={userData}/>
            {/* <LatestProjects />             */}
        </>
    );
}

export default MainPage;
