import React, { useEffect, useState } from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { fetchDataWithRetries } from '../../../function/FunctionApi'; 
import "./BarChart.css";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const BarChart = () => {
    const [data, setData] = useState(null); 
    const [loading, setLoading] = useState(true); 
    const [error, setError] = useState(null); 

    useEffect(() => {
        const fetchChartData = async () => {
            setLoading(true);
            setError(null);
            try {
                await fetchDataWithRetries("OrderForSubscribe/completed-orders-byYear", (responseData) => {
                    const { orderCountRiyadh, orderCountHail } = responseData;

                    if (!Array.isArray(orderCountRiyadh) || !Array.isArray(orderCountHail)) {
                        throw new Error("Invalid data format");
                    }
                    if (orderCountRiyadh.every(count => count === 0) && orderCountHail.every(count => count === 0)) {
                        setError("لا توجد طلبات للعرض."); 
                    } else {
                        setData(generateChartData(orderCountRiyadh, orderCountHail));
                    }
                }, setLoading);
            } catch (err) {
                setError("فشل في تحميل البيانات. حاول مرة أخرى.");
                console.error("Error fetching data:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchChartData();
    }, []);

    const generateChartData = (orderCountRiyadh, orderCountHail) => ({
        labels: ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'],
        datasets: [
            {
                label: 'فرع الرياض',
                data: orderCountRiyadh,
                backgroundColor: 'rgba(76, 175, 79, 1)',
            },
            {
                label: 'فرع جدة',
                data: orderCountHail,
                backgroundColor: 'rgba(216, 217, 219, 1)',
            },
        ],
    });

    const options = {
        responsive: true,
        plugins: {
            legend: {
                position: 'top',
            },
            title: {
                display: true,
                text: 'عدد الطلبات بين فرع الرياض وفرع جدة خلال السنة',
            },
        },
        scales: {
            y: {
                beginAtZero: true,
                max: Math.max(...data ? [Math.max(...data.datasets[0].data), Math.max(...data.datasets[1].data)] : [0]), // Dynamically set max
                ticks: {
                    stepSize: 500,
                },
            },
        },
    };

    if (loading) {
        return <div className="loading-indicator">جاري تحميل البيانات...</div>; 
    }

    if (error) {
        return <div className="error-message">{error}</div>; 
    }

    return (
        <div className='BarChart'>
            {data && <Bar className="Bar" data={data} options={options} aria-label="Bar chart showing order counts between Riyadh and Hail" />} 
        </div>
    );
};

export default BarChart; 
