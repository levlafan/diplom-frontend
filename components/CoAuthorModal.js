"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import Image from "next/image";
import { useAuth } from "../src/context/AuthContext";
import { resolveStorageUrl } from "../src/utils/media";
import styles from "./CoAuthorModal.module.css";

export default function CoAuthorModal({ isOpen, selectedIds, onClose, onApply }) {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [allUsers, setAllUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [localSelected, setLocalSelected] = useState(selectedIds || []);

  const followerIds = (() => {
    if (!user?.id) return [];
    const raw = localStorage.getItem(`eiry_following_${user.id}`);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  })();

  // Загружаем всех пользователей только один раз при открытии модалки
  useEffect(() => {
    if (!isOpen) return;
    
    setIsLoading(true);
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
    axios
      .get(`${apiUrl}/users`)
      .then((res) => {
        const users = Array.isArray(res.data) ? res.data : [];
        setAllUsers(users);
      })
      .catch((err) => {
        console.error("Ошибка загрузки пользователей:", err);
        setAllUsers([]);
      })
      .finally(() => setIsLoading(false));
  }, [isOpen]);

  if (!isOpen) return null;

  // Сортируем: сначала подписчики, потом остальные
  const sortedUsers = [...allUsers].sort((a, b) => {
    const aFollower = followerIds.includes(a.id) ? 1 : 0;
    const bFollower = followerIds.includes(b.id) ? 1 : 0;
    return bFollower - aFollower;
  });
  
  // Фильтруем: исключаем текущего пользователя и применяем поиск
  const visibleUsers = sortedUsers.filter((item) => {
    // Исключаем текущего пользователя
    if (Number(item.id) === Number(user?.id)) return false;
    // Применяем поиск по имени
    if (search.trim() && !item.name?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  function toggleUser(userId) {
    setLocalSelected((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  }

  return (
    <div className={styles.overlay} onClick={onClose} role="presentation">
      <div className={styles.modal} onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true">
        <div className={styles.header}>
          <h3>Добавить соавтора</h3>
          <button type="button" className={styles.closeButton} onClick={onClose} aria-label="Закрыть">
            ×
          </button>
        </div>

        <input
          className={styles.search}
          type="text"
          placeholder="Поиск авторов..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />

        {isLoading ? (
          <div className={styles.loading}>Загрузка...</div>
        ) : visibleUsers.length === 0 ? (
          <div className={styles.empty}>
            {search ? "Пользователи не найдены" : "Нет доступных пользователей"}
          </div>
        ) : (
          <div className={styles.list}>
            {visibleUsers.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`${styles.row} ${localSelected.includes(item.id) ? styles.rowSelected : ""}`}
                onClick={() => toggleUser(item.id)}
              >
                <Image
                  src={resolveStorageUrl(item.avatar)}
                  alt={item.name}
                  width={40}
                  height={40}
                  className={styles.avatar}
                  unoptimized
                />
                <div className={styles.rowText}>
                  <p>{item.name}</p>
                  {followerIds.includes(item.id) && <span>Подписчик</span>}
                </div>
                <span className={localSelected.includes(item.id) ? styles.selected : styles.select}>
                  {localSelected.includes(item.id) ? "Выбрано" : "Выбрать"}
                </span>
              </button>
            ))}
          </div>
        )}

        <div className={styles.footer}>
          <button type="button" className={styles.cancelButton} onClick={onClose}>
            Отмена
          </button>
          <button
            type="button"
            className={styles.applyButton}
            onClick={() => onApply(localSelected)}
          >
            Применить соавторов ({localSelected.length})
          </button>
        </div>
      </div>
    </div>
  );
}