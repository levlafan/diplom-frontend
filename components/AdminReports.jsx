"use client";

import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { adminHeaders, getApiUrl } from "../src/utils/adminApi";
import styles from "./AdminPanel.module.css";

const REASON_LABELS = {
  spam: "Спам",
  violence: "Жестокий контент",
  copyright: "Авторские права",
  hate: "Ненависть",
  other: "Другое",
};

export default function AdminReports({ refreshKey, onChanged }) {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${getApiUrl()}/admin/reports/recent`, {
        headers: adminHeaders(),
      });
      setReports(Array.isArray(res.data) ? res.data : []);
    } catch {
      setReports([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  const act = async (id, action) => {
    const paths = { approve: "approve", reject: "reject", ban: "ban" };
    try {
      await axios.post(`${getApiUrl()}/admin/reports/${id}/${paths[action]}`, {}, {
        headers: adminHeaders(),
      });
      await load();
      onChanged?.();
    } catch (e) {
      alert(e?.response?.data?.message || "Ошибка");
    }
  };

  if (loading) return <p className={styles.empty}>Загрузка жалоб...</p>;

  return (
    <section className={styles.block}>
      <h2 className={styles.blockTitle}>Последние жалобы</h2>
      {reports.length === 0 ? (
        <p className={styles.empty}>Нет ожидающих жалоб</p>
      ) : (
        <div className={styles.scrollTable}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Кто</th>
                <th>Объект</th>
                <th>Причина</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((r) => (
                <tr key={r.id}>
                  <td>{r.reporter?.name || "—"}</td>
                  <td>
                    {r.post?.title && <div>📖 {r.post.title}</div>}
                    {r.reported_user?.name && <div>👤 {r.reported_user.name}</div>}
                  </td>
                  <td>{REASON_LABELS[r.reason] || r.reason}</td>
                  <td>
                    <div className={styles.rowActions}>
                      <button type="button" className={`${styles.btn} ${styles.btnApprove}`} onClick={() => act(r.id, "approve")}>
                        Одобрить
                      </button>
                      <button type="button" className={`${styles.btn} ${styles.btnReject}`} onClick={() => act(r.id, "reject")}>
                        Отклонить
                      </button>
                      <button type="button" className={`${styles.btn} ${styles.btnBan}`} onClick={() => act(r.id, "ban")}>
                        Забанить
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
