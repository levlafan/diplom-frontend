"use client";

import UploadForm from "./UploadForm";

export default function UploadModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="eiry-modal-overlay" onClick={onClose} role="presentation">
      <div
        className="eiry-modal"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="upload-modal-title"
      >
        <div className="eiry-modal-header">
          <h2 id="upload-modal-title">Создать публикацию</h2>
          <button type="button" onClick={onClose} className="eiry-modal-close" aria-label="Закрыть">
            ×
          </button>
        </div>
        <UploadForm onSuccess={onClose} />
      </div>
    </div>
  );
}
