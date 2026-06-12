"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "../../src/context/AuthContext";
import styles from "./page.module.css";

function normalizePosts(payload) {
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload)) return payload;
  return [];
}

export default function SliderBuyPage() {
  const { token, user, login, isHydrated } = useAuth();
  const router = useRouter();
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
  const [prices, setPrices] = useState({ 1: 50, 7: 250, 30: 800 });
  const [posts, setPosts] = useState([]);
  const [postId, setPostId] = useState("");
  const [days, setDays] = useState(7);
  const [balance, setBalance] = useState(0);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    if (!isHydrated || !token) return;
    axios
      .get(`${apiUrl}/slider-spots/prices`)
      .then((r) => setPrices(r.data.prices || prices))
      .catch(() => {});
    axios
      .get(`${apiUrl}/wallet`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => setBalance(Number(r.data.balance || 0)))
      .catch(() => {});
    axios
      .get(`${apiUrl}/posts`)
      .then((r) => {
        const rows = normalizePosts(r.data);
        setPosts(rows.filter((p) => String(p.user_id) === String(user?.id)));
      })
      .catch(() => setPosts([]));
  }, [isHydrated, token, user?.id, apiUrl]);

  useEffect(() => {
    if (!isHydrated) return;
    if (!token) router.replace("/login");
  }, [isHydrated, token, router]);

  async function buy() {
    setMsg("");
    if (!postId) {
      setMsg("Выберите комикс");
      return;
    }
    try {
      const res = await axios.post(
        `${apiUrl}/slider-spots/purchase`,
        { post_id: Number(postId), days: Number(days) },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setBalance(Number(res.data.balance || 0));
      if (user) login({ ...user, wallet_balance: res.data.balance }, token);
      setMsg(`Куплено до ${new Date(res.data.expires_at).toLocaleString("ru-RU")}`);
    } catch (e) {
      const err = e?.response?.data;
      setMsg(err?.message || err?.errors?.wallet?.[0] || "Ошибка");
    }
  }

  if (!isHydrated) return null;

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        
        <section className={styles.card}>
          <h1>Место в слайдере</h1>
        <p className={styles.balance}>
          Баланс: <strong>{balance.toFixed(2)}</strong>
        </p>
        <p className={styles.prices}>
          Цены: 1 день — {prices[1]}, 7 дней — {prices[7]}, 30 дней — {prices[30]}
        </p>
        <label className={styles.field}>
          Комикс
          <select value={postId} onChange={(e) => setPostId(e.target.value)}>
            <option value="">— выберите —</option>
            {posts.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </select>
        </label>
        <label className={styles.field}>
          Срок
          <select value={days} onChange={(e) => setDays(Number(e.target.value))}>
            <option value={1}>1 день</option>
            <option value={7}>7 дней</option>
            <option value={30}>30 дней</option>
          </select>
        </label>
        <button type="button" className={styles.buy} onClick={buy}>
          Оплатить и разместить
        </button>
        {msg && <p className={styles.msg}>{msg}</p>}
        <Link href="/home" className={styles.back}>
          ← На главную
        </Link>
      </section>
      </div>
      
    </main>
  );
}
