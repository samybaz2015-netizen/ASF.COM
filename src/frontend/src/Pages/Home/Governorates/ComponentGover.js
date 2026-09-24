import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faSave } from '@fortawesome/free-solid-svg-icons';
import { fetchDataWithRetries } from "../../../Component/function/FunctionApi";
import { postDatatoQueryParams } from "../../../Component/function/FunctionApi";
import { putDataToQueryParams } from "../../../Component/function/FunctionApi";

import './Governorate.css';

function ComponentGover() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newProvince, setNewProvince] = useState({ name: '', DeliveryDays: '' });
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
                await fetchDataWithRetries('Governorate/get-governorates', setApiData);
            } catch (err) {
                setError('Failed to fetch data. Please try again later.');
            } finally {
                setLoading(false);
            }
        };

        fetchGovernorates();
    }, []);


    const handleOpenModal = (editMode = false, province = { name: '', DeliveryDays: '' }) => {
        setIsEditMode(editMode);
        setNewProvince(province);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setNewProvince((prevData) => ({ ...prevData, [name]: value }));
    };

    const handleSave = async () => {
        if (isEditMode) {
            try {
                const updateParams = {
                    Name: newProvince.name, 
                    DeliveryDays: newProvince.DeliveryDays 
                };
                await putDataToQueryParams('Governorate/update-governorate', updateParams);
                await fetchDataWithRetries('Governorate/get-governorates', setApiData);
                setSuccessMessage('تم تعديل المحافظة بنجاح'); 
                setShowSuccessPopup(true);
            } catch (err) {
                console.error("Error updating province:", err);
                setError('Failed to update province. Please try again later.');
            }
        } else {
            try {
                await postDatatoQueryParams('Governorate/create-governorate', newProvince, setError);
                await fetchDataWithRetries('Governorate/get-governorates', setApiData);
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

    return (
        <div className="provinces-container">
            <div className="header-section">
                <h2>المحافظات</h2>
                <button className="add-button" onClick={() => handleOpenModal(false)}>
                    اضافه محافظه +
                </button>
            </div>

            {loading ? (
                <p>Loading...</p>
            ) : error ? (
                <p className="error-message">{error}</p>
            ) : (
                <table className="provinces-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>الاسم</th>
                            <th>عدد أيام التوصيل</th>
                        </tr>
                    </thead>
                    <tbody>
                        {apiData.data && apiData.data.length > 0 ? (
                            apiData.data.map((province, index) => (
                                <tr key={province.id} onClick={() => handleOpenModal(true, province)}>
                                    <td>{index + 1}</td>
                                    <td>{province.name}</td>
                                    <td>{province.deliveryDays}</td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="3">No data available</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            )}

            {/* Modal */}
            {isModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h3>{isEditMode ? 'تعديل محافظة' : 'محافظة جديدة'}</h3>
                            <FontAwesomeIcon
                                icon={faTimes}
                                className="modal-close"
                                onClick={handleCloseModal}
                            />
                        </div>
                        <hr />
                        <div className="modal-body">
                            <div className="form-row">
                                <div className="form-group">
                                    <label>الاسم</label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={newProvince.name || ''}
                                        onChange={handleInputChange}
                                        placeholder="الاسم"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>عدد أيام التوصيل</label>
                                    <input
                                        type="number"
                                        name="deliveryDays"
                                        value={newProvince.deliveryDays || ''}
                                        onChange={handleInputChange}
                                        placeholder="عدد أيام التوصيل"
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="action-button" onClick={handleSave}>
                                <FontAwesomeIcon icon={faSave} /> {isEditMode ? 'تحديث' : 'حفظ'}
                            </button>
                        </div>
                    </div>
                </div>
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

export default ComponentGover;
