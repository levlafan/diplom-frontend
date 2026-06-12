"use client";

import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import Link from "next/link";
import { adminHeaders, getApiUrl } from "../src/utils/adminApi";
import styles from "./AdminPanel.module.css";

export default function AdminUsers({ refreshKey, onChanged }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${getApiUrl()}/admin/users`, { headers: adminHeaders() });
      const rows = Array.isArray(res.data?.data) ? res.data.data : Array.isArray(res.data) ? res.data : [];
      setUsers(rows);
    } catch {
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  const toggleBan = async (user) => {
    const isBanned = Boolean(user.banned_at);
    const path = isBanned ? "unban" : "ban";
    if (!isBanned && !confirm(`Заблокировать ${user.name}?`)) return;
    try {
      await axios.post(`${getApiUrl()}/admin/users/${user.id}/${path}`, {}, {
        headers: adminHeaders(),
      });
      await load();
      onChanged?.();
    } catch (e) {
      alert(e?.response?.data?.message || "Ошибка");
    }
  };

  if (loading) return <p className={styles.empty}>Загрузка пользователей...</p>;

  return (
    <section className={styles.block}>
      <h2 className={styles.blockTitle}>Пользователи</h2>
      {users.length === 0 ? (
        <p className={styles.empty}>Нет пользователей</p>
      ) : (
        <div className={styles.scrollTable}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>ID</th>
                <th>Имя</th>
                <th>Email</th>
                <th>Комиксов</th>
                <th>Статус</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>{u.id}</td>
                  <td>
                    <Link href={`/profile/${u.id}`}>{u.name}</Link>
                  </td>
                  <td>{u.email || "—"}</td>
                  <td>{u.posts_count ?? 0}</td>
                  <td>
                    {u.banned_at ? (
                      <span className={`${styles.badge} ${styles.badgeBanned}`}>Заблокирован</span>
                    ) : (
                      <span className={`${styles.badge} ${styles.badgeOk}`}>Активен</span>
                    )}
                  </td>
                  <td>
                    <button
                      type="button"
                      className={`${styles.btn} ${u.banned_at ? styles.btnApprove : styles.btnBan}`}
                      onClick={() => toggleBan(u)}
                    >
                      {u.banned_at ? "Разблокировать" : "Заблокировать"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
