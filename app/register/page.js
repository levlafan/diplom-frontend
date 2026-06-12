"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { useAuth } from "../../src/context/AuthContext";
import styles from "../../styles/auth.module.css";

export default function RegisterPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function onSubmit(event) {
    event.preventDefault();
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

    try {
      setIsSubmitting(true);
      setMessage("");
      const response = await axios.post(`${apiUrl}/auth/register`, form);
      login(response.data.user, response.data.token);
      router.push("/");
      router.refresh();
    } catch (error) {
      setMessage(error?.response?.data?.message || "Ошибка регистрации.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className={styles.wrap}>
      <form className={styles.card} onSubmit={onSubmit}>
        <h1 className={styles.singup}>Регистрация</h1>

        <div className={styles.inputBox}>
          <input
            type="text"
            value={form.name}
            onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
            required
          />
          <span>Имя</span>
        </div>

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
      </form>
    </section>
  );
}