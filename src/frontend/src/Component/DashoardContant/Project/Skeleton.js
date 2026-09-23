import React from 'react';
import Skeleton from '@mui/material/Skeleton';
import './Project.css';

const ProjectListSkeleton = () => {
    return (
        <div className="project-list" id="Project-List-BarChart">
            <h3>
                <Skeleton variant="text" width={200} height={40} />
            </h3>
            <div className="project-container">
                {[...Array(5)].map((_, index) => (
                    <div className="project-card" key={index}>
                        <Skeleton variant="rectangular" width={50} height={20} />
                        <p className='numberOrder'><Skeleton variant="text" width={120} height={20} /></p>
                        <p><Skeleton variant="text" width={150} height={20} /></p>
                        <div className="project-image">
                            <Skeleton variant="rectangular" width={50} height={50} />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ProjectListSkeleton;
