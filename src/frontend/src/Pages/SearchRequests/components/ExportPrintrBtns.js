import { FaFileExport, FaPrint } from "react-icons/fa";

const ExportPrintButtons = ({ selectedRequests, setIsModalOpen, setIsPrint }) => {
  if (selectedRequests.length === 0) return null;

  return (
    <div className="div-open-modal">
      <div className="flex items-center gap-4 justify-between">
        <button
          className="open-modal-button flex items-center gap-2"
          onClick={() => {
            setIsModalOpen(true);
            setIsPrint(false);
          }}
        >
          <FaFileExport />
          تصدير
        </button>

        <button
          className="open-modal-button flex items-center gap-2"
          onClick={() => {
            setIsModalOpen(true);
            setIsPrint(true);
          }}
        >
          <FaPrint />
          طباعة
        </button>
      </div>
    </div>
  );
};

export default ExportPrintButtons;
