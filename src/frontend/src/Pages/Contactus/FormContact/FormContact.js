import React, { useState } from 'react';
import { postDatatoQueryParams } from "../../../function/FunctionApi";
import './FormContact.css';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';

const FormContact = () => {
    const [formData, setFormData] = useState({
        Email: '',
        FullName: '',
        Address: '',
        PhoneNumber: '',
        Message: '',
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [showErrorModal, setShowErrorModal] = useState(false);

    const handleInputChange = (e) => {
        const { id, value } = e.target;
        setFormData((prevData) => ({
            ...prevData,
            [id]: value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const { Email, FullName, Address, PhoneNumber, Message } = formData;
        if (!Email || !FullName || !Address || !PhoneNumber || !Message) {
            setError("جميع الحقول مطلوبة");
            setLoading(false);
            setShowErrorModal(true);
            return;
        }

        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailPattern.test(Email)) {
            setError("البريد الالكتروني غير صالح");
            setLoading(false);
            setShowErrorModal(true);
            return;
        }

        try {
            const result = await postDatatoQueryParams("Contact/send-message", formData, setError);
            if (result) {
                setShowSuccessModal(true);
                setFormData({
                    Email: '',
                    FullName: '',
                    Address: '',
                    PhoneNumber: '',
                    Message: '',
                });
            }
        } catch (error) {
            setError("حدث خطأ أثناء إرسال الرسالة. يرجى المحاولة مرة أخرى");
            setShowErrorModal(true);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="contact-form" id="FormContact" dir='rtl'>
            <div className='container'>
                <form onSubmit={handleSubmit}>
                    <div className="form-row">
                        <div className="form-group">
                            <div>
                                <input
                                    type="email"
                                    id="Email"
                                    placeholder="عنوان بريدك الالكتروني"
                                    value={formData.Email}
                                    onChange={handleInputChange}
                                    required
                                    aria-label="البريد الالكتروني"
                                    aria-describedby="emailHelp"
                                />
                                <small id="emailHelp" className="form-text text-muted">سوف نتواصل معك عبر هذا البريد.</small>
                            </div>

                        </div>
                        <div className="form-group">
                            <input
                                type="text"
                                id="FullName"
                                placeholder="اسمك بالكامل"
                                value={formData.FullName}
                                onChange={handleInputChange}
                                required
                                aria-label="الاسم الكامل"
                            />
                        </div>
                    </div>
                    <div className="form-row">
                        <div className="form-group">
                            <input
                                type="text"
                                id="Address"
                                placeholder="عنوانك"
                                value={formData.Address}
                                onChange={handleInputChange}
                                required
                                aria-label="العنوان"
                            />
                        </div>
                        <div className="form-group">
                            <input
                                type="tel"
                                id="PhoneNumber"
                                placeholder="رقم هاتفك"
                                value={formData.PhoneNumber}
                                onChange={handleInputChange}
                                required
                                aria-label="رقم الهاتف"
                            />
                        </div>
                    </div>
                    <div className="form-group">
                        <textarea
                            id="Message"
                            placeholder="ادخل رسالتك هنا ..."
                            value={formData.Message}
                            onChange={handleInputChange}
                            rows="4"
                            required
                            aria-label="الرسالة"
                        ></textarea>
                    </div>
                    <div className="form-submit">
                        <button type="submit" disabled={loading}>
                            {loading ? 'ارسال...' : 'ارسال الرسالة'} <span className="arrow">←</span>
                        </button>
                    </div>
                </form>
            </div>

            {/* Success Modal */}
            <Modal show={showSuccessModal} onHide={() => setShowSuccessModal(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title>نجاح</Modal.Title>
                </Modal.Header>
                <Modal.Body dir='rtl'>تم ارسال الرسالة بنجاح</Modal.Body>
                <Modal.Footer>
                    <Button variant="success" onClick={() => setShowSuccessModal(false)}>
                        اغلاق
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Error Modal */}
            <Modal show={showErrorModal} onHide={() => setShowErrorModal(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title>خطأ</Modal.Title>
                </Modal.Header>
                <Modal.Body dir='rtl'>{error}</Modal.Body>
                <Modal.Footer>
                    <Button variant="danger" onClick={() => setShowErrorModal(false)}>
                        اغلاق
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
};

export default FormContact;
