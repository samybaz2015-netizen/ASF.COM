import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faSave } from '@fortawesome/free-solid-svg-icons';
// import './Governorate.css';

function ComponentItemsGroup() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newProvince, setNewProvince] = useState({ id: '', name: '', deliveryDays: '' });
    const [isEditMode, setIsEditMode] = useState(false); 

    const provincesData = [
        { id: 1, name: 'القاهرة', deliveryDays: 'تيشرت رجالي؟1' },
        { id: 2, name: 'الجيزة', deliveryDays: 'تيشرت رجالي؟1' },
        { id: 3, name: 'الإسكندرية', deliveryDays: 'تيشرت رجالي' },
        { id: 4, name: 'أسوان', deliveryDays: 'تيشرت رجالي' },
    ];

    const handleOpenModalForAdd = () => {
        setIsModalOpen(true);
        setIsEditMode(false); 
        setNewProvince({ id: '', name: '', deliveryDays: '' }); 
    };

    const handleOpenModalForEdit = (province) => {
        setIsModalOpen(true);
        setIsEditMode(true);
        setNewProvince(province); 
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setNewProvince((prevData) => ({ ...prevData, [name]: value }));
    };

    const handleSave = () => {
        if (isEditMode) {
            console.log('Updated Province:', newProvince);
        } else {
            console.log('New Province:', newProvince); 
        }
        handleCloseModal();
    };

    return (
        <div className="provinces-container">
            <div className="header-section">
                <h2>مجموعة الاصناف</h2>
                <button className="add-button" onClick={handleOpenModalForAdd}>
                    اضافه مجموعة +
                </button>
            </div>

            <table className="provinces-table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>الاسم</th>
                        <th>اسم المجموعة؟!</th>
                    </tr>
                </thead>
                <tbody>
                    {provincesData.map((province) => (
                        <tr key={province.id} onClick={() => handleOpenModalForEdit(province)}>
                            <td>{province.id}</td>
                            <td>{province.name}</td>
                            <td>{province.deliveryDays}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* Modal */}
            {isModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h3>{isEditMode ? 'تعديل المجموعة' : 'مجموعة جديد'}</h3>
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
                                        value={newProvince.name}
                                        onChange={handleInputChange}
                                        placeholder="الاسم"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>اسم المجموعة</label>
                                    <input
                                        type="text"
                                        name="deliveryDays"
                                        value={newProvince.deliveryDays}
                                        onChange={handleInputChange}
                                        placeholder="اسم المجموعة"
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
        </div>
    );
}

export default ComponentItemsGroup;
