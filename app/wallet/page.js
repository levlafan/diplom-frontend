"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import Link from "next/link";
import { useAuth } from "../../src/context/AuthContext";
import { useRouter } from "next/navigation";
import { CreditCard, CheckCircle, XCircle, Loader2, Coins, ArrowRight } from "lucide-react";
import styles from "./page.module.css";

export default function WalletPage() {
  const { token, user, login, isHydrated } = useAuth();
  const router = useRouter();
  const [balance, setBalance] = useState(0);
  const [amount, setAmount] = useState("500");
  const [status, setStatus] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [step, setStep] = useState("idle"); // idle, processing, success, error
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

  useEffect(() => {
    if (!isHydrated) return;
    if (!token) {
      router.replace("/login");
      return;
    }
    axios
      .get(`${apiUrl}/wallet`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => setBalance(Number(r.data.balance || 0)))
      .catch(() => setBalance(Number(user?.wallet_balance || 0)));
  }, [isHydrated, token, user, router, apiUrl]);

  async function deposit() {
    if (isProcessing) return;
    if (!amount || Number(amount) <= 0) {
      setStatus("Введите корректную сумму");
      return;
    }

    setStatus("");
    setIsProcessing(true);
    setStep("processing");

    // Имитация процесса платежа
    await new Promise((resolve) => setTimeout(resolve, 1500));

    try {
      const res = await axios.post(
        `${apiUrl}/wallet/deposit`,
        { amount: Number(amount) },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setBalance(Number(res.data.balance || 0));
      if (user) login({ ...user, wallet_balance: res.data.balance }, token);
      setStep("success");
      setStatus("Баланс успешно пополнен!");
    } catch (e) {
      setStep("error");
      setStatus(e?.response?.data?.message || "Ошибка пополнения");
    } finally {
      setIsProcessing(false);
      // Сброс шага через 3 секунды
      setTimeout(() => setStep("idle"), 3000);
    }
  }

  if (!isHydrated) return null;

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <h1 className={styles.title}>Кошелёк</h1>

        <div className={styles.balanceCard}>
          <div className={styles.balanceIcon}>
            <Coins size={32} />
          </div>
          <div className={styles.balanceInfo}>
            <p className={styles.balanceLabel}>Текущий баланс</p>
            <p className={styles.balanceAmount}>
              <strong>{balance.toFixed(2)}</strong>
            </p>
          </div>
        </div>

        <div className={styles.paymentCard}>
          <h3 className={styles.paymentTitle}>Пополнение кошелька</h3>
          <div className={styles.inputRow}>
            <div className={styles.inputGroup}>
              <label className={styles.inputLabel}>Сумма</label>
              <div className={styles.inputWrapper}>
                <input
                  className={styles.input}
                  type="number"
                  min={1}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  disabled={isProcessing}
                  placeholder="100"
                />
              </div>
            </div>
            <button
              type="button"
              className={styles.primaryButton}
              onClick={deposit}
              disabled={isProcessing || !amount || Number(amount) <= 0}
            >
              {isProcessing ? (
                <>
                  <Loader2 size={18} className={styles.spinner} />
                  Обработка...
                </>
              ) : step === "success" ? (
                <>
                  <CheckCircle size={18} />
                  Успешно
                </>
              ) : step === "error" ? (
                <>
                  <XCircle size={18} />
                  Ошибка
                </>
              ) : (
                <>
                  <CreditCard size={18} />
                  Пополнить
                </>
              )}
            </button>
          </div>

          {status && (
            <div className={`${styles.statusMessage} ${step === "success" ? styles.statusSuccess : step === "error" ? styles.statusError : ""}`}>
              {step === "success" && <CheckCircle size={18} />}
              {step === "error" && <XCircle size={18} />}
              <span>{status}</span>
            </div>
          )}

          <div className={styles.hint}>
            <p>💡 Платёж имитируется — средства зачисляются мгновенно.</p>
          </div>
        </div>

        <div className={styles.actions}>
          <Link href="/feed" className={styles.secondaryButton}>
            ← В каталог
          </Link>
          <Link href="/create-comic" className={styles.primaryButton}>
            Создать комикс <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </main>
  );
}