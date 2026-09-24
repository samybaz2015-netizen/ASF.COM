import { useEffect } from 'react';
import img from "../../Image/error 404.gif"
import "./NotFound.css"

function NotFound() {  
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);
    
    return (
        <div className="notFound">
            <img src={img} alt=''/>
        </div>
    )
}

export default NotFound;
