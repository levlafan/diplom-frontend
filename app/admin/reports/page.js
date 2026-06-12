"use client";

import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { adminHeaders, getApiUrl } from "../../../src/utils/adminApi";
import styles from "./page.module.css";

const REASON_LABELS = {
  spam: "Спам",
  violence: "Жестокий контент",
  copyright: "Нарушение авторских прав",
  hate: "Разжигание ненависти",
  other: "Другое",
};

export default function AdminReportsPage() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const loadReports = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${getApiUrl()}/admin/reports`, {
        headers: adminHeaders(),
      });
      const rows = res.data?.data || res.data;
      setReports(Array.isArray(rows) ? rows : []);
    } catch (error) {
      console.error("Ошибка загрузки жалоб:", error);
      setReports([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  const resolve = async (id, action, actionLabel) => {
    if (!confirm(`Вы уверены, что хотите ${actionLabel}?`)) return;
    
    try {
      await axios.post(
        `${getApiUrl()}/admin/reports/${id}/resolve`,
        { action },
        { headers: adminHeaders() }
      );
      setReports((prev) => prev.filter((r) => r.id !== id));
    } catch (error) {
      alert(error?.response?.data?.message || "Ошибка при обработке жалобы");
    }
  };

  const getStatusBadge = (status) => {
    if (status === "resolved") {
      return <span className={`${styles.badge} ${styles.badgeResolved}`}>Решена</span>;
    }
    return <span className={`${styles.badge} ${styles.badgePending}`}>Ожидает</span>;
  };

  const filteredReports = reports.filter((report) => {
    // Фильтр по статусу
    if (statusFilter === "pending" && report.resolved_at) return false;
    if (statusFilter === "resolved" && !report.resolved_at) return false;
    
    // Поиск
    if (search) {
      const searchLower = search.toLowerCase();
      return (
        report.reporter?.name?.toLowerCase().includes(searchLower) ||
        report.post?.title?.toLowerCase().includes(searchLower) ||
        report.reported_user?.name?.toLowerCase().includes(searchLower) ||
        report.reason?.toLowerCase().includes(searchLower) ||
        report.details?.toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.empty}>Загрузка жалоб...</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Управление жалобами</h1>
        <p className={styles.subtitle}>Модерация контента и пользователей</p>
      </div>

      <div className={styles.filters}>
        <div className={styles.searchSection}>
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Поиск по жалобам..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className={styles.statusFilters}>
          <button
            type="button"
            className={`${styles.filterBtn} ${statusFilter === "all" ? styles.filterActive : ""}`}
            onClick={() => setStatusFilter("all")}
          >
            Все ({reports.length})
          </button>
          <button
            type="button"
            className={`${styles.filterBtn} ${statusFilter === "pending" ? styles.filterActive : ""}`}
            onClick={() => setStatusFilter("pending")}
          >
            Ожидают ({reports.filter(r => !r.resolved_at).length})
          </button>
          <button
            type="button"
            className={`${styles.filterBtn} ${statusFilter === "resolved" ? styles.filterActive : ""}`}
            onClick={() => setStatusFilter("resolved")}
          >
            Решены ({reports.filter(r => r.resolved_at).length})
          </button>
        </div>
      </div>

      {filteredReports.length === 0 ? (
        <div className={styles.empty}>
          {search ? "Жалобы не найдены" : "Нет жалоб"}
        </div>
      ) : (
        <div className={styles.reportsList}>
          {filteredReports.map((report) => (
            <div key={report.id} className={styles.reportCard}>
              <div className={styles.reportHeader}>
                <div className={styles.reportInfo}>
                  <span className={styles.reportId}>#{report.id}</span>
                  {getStatusBadge(report.resolved_at ? "resolved" : "pending")}
                  <span className={styles.reportDate}>
                    {new Date(report.created_at).toLocaleString("ru-RU")}
                  </span>
                </div>
              </div>

              <div className={styles.reportContent}>
                <div className={styles.reportRow}>
                  <span className={styles.reportLabel}>Отправитель:</span>
                  <span className={styles.reportValue}>
                    {report.reporter?.name || "—"}
                  </span>
                </div>

                <div className={styles.reportRow}>
                  <span className={styles.reportLabel}>Причина:</span>
                  <span className={`${styles.reportValue} ${styles.reportReason}`}>
                    {REASON_LABELS[report.reason] || report.reason}
                  </span>
                </div>

                {report.post && (
                  <div className={styles.reportRow}>
                    <span className={styles.reportLabel}>Комикс:</span>
                    <a
                      href={`/comic/${report.post.id}`}
                      target="_blank"
                      className={styles.reportLink}
                      rel="noopener noreferrer"
                    >
                      {report.post.title}
                    </a>
                  </div>
                )}

                {report.reported_user && (
                  <div className={styles.reportRow}>
                    <span className={styles.reportLabel}>Нарушитель:</span>
                    <a
                      href={`/profile/${report.reported_user.id}`}
                      target="_blank"
                      className={styles.reportLink}
                      rel="noopener noreferrer"
                    >
                      {report.reported_user.name}
                    </a>
                  </div>
                )}

                {report.details && (
                  <div className={styles.reportRow}>
                    <span className={styles.reportLabel}>Детали:</span>
                    <span className={styles.reportValue}>{report.details}</span>
                  </div>
                )}

                {report.screenshot && (
                  <div className={styles.reportRow}>
                    <span className={styles.reportLabel}>Скриншот:</span>
                    <a
                      href={`${getApiUrl()}/storage/${report.screenshot}`}
                      target="_blank"
                      className={styles.reportLink}
                      rel="noopener noreferrer"
                    >
                      Открыть
                    </a>
                  </div>
                )}
              </div>

              {!report.resolved_at && (
                <div className={styles.reportActions}>
                  <button
                    type="button"
                    className={`${styles.actionBtn} ${styles.actionDelete}`}
                    onClick={() => resolve(report.id, "delete_post", "удалить комикс")}
                  >
                    🗑️ Удалить комикс
                  </button>
                  <button
                    type="button"
                    className={`${styles.actionBtn} ${styles.actionBan}`}
                    onClick={() => resolve(report.id, "ban_user", "забанить пользователя")}
                  >
                    🚫 Забанить автора
                  </button>
                  <button
                    type="button"
                    className={`${styles.actionBtn} ${styles.actionDismiss}`}
                    onClick={() => resolve(report.id, "dismiss", "отклонить жалобу")}
                  >
                    ✓ Отклонить
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}