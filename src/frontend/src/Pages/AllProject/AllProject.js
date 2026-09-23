import { React, useEffect } from "react";
import Projects from "./Projects";
 
function MainPage({ userData }) {
  
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="mt-[10px] justify-center  w-full flex items-center ">
      <Projects userData={userData} />
    </div>
  );
}

export default MainPage;
