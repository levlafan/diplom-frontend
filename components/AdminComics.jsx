"use client";

import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import Link from "next/link";
import { adminHeaders, getApiUrl } from "../src/utils/adminApi";
import styles from "./AdminPanel.module.css";

const STATUS_LABELS = {
  approved: "Опубликован",
  pending: "На модерации",
  rejected: "Скрыт",
};

export default function AdminComics({ refreshKey, onChanged }) {
  const [comics, setComics] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${getApiUrl()}/admin/comics`, { headers: adminHeaders() });
      const rows = Array.isArray(res.data?.data) ? res.data.data : Array.isArray(res.data) ? res.data : [];
      setComics(rows);
    } catch {
      setComics([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  const hideComic = async (id) => {
    if (!confirm("Скрыть комикс с сайта?")) return;
    try {
      await axios.post(`${getApiUrl()}/admin/comics/${id}/hide`, {}, { headers: adminHeaders() });
      await load();
      onChanged?.();
    } catch (e) {
      alert(e?.response?.data?.message || "Ошибка");
    }
  };

  const deleteComic = async (id) => {
    if (!confirm("Удалить комикс безвозвратно?")) return;
    try {
      await axios.delete(`${getApiUrl()}/admin/comics/${id}`, { headers: adminHeaders() });
      await load();
      onChanged?.();
    } catch (e) {
      alert(e?.response?.data?.message || "Ошибка");
    }
  };

  if (loading) return <p className={styles.empty}>Загрузка комиксов...</p>;

  return (
    <section className={styles.block}>
      <h2 className={styles.blockTitle}>Комиксы</h2>
      {comics.length === 0 ? (
        <p className={styles.empty}>Нет комиксов</p>
      ) : (
        <div className={styles.scrollTable}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Название</th>
                <th>Автор</th>
                <th>Глав</th>
                <th>Статус</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {comics.map((c) => (
                <tr key={c.id}>
                  <td>
                    <Link href={`/comic/${c.id}`}>{c.title}</Link>
                  </td>
                  <td>{c.user?.name || "—"}</td>
                  <td>{c.chapters_count ?? 0}</td>
                  <td>{STATUS_LABELS[c.status] || c.status}</td>
                  <td>
                    <div className={styles.rowActions}>
                      <button type="button" className={`${styles.btn} ${styles.btnHide}`} onClick={() => hideComic(c.id)}>
                        Скрыть
                      </button>
                      <button type="button" className={`${styles.btn} ${styles.btnReject}`} onClick={() => deleteComic(c.id)}>
                        Удалить
                      </button>
                    </div>
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
