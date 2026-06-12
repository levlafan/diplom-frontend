"use client";

import styles from "./AdminPanel.module.css";

const LABELS = {
  users: "Пользователей",
  posts: "Комиксов",
  chapters: "Глав",
  comments: "Комментариев",
  reports: "Жалоб (ожидают)",
  pending: "На модерации",
};

export default function AdminStats({ stats }) {
  if (!stats) return <p className={styles.empty}>Загрузка статистики...</p>;

  const keys = ["users", "posts", "chapters", "comments", "reports", "pending"];

  return (
    <section className={styles.block}>
      <h2 className={styles.blockTitle}>Статистика</h2>
      <div className={styles.cards}>
        {keys.map((key) => (
          <div key={key} className={styles.statCard}>
            <span>{stats[key] ?? 0}</span>
            <small>{LABELS[key]}</small>
          </div>
        ))}
      </div>
    </section>
  );
}
