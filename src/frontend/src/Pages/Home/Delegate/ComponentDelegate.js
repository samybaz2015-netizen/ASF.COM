import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faSave } from '@fortawesome/free-solid-svg-icons';
import { fetchDataWithRetries } from "../../../Component/function/FunctionApi";
import { postDatatoQueryParams } from "../../../Component/function/FunctionApi";
import { putDataToQueryParams } from "../../../Component/function/FunctionApi";
import DelegateModal from './DelegateModal';
import './Delegate.css';

function ComponentDelegate() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newDelegate, setNewDelegate] = useState({ GovernorateId: '', FirstName: '', FullName: '', Email: '', PhoneNumber: '' });
    const [isEditMode, setIsEditMode] = useState(false);
    const [apiData, setApiData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState('');
    const [showSuccessPopup, setShowSuccessPopup] = useState(false);

    useEffect(() => {
        const fetchGovernorates = async () => {
            try {
                setLoading(true);
                setError(null);
                await fetchDataWithRetries('Represntative/get-Represntatives', setApiData);
            } catch (err) {
                setError('Failed to fetch data. Please try again later.');
            } finally {
                setLoading(false);
            }
        };
        fetchGovernorates();
    }, []);

    const handleOpenModalForAdd = () => {
        setIsModalOpen(true);
        setIsEditMode(false);
        setNewDelegate({ GovernorateId: '', FirstName: '', FullName: '', Email: '', PhoneNumber: '' });
    };

    const handleOpenModalForEdit = (delegate) => {
        setIsModalOpen(true);
        setIsEditMode(true);
        setNewDelegate(delegate);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
    };

    const handleSave = async () => {
        if (isEditMode) {
            try {
                const newDelegate = {
                    Name: newDelegate.name, 
                    DeliveryDays: newDelegate.DeliveryDays 
                };
                await putDataToQueryParams('Governorate/update-governorate', newDelegate);
                await fetchDataWithRetries('Represntative/get-Represntatives', setApiData);
                setSuccessMessage('تم تعديل المحافظة بنجاح'); 
                setShowSuccessPopup(true);
            } catch (err) {
                console.error("Error updating province:", err);
                setError('Failed to update province. Please try again later.');
            }
        } else {
            try {
                await postDatatoQueryParams('Represntative/create-represntative', newDelegate, setError);
                await fetchDataWithRetries('Represntative/get-Represntatives', setApiData);
                setSuccessMessage('تم إضافة المحافظة بنجاح'); 
                setShowSuccessPopup(true);
            } catch (err) {
                console.error("Error saving new province:", err);
            }
        }
        handleCloseModal();
    };

    const closeSuccessPopup = () => {
        setShowSuccessPopup(false);
    };

    if (loading) {
        return <div className="loading">Loading...</div>;
    }

    if (error) {
        return <div className="error">{error}</div>;
    }

    return (
        <div className="provinces-container">
            <div className="header-section">
                <h2>المندوب</h2>
                <button className="add-button" onClick={handleOpenModalForAdd}>
                    اضافة مندوب +
                </button>
            </div>

            <table className="provinces-table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>المحافظة</th>
                        <th>الاسم</th>
                        <th>الاسم بالكامل</th>
                        <th>البريد الإلكتروني</th>
                        <th>رقم الهاتف</th>
                    </tr>
                </thead>
                <tbody>
                    {apiData.data.map((delegate, index) => (
                        <tr key={delegate.id} onClick={() => handleOpenModalForEdit(delegate)}>
                            <td>{index + 1}</td>
                            <td>{delegate.governorate}</td>
                            <td>{delegate.firstName}</td>
                            <td>{delegate.fullName}</td>
                            <td>{delegate.email}</td>
                            <td>{delegate.phoneNumber}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {isModalOpen && (
                <DelegateModal
                    isEditMode={isEditMode}
                    delegate={newDelegate}
                    onClose={handleCloseModal}
                    onSave={handleSave}
                    onInputChange={(e) => {
                        const { name, value } = e.target;
                        setNewDelegate((prevData) => ({ ...prevData, [name]: value }));
                    }}
                />
            )}

             {/* Success Popup */}
             {showSuccessPopup && (
                <div className="modal-overlay Success-modal">
                    <div className="modal-content">
                        <div className="modal-body">
                            <p>{successMessage}</p>
                        </div>
                        <div className="modal-footer">
                            <button className="action-button" onClick={closeSuccessPopup}>
                                إغلاق
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default ComponentDelegate;
