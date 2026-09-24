import React from "react";
import { Modal, Button, ProgressBar } from "react-bootstrap";

const LoadingModal = ({ show, onHide, uploadProgress }) => {
  return (
    <Modal show={show} onHide={onHide}>
      <Modal.Header>
        <Modal.Title>جارٍ رفع البيانات</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p>جاري رفع البيانات، الرجاء الانتظار...</p>
        <ProgressBar now={uploadProgress} label={`${uploadProgress}%`} />
      </Modal.Body>
    </Modal>
  );
};

const SuccessModal = ({ show, onHide, message }) => {
  return (
    <Modal show={show} onHide={onHide}>
      <Modal.Header closeButton>
        <Modal.Title>نجاح</Modal.Title>
      </Modal.Header>
      <Modal.Body>{message}</Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          إغلاق
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

const ErrorModal = ({ show, onHide, message }) => {
  return (
    <Modal show={show} onHide={onHide}>
      <Modal.Header closeButton>
        <Modal.Title>خطأ</Modal.Title>
      </Modal.Header>
      <Modal.Body>{message}</Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          إغلاق
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export { LoadingModal, SuccessModal, ErrorModal };
