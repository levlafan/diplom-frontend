"use client";

import { useMemo, useState } from "react";
import axios from "axios";
import Image from "next/image";
import imageCompression from "browser-image-compression";
import { useAuth } from "../src/context/AuthContext";
import { resolveStorageUrl } from "../src/utils/media";
import styles from "./ProfileSettingsModal.module.css";

async function compressToWebp(file, baseName = "avatar") {
  if (!file) return null;
  try {
    const compressed = await imageCompression(file, {
      maxSizeMB: 1,
      maxWidthOrHeight: 1024,
      useWebWorker: true,
      fileType: "image/webp",
      initialQuality: 0.8,
    });
    const safe = String(baseName || "avatar").replace(/[^\w\-]+/g, "_").slice(0, 60) || "avatar";
    const name = safe.toLowerCase().endsWith(".webp") ? safe : `${safe}.webp`;
    return new File([compressed], name, { type: "image/webp" });
  } catch {
    return file;
  }
}

export default function ProfileSettingsModal({ isOpen, onClose, onSaved }) {
  const { user, token, login } = useAuth();
  const apiUrl = useMemo(() => process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api", []);

  const [name, setName] = useState(user?.name || "");
  const [bio, setBio] = useState(user?.bio || "");
  const [avatarFile, setAvatarFile] = useState(null);
  const [status, setStatus] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const avatarPreview = useMemo(() => {
    if (avatarFile) return URL.createObjectURL(avatarFile);
    return resolveStorageUrl(user?.avatar);
  }, [avatarFile, user?.avatar]);

  if (!isOpen) return null;

  async function submit(e) {
    e.preventDefault();
    if (!token) return;

    try {
      setIsSubmitting(true);
      setStatus("");

      const formData = new FormData();
      formData.append("name", name.trim());
      formData.append("bio", bio);
      if (avatarFile) formData.append("avatar", avatarFile);

      const res = await axios.post(`${apiUrl}/auth/me`, formData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const updatedUser = res.data;
      login(updatedUser, token);
      if (onSaved) onSaved(updatedUser);
      onClose();
    } catch (err) {
      setStatus(err?.response?.data?.message || "Не удалось сохранить настройки.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="eiry-modal-overlay" onClick={onClose} role="presentation">
      <div className="eiry-modal eiry-modal--wide" onClick={(ev) => ev.stopPropagation()} role="dialog" aria-modal="true">
        <div className="eiry-modal-header">
          <h3>Настройки профиля</h3>
          <button type="button" className="eiry-modal-close" onClick={onClose} aria-label="Закрыть">×</button>
        </div>

        <form className={styles.body} onSubmit={submit}>
          <div className={styles.avatarRow}>
            <Image src={avatarPreview} alt="Аватар" width={72} height={72} className={styles.avatar} unoptimized />
            <div className={styles.avatarMeta}>
              <label className={styles.fileButton}>
                Загрузить аватар (WebP ≤ 1MB)
                <input
                  type="file"
                  accept="image/*"
                  onChange={async (e) => {
                    const f = e.target.files?.[0] || null;
                    if (!f) return;
                    setStatus("Сжатие аватара...");
                    const webp = await compressToWebp(f, "avatar");
                    setAvatarFile(webp);
                    setStatus("");
                  }}
                />
              </label>
              <p className={styles.help}>Картинка будет сжата в браузере и загружена в WebP.</p>
            </div>
          </div>

          <label className={styles.field}>
            <span>Никнейм</span>
            <input value={name} onChange={(e) => setName(e.target.value)} required />
          </label>

          <label className={styles.field}>
            <span>О себе</span>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              placeholder="Пару строк о себе..."
            />
          </label>

          <div className={styles.footer}>
            <button type="button" className={styles.secondary} onClick={onClose}>Отмена</button>
            <button type="submit" className={styles.primary} disabled={isSubmitting}>
              {isSubmitting ? "Сохранение..." : "Сохранить"}
            </button>
          </div>

          {status ? <p className={styles.status}>{status}</p> : null}
        </form>
      </div>
    </div>
  );
}