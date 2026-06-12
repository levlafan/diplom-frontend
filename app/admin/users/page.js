"use client";

import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { adminHeaders, getApiUrl } from "../../../src/utils/adminApi";
import styles from "./page.module.css";

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // 'all', 'active', 'banned'

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${getApiUrl()}/admin/users`, {
        headers: adminHeaders(),
      });
      const rows = res.data?.data?.data || res.data?.data || res.data;
      setUsers(Array.isArray(rows) ? rows : []);
    } catch (error) {
      console.error("Ошибка загрузки пользователей:", error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const toggleBan = async (user) => {
    const action = user.banned_at ? "unban" : "ban";
    const confirmMsg = user.banned_at
      ? `Разблокировать пользователя ${user.name}?`
      : `Заблокировать пользователя ${user.name}?`;
    
    if (!confirm(confirmMsg)) return;
    
    try {
      await axios.post(
        `${getApiUrl()}/admin/users/${user.id}/${action}`,
        {},
        { headers: adminHeaders() }
      );
      await loadUsers();
    } catch (error) {
      alert(error?.response?.data?.message || "Ошибка при выполнении действия");
    }
  };

  // Фильтрация по поиску и статусу
  const filteredUsers = users.filter((user) => {
    // Поиск по имени или email
    const matchesSearch = 
      user.name?.toLowerCase().includes(search.toLowerCase()) ||
      user.email?.toLowerCase().includes(search.toLowerCase());
    
    // Фильтр по статусу
    let matchesStatus = true;
    if (statusFilter === "active") {
      matchesStatus = !user.banned_at;
    } else if (statusFilter === "banned") {
      matchesStatus = !!user.banned_at;
    }
    
    return matchesSearch && matchesStatus;
  });

  // Статистика
  const activeCount = users.filter(u => !u.banned_at).length;
  const bannedCount = users.filter(u => u.banned_at).length;

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.empty}>Загрузка пользователей...</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Управление пользователями</h1>
        <p className={styles.subtitle}>Просмотр, блокировка и управление пользователями платформы</p>
      </div>

      <div className={styles.filtersRow}>
        <div className={styles.searchSection}>
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Поиск по имени или email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className={styles.statusFilters}>
          <button
            type="button"
            className={`${styles.statusBtn} ${statusFilter === "all" ? styles.statusActive : ""}`}
            onClick={() => setStatusFilter("all")}
          >
            Все ({users.length})
          </button>
          <button
            type="button"
            className={`${styles.statusBtn} ${statusFilter === "active" ? styles.statusActive : ""}`}
            onClick={() => setStatusFilter("active")}
          >
            Активны ({activeCount})
          </button>
          <button
            type="button"
            className={`${styles.statusBtn} ${statusFilter === "banned" ? styles.statusActive : ""}`}
            onClick={() => setStatusFilter("banned")}
          >
            Заблокированы ({bannedCount})
          </button>
        </div>
      </div>

      <div className={styles.tableWrapper}>
        {filteredUsers.length === 0 ? (
          <div className={styles.empty}>
            {search ? "Пользователи не найдены" : "Нет пользователей"}
          </div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>ID</th>
                <th>Пользователь</th>
                <th>Email</th>
                <th>Комиксов</th>
                <th>Статус</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.id}>
                  <td className={styles.userId}>{user.id}</td>
                  <td className={styles.userName}>
                    <span className={styles.userNameText}>{user.name}</span>
                  </td>
                  <td className={styles.userEmail}>{user.email || "—"}</td>
                  <td className={styles.userPosts}>{user.posts_count ?? 0}</td>
                  <td>
                    {user.banned_at ? (
                      <span className={`${styles.badge} ${styles.badgeBanned}`}>
                        Заблокирован
                      </span>
                    ) : (
                      <span className={`${styles.badge} ${styles.badgeActive}`}>
                        Активен
                      </span>
                    )}
                  </td>
                  <td>
                    <button
                      type="button"
                      className={`${styles.btn} ${user.banned_at ? styles.btnUnban : styles.btnBan}`}
                      onClick={() => toggleBan(user)}
                    >
                      {user.banned_at ? "Разблокировать" : "Заблокировать"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}