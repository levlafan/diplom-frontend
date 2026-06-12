"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { io } from "socket.io-client";
import { Bell } from "lucide-react";
import styles from "./NotificationBadge.module.css";

export default function NotificationBell({ userId }) {
  const [count, setCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const token = typeof window !== "undefined" ? localStorage.getItem("eiry_token") : null;
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

  // Подключение к Socket.io
  useEffect(() => {
    if (!userId) return;
    const socket = io("http://localhost:4000");
    socket.emit("join", userId);
    socket.on("new_notification", (notif) => {
      setList((prev) => [notif, ...prev]);
      setCount((prev) => prev + 1);
    });
    return () => socket.disconnect();
  }, [userId]);

  // Загрузка количества непрочитанных
  const loadCount = async () => {
    if (!token) return;
    try {
      const response = await axios.get(`${apiUrl}/notifications/unread-count`, { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      setCount(response.data.count);
    } catch (error) {
      console.error("Error loading count:", error);
    }
  };

  // Загрузка списка уведомлений
  const loadList = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const response = await axios.get(`${apiUrl}/notifications`, { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      // Обработка пагинированного ответа
      const notifications = response.data.data || response.data;
      setList(notifications);
    } catch (error) {
      console.error("Error loading list:", error);
    } finally {
      setLoading(false);
    }
  };

  // Загрузка начального счетчика
  useEffect(() => {
    loadCount();
    const interval = setInterval(loadCount, 30000);
    return () => clearInterval(interval);
  }, [token]);

  // Отметка одного уведомления как прочитанного
  const markAsRead = async (id) => {
    try {
      await axios.post(`${apiUrl}/notifications/${id}/read`, {}, { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      return true;
    } catch (error) {
      console.error("Error marking as read:", error);
      return false;
    }
  };

  // Отметка всех как прочитанных
  const markAllAsRead = async () => {
    try {
      await axios.post(`${apiUrl}/notifications/read-all`, {}, { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      // Обновляем данные после отметки
      await Promise.all([loadCount(), loadList()]);
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  };

  // Обработка клика по уведомлению
  const handleNotificationClick = async (notification) => {
    // Закрываем дропдаун
    setOpen(false);
    
    // Если уведомление еще не прочитано, отмечаем его как прочитанное
    if (!notification.is_read) {
      await markAsRead(notification.id);
      // Обновляем счетчик после отметки
      await loadCount();
      // Обновляем список, помечая это уведомление как прочитанное
      setList(prev => prev.map(n => 
        n.id === notification.id ? { ...n, is_read: true } : n
      ));
    }
    
    // Редирект по ссылке
    const data = notification.data;
    if (!data) return;
    
    if (data.post_id) {
      window.location.href = `/comic/${data.post_id}`;
    } else if (data.from_user_id) {
      window.location.href = `/profile/${data.from_user_id}`;
    } else if (data.ad_id) {
      window.location.href = `/collaboration/${data.ad_id}`;
    }
  };

  // Переключение дропдауна
  const toggleDropdown = async () => {
    if (!open) {
      // При открытии загружаем свежие данные
      await Promise.all([loadList(), loadCount()]);
    }
    setOpen(!open);
  };

  return (
    <div className={styles.bellWrap}>
      <button className={styles.bell} onClick={toggleDropdown}>
        <Bell size={18} />
        {count > 0 && <span className={styles.badge}>{count}</span>}
      </button>
      
      {open && (
        <div className={styles.dropdown} role="dialog" aria-label="Уведомления">
          <div className={styles.dropdownHeader}>
            <span className={styles.dropdownTitle}>Уведомления</span>
            <button
              type="button"
              className={styles.dropdownClose}
              aria-label="Закрыть"
              onClick={() => setOpen(false)}
            >
              ×
            </button>
          </div>

          {loading ? (
            <p className={styles.empty}>Загрузка...</p>
          ) : list.length === 0 ? (
            <p className={styles.empty}>Нет уведомлений</p>
          ) : (
            <>
              {count > 0 && (
                <button onClick={markAllAsRead} className={styles.markAllRead}>
                  Отметить все как прочитанные ({count})
                </button>
              )}

              <div className={styles.list}>
                {list.map((notification) => (
                  <div
                    key={notification.id}
                    className={`${styles.item} ${!notification.is_read ? styles.unread : ""}`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className={styles.itemContent}>
                      <p className={styles.itemText}>
                        {notification.data?.message || notification.message || notification.type}
                      </p>
                      <span className={styles.itemTime}>
                        {new Date(notification.created_at).toLocaleString("ru-RU", {
                          day: "numeric",
                          month: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    {!notification.is_read && <div className={styles.unreadDot} />}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}