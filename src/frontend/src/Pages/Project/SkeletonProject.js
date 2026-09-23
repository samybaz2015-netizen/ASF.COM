import React from "react";
import Skeleton from '@mui/material/Skeleton';

const FormSkeleton = () => {
    return (
        <div className="form-container" id="form-container" dir='rtl'>
            <div className='radio-container'>
                <h2>قم بتحديد نوع المشروع</h2>
                <div className="radio-group">
                    <Skeleton variant="rectangular" width={300} height={30} />
                </div>
            </div>

            <div className='FormData'>
                <div className='container'>
                    <h3>بيانات الطلب</h3>
                    <p>Quote is generated upon loading the form</p>
                    <div className="input-group">
                        <Skeleton variant="rectangular" width={250} height={30} />
                        <Skeleton variant="rectangular" width={250} height={30} />
                    </div>
                    <div className="input-group">
                        <Skeleton variant="rectangular" width={250} height={30} />
                        <Skeleton variant="rectangular" width={250} height={30} />
                    </div>
                    <div className="input-group">
                        <Skeleton variant="rectangular" width={500} height={30} />
                    </div>

                    <div className="upload-section">
                        <h4>النموزج</h4>
                        <Skeleton variant="rectangular" width={300} height={50} />
                    </div>

                    <div className="upload-section">
                        <h4>صور الموقع</h4>
                        <Skeleton variant="rectangular" width={300} height={50} />
                    </div>

                    <div className="upload-section">
                        <h4>مخالفات السلامة</h4>
                        <Skeleton variant="rectangular" width={300} height={50} />
                    </div>

                    <div className="input-group">
                        <Skeleton variant="rectangular" width={500} height={100} />
                    </div>

                    <div className="button-group">
                        <Skeleton variant="rectangular" width={150} height={50} />
                        <Skeleton variant="rectangular" width={150} height={50} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FormSkeleton;
