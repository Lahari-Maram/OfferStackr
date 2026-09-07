import { AlertCircle, Trash2, Check } from "lucide-react";
import "../styles/modal.css";

export default function ConfirmModal({
  isOpen,
  title = "Confirm Action",
  message = "Are you sure you want to proceed?",
  confirmText = "Confirm",
  cancelText = "Cancel",
  type = "danger", // "danger", "warning", "info", "success"
  onConfirm,
  onCancel,
  loading = false,
}) {
  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case "danger":
        return <Trash2 className="modal-icon danger" size={24} />;
      case "warning":
        return <AlertCircle className="modal-icon warning" size={24} />;
      case "success":
        return <Check className="modal-icon success" size={24} />;
      default:
        return <AlertCircle className="modal-icon info" size={24} />;
    }
  };

  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="modal-header">
          <div className="modal-icon-wrap">{getIcon()}</div>
          <div className="modal-title-wrap">
            <h3>{title}</h3>
            <p>{message}</p>
          </div>
        </div>
        <div className="modal-actions">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onCancel}
            disabled={loading}
          >
            {cancelText}
          </button>
          <button
            type="button"
            className={`btn btn-${type === "danger" ? "danger" : "primary"}`}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? "Processing..." : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
