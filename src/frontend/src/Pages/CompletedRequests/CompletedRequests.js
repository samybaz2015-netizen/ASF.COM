import { React, useEffect, useState } from "react";
import Navbar from "../../Component/NavBar/Navbar"
import Footer from "../../Component/Footer/Footer";
import Banner from "../../Component/ArchivedRequestsComp/Banner/Banner";
import Img from "../../Image/Rectangle1.png";
import Projects from "../../Component/ArchivedRequestsComp/Project/Project";


function MainPage() {
    return (
        <>
            <Banner img={Img} title={"الطلبات المؤرشفة"} Description={"قم بإضافة طلبك وتأكد من إدخال المعلومات بشكل صحيح"}/>
            <Projects/>
        </>
    );
}

export default MainPage;
