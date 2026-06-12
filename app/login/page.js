"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { useAuth } from "../../src/context/AuthContext";
import styles from "../../styles/auth.module.css";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function onSubmit(event) {
    event.preventDefault();
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

    try {
      setIsSubmitting(true);
      setMessage("");
      const response = await axios.post(`${apiUrl}/auth/login`, form);
      login(response.data.user, response.data.token);
      router.push("/");
      router.refresh();
    } catch (error) {
      setMessage(error?.response?.data?.message || "Ошибка входа.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className={styles.wrap}>
      <form className={styles.card} onSubmit={onSubmit}>
        <h1 className={styles.singup}>Вход</h1>

        <div className={styles.inputBox}>
          <input
            type="email"
            value={form.email}
            onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
            required
          />
          <span>Email</span>
        </div>

        <div className={styles.inputBox}>
          <input
            type="password"
            value={form.password}
            onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
            required
          />
          <span>Пароль</span>
        </div>

        {message ? <p className={styles.message}>{message}</p> : null}

        <button type="submit" className={styles.enter} disabled={isSubmitting}>
          {isSubmitting ? "Загрузка..." : "Войти"}
        </button>

        <div className={styles.divider}>
          <span>или</span>
        </div>

        <button
          type="button"
          className={styles.yandexBtn}
          onClick={() => window.location.href = 'http://localhost:8000/api/auth/yandex'}
        >
         
          Войти через Яндекс
        </button>
      </form>
    </section>
  );
}