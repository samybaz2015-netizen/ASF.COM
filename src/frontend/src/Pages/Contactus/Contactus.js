import React, { useEffect} from "react";
import Banner from "../../Component/SubmitApplicationComp/Banner";
import FormContact from "./FormContact/FormContact";
import Map from "./Map/Map";
import Img from "../../Image/Rectangle2.png"

function MainPage() {
    useEffect(() => {
        window.scrollTo(0, 0);
      }, []);
    
    return (
        <>
            <Banner img={Img} title ={"تواصل معنا"} Description={"الصفحة الرئيسية / تواصل معنا"}/> 
            <FormContact/>
            <Map/>
        </>
    );
}

export default MainPage;
