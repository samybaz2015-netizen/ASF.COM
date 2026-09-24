import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faSave } from '@fortawesome/free-solid-svg-icons';
import './Categories.css';

// Material-UI imports
import { Select, MenuItem, FormControl, InputLabel } from '@mui/material';

const groupNames = ['مجموعة 1', 'مجموعة 2', 'مجموعة 3'];

function ComponentCategories() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newProvince, setNewProvince] = useState({ id: '', name: '', deliveryDays: '', groupName: '', code: '', price: '', isEnabled: false });
    const [isEditMode, setIsEditMode] = useState(false);

    const provincesData = [
        { id: 1, name: 'القاهرة', deliveryDays: 2, groupName: 'مجموعة 1', code: '001', price: 50, isEnabled: true },
        { id: 2, name: 'الجيزة', deliveryDays: 3, groupName: 'مجموعة 2', code: '002', price: 70, isEnabled: false },
        { id: 3, name: 'الإسكندرية', deliveryDays: 1, groupName: 'مجموعة 3', code: '003', price: 80, isEnabled: true },
        { id: 4, name: 'أسوان', deliveryDays: 4, groupName: 'مجموعة 1', code: '004', price: 100, isEnabled: false },
    ];

    const handleOpenModalForAdd = () => {
        setIsModalOpen(true);
        setIsEditMode(false);
        setNewProvince({ id: '', name: '', deliveryDays: '', groupName: '', code: '', price: '', isEnabled: false });
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
        const { name, value, type, checked } = e.target;
        if (type === 'checkbox') {
            setNewProvince((prevData) => ({ ...prevData, [name]: checked }));
        } else {
            setNewProvince((prevData) => ({ ...prevData, [name]: value }));
        }
    };

    const handleGroupNameChange = (event) => {
        setNewProvince((prevData) => ({ ...prevData, groupName: event.target.value }));
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
                <h2>الاصناف</h2>
                <button className="add-button" onClick={handleOpenModalForAdd}>
                    اضافه صنف +
                </button>
            </div>

            <table className="provinces-table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>اسم المجموعة</th>
                        <th>الاسم</th>
                        <th>الكود</th>
                        <th>السعر</th>
                        <th>مفعل</th>
                    </tr>
                </thead>
                <tbody>
                    {provincesData.map((province) => (
                        <tr key={province.id} onClick={() => handleOpenModalForEdit(province)}>
                            <td>{province.id}</td>
                            <td>{province.groupName}</td>
                            <td>{province.name}</td>
                            <td>{province.code}</td>
                            <td>{province.price}</td>
                            <td>
                                <div className="checkbox-group TabelCategories">
                                    <input
                                        type="checkbox"
                                        id="urgent"
                                        checked={province.isEnabled}
                                        onChange={(e) => e.stopPropagation()}
                                        disabled
                                    />
                                    <label htmlFor="urgent"></label>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

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
                                {/* Name */}
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

                                {/* Group Name - Material-UI Select */}
                                <div className="form-group">
                                    <label>اسم المجموعه</label>
                                    <FormControl sx={{ m: 1, minWidth: 120 }} size="small">
                                        <InputLabel id="group-name-select-label">اسم المجموعة</InputLabel>
                                        <Select
                                            labelId="group-name-select-label"
                                            id="group-name-select"
                                            value={newProvince.groupName}
                                            label="اسم المجموعة"
                                            onChange={handleGroupNameChange}
                                        >
                                            <MenuItem value="">
                                                <em>None</em>
                                            </MenuItem>
                                            {groupNames.map((name) => (
                                                <MenuItem key={name} value={name}>
                                                    {name}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>الكود</label>
                                    <input
                                        type="text"
                                        name="code"
                                        value={newProvince.code}
                                        onChange={handleInputChange}
                                        placeholder="الكود"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>السعر</label>
                                    <input
                                        type="number"
                                        name="price"
                                        value={newProvince.price}
                                        onChange={handleInputChange}
                                        placeholder="السعر"
                                    />
                                </div>
                            </div>

                            {/* Is Enabled */}
                            <div className="form-row">
                                <div className="checkbox-group form-grou">
                                <input
                                        type="checkbox"
                                        name="isEnabled"
                                        checked={newProvince.isEnabled}
                                        onChange={handleInputChange}
                                    />
                                    <label>مفعل</label>
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

export default ComponentCategories;
