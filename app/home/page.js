"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import axios from "axios";
import PostCard from "../../components/PostCard";
import ComicSlider from "../../components/ComicSlider";
import DailyRewardCalendar from "../../components/DailyRewardCalendar";
import { useAuth } from "../../src/context/AuthContext";
import styles from "./page.module.css";

export default function HomePage() {
  const { user, token } = useAuth();
  const [homeData, setHomeData] = useState({ slider_posts: [], top_readers: [], veterans: [] });
  const [posts, setPosts] = useState([]);
  const [sliderSpots, setSliderSpots] = useState([]);
  const [serverProgress, setServerProgress] = useState([]);
  const router = useRouter();
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

  useEffect(() => {
    fetch(`${apiUrl}/home/data`)
      .then((r) => r.json())
      .then((data) => {
        setHomeData({
          slider_posts: Array.isArray(data.slider_posts) ? data.slider_posts : [],
          top_readers: Array.isArray(data.top_readers) ? data.top_readers : [],
          veterans: Array.isArray(data.veterans) ? data.veterans : [],
        });
      })
      .catch(() => setHomeData({ slider_posts: [], top_readers: [], veterans: [] }));

    fetch(`${apiUrl}/posts`)
      .then((res) => res.json())
      .then((data) => {
        const rows = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
        setPosts(rows);
      })
      .catch(() => setPosts([]));

    fetch(`${apiUrl}/slider-spots`)
      .then(r => r.json())
      .then(data => setSliderSpots(data?.data || data || []))
      .catch(() => setSliderSpots([]));
  }, [apiUrl]);

  // Загружаем прогресс с сервера
  useEffect(() => {
    if (!user || !token) return;
    axios
      .get(`${apiUrl}/chapter-reads`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then((res) => {
        setServerProgress(res.data || []);
        // Синхронизируем с localStorage
        res.data.forEach((item) => {
          localStorage.setItem(
            `eiry_reader_progress_${item.post_id}`,
            JSON.stringify({
              chapter: item.chapter_number,
              page: item.page,
              mode: "horizontal"
            })
          );
        });
      })
      .catch(() => setServerProgress([]));
  }, [user, token, apiUrl]);

  // Чтение прогресса из localStorage + сервер
  const readingProgress = typeof window !== "undefined" && user
    ? posts.filter((p) => {
        const key = `eiry_reader_progress_${p.id}`;
        const data = localStorage.getItem(key);
        return data && JSON.parse(data)?.page > 0;
      }).slice(0, 3)
    : [];

  const newComics = [...posts].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 3);
  const popularComics = [...posts].sort((a, b) => (b.avg_rating || 0) - (a.avg_rating || 0)).slice(0, 6);

  const topReadersLimited = homeData.top_readers.slice(0, 10);
  const veteransLimited = homeData.veterans.slice(0, 10);

  return (
    <main className={styles.page}>
      <div className={styles.layout}>
        <div className={styles.mainContent}>
          <section className={styles.sliderSection}>
            <ComicSlider posts={posts} spots={sliderSpots} />
          </section>

          <section className={styles.dualSection}>
            {user && readingProgress.length > 0 && (
              <div className={styles.dualColumn}>
                <div className={styles.sectionHeader}>
                  <h2 className={styles.continueTitle}>Продолжить чтение</h2>
                  
                </div>
                <div className={styles.smallGrid}>
                  {readingProgress.map((post) => (
                    <PostCard key={`read-${post.id}`} post={post} showProgress />
                  ))}
                </div>
              </div>
            )}

            <div className={styles.dualColumn}>
              <div className={styles.sectionHeader}>
                <h2 className={`${styles.newTitle} ${!user ? styles.hasBlueBackground : ""}`}>
                  Новое
                </h2>
                <Link href="/feed" className={styles.viewAllBtn}>
                  Смотреть все
                </Link>
              </div>
              <div className={styles.smallGrid}>
                {newComics.map((post) => (
                  <PostCard key={`new-${post.id}`} post={post} />
                ))}
              </div>
            </div>
          </section>

          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.popularTitle}>Популярное</h2>
              <Link href="/feed?sort=rating" className={styles.viewAllBtn}>
                Смотреть все
              </Link>
            </div>
            <div className={styles.grid}>
              {popularComics.map((post) => (
                <div key={`pop-${post.id}`} className={styles.popularItem}>
                  <PostCard post={post} />
                </div>
              ))}
            </div>
          </section>

          <section className={styles.topsRow}>
            <div className={styles.topBlock}>
              <h3>Топ читателей</h3>
              <ul className={styles.topList}>
                {topReadersLimited.length === 0 && <li>— пока нет данных —</li>}
                {topReadersLimited.map((row, i) => (
                  <li key={row.user?.id || i}>
                    {row.user ? (
                      <Link href={`/profile/${row.user.id}`}>{row.user.name}</Link>
                    ) : (
                      "—"
                    )}
                    <span className={styles.topMeta}>{row.chapters_read} глав</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className={styles.topBlock}>
              <h3>Опытные</h3>
              <ul className={styles.topList}>
                {veteransLimited.length === 0 && <li>— нет пользователей —</li>}
                {veteransLimited.map((u) => (
                  <li key={u.id}>
                    <Link href={`/profile/${u.id}`}>{u.name}</Link>
                    <span className={styles.topMeta}>{new Date(u.created_at).toLocaleDateString("ru-RU")}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}