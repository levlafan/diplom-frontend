"use client";

import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import AdminStats from "../../components/AdminStats";
import AdminReports from "../../components/AdminReports";
import AdminUsers from "../../components/AdminUsers";
import AdminComics from "../../components/AdminComics";
import { adminHeaders, getApiUrl } from "../../src/utils/adminApi";
import styles from "./page.module.css";

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const loadStats = useCallback(async () => {
    try {
      const res = await axios.get(`${getApiUrl()}/admin/stats`, { headers: adminHeaders() });
      setStats(res.data);
    } catch {
      setStats(null);
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats, refreshKey]);

  const onChanged = () => {
    setRefreshKey((k) => k + 1);
  };

  return (
    <div className={styles.dashboard}>
      <header className={styles.header}>
        <h1>Дашборд администратора</h1>
        <p>Управление контентом, пользователями и жалобами</p>
      </header>

      <AdminStats stats={stats} />
      <AdminReports refreshKey={refreshKey} onChanged={onChanged} />
      <AdminUsers refreshKey={refreshKey} onChanged={onChanged} />
      <AdminComics refreshKey={refreshKey} onChanged={onChanged} />
    </div>
  );
}
