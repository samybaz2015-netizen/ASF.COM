const Modal = ({ isOpen, onClose, onExport, onPrint, isPrint }) =>
  isOpen && (
    <div className="modal-open">
      <div className="modal-content">
        <h2>{isPrint ? "طباعة البيانات" : "تصدير البيانات"}</h2>
        <p>
          {isPrint
            ? "هل أنت متأكد أنك تريد طباعة الطلبات المحددة؟"
            : "هل أنت متأكد أنك تريد تصدير الطلبات المحددة إلى Excel؟"}
        </p>
        {isPrint ? (
          <button
            className="bg-indigo-400 text-white  rounded-md py-2 my-1 px-5"
            onClick={onPrint}
          >
            طباعة
          </button>
        ) : (
          <button className="export-button" onClick={onExport}>
            تصدير
          </button>
        )}
        <button className="close-modal-button" onClick={onClose}>
          إغلاق
        </button>
      </div>
    </div>
  );

export default Modal;
