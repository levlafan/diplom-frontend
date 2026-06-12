"use client";

import { useState } from "react";
import axios from "axios";
import { X, Paperclip, AlertTriangle, CheckCircle } from "lucide-react";
import styles from "./ReportModal.module.css";

const REASONS = [
  { value: "spam", label: "Спам" },
  { value: "violence", label: "Жестокий контент" },
  { value: "copyright", label: "Нарушение авторских прав" },
  { value: "hate", label: "Разжигание ненависти" },
  { value: "other", label: "Другое" },
];

export default function ReportModal({ isOpen, onClose, postId, postTitle, userId, userName }) {
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [screenshot, setScreenshot] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const token = typeof window !== "undefined" ? localStorage.getItem("eiry_token") : null;
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

  if (!isOpen) return null;

  const submit = async (e) => {
    e.preventDefault();
    if (!reason) {
      alert("Выберите причину");
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      if (postId) formData.append("post_id", postId);
      if (userId) formData.append("reported_user_id", userId);
      formData.append("reason", reason);
      if (details.trim()) formData.append("details", details.trim());
      if (screenshot) formData.append("screenshot", screenshot);

      await axios.post(`${apiUrl}/reports`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });
      setSubmitted(true);
    } catch (err) {
      alert("Ошибка отправки: " + (err?.response?.data?.message || err.message));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <AlertTriangle size={20} className={styles.headerIcon} />
            <h3 className={styles.title}>Пожаловаться</h3>
          </div>
          <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Закрыть">
            <X size={20} />
          </button>
        </div>

        {submitted ? (
          <div className={styles.success}>
            <CheckCircle size={48} className={styles.successIcon} />
            <p className={styles.successText}>✅ Жалоба отправлена.</p>
            <p className={styles.successSub}>Администратор рассмотрит её в ближайшее время.</p>
            <button type="button" className={styles.successBtn} onClick={onClose}>
              Закрыть
            </button>
          </div>
        ) : (
          <form className={styles.form} onSubmit={submit}>
            

            <div className={styles.field}>
              <label className={styles.label}>Причина</label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                required
                className={styles.select}
              >
                <option value="">Выберите...</option>
                {REASONS.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Опишите нарушение</label>
              <textarea
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                rows={3}
                placeholder="Подробности..."
                className={styles.textarea}
              />
            </div>

            <div className={styles.field}>
              <label className={styles.fileLabel}>
                <Paperclip size={14} />
                <span>Прикрепить скриншот</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setScreenshot(e.target.files?.[0] || null)}
                  className={styles.fileInput}
                />
              </label>
              {screenshot && (
                <div className={styles.filePreview}>
                  <span className={styles.fileName}>📎 {screenshot.name}</span>
                  <button
                    type="button"
                    className={styles.fileRemove}
                    onClick={() => setScreenshot(null)}
                  >
                    ×
                  </button>
                </div>
              )}
            </div>

            <button
              type="submit"
              className={styles.submitBtn}
              disabled={isSubmitting || !reason}
            >
              {isSubmitting ? "Отправка..." : "Отправить жалобу"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}