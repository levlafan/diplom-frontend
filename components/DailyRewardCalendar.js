"use client";

import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../src/context/AuthContext";
import styles from "./DailyRewardCalendar.module.css";

const LS_KEY = "eiry_daily_reward_mirror";
const MODAL_SEEN_KEY = "eiry_daily_reward_modal_seen";
const COINS_PREVIEW = [1, 2, 3, 5, 7, 10];

export default function DailyRewardCalendar({ compact }) {
  const { token, user, login } = useAuth();
  const [status, setStatus] = useState(null);
  const [msg, setMsg] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

  const load = useCallback(() => {
    if (!token) {
      setStatus(null);
      setLoading(false);
      return;
    }
    axios
      .get(`${apiUrl}/daily-rewards/status`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => {
        setStatus(r.data);
        
        // Проверяем, нужно ли показать модальное окно
        const modalSeenToday = localStorage.getItem(MODAL_SEEN_KEY);
        const today = new Date().toDateString();
        
        // Если можно получить награду сегодня и модалка ещё не показывалась сегодня
        if (r.data.can_claim_today && modalSeenToday !== today) {
          setShowModal(true);
          localStorage.setItem(MODAL_SEEN_KEY, today);
        }
        
        try {
          localStorage.setItem(
            LS_KEY,
            JSON.stringify({
              streak: r.data.streak,
              last_claimed_at: r.data.last_claimed_at,
              free_unlock_credits: r.data.free_unlock_credits,
              synced_at: new Date().toISOString(),
            })
          );
        } catch {
          /* ignore */
        }
      })
      .catch(() => {
        setStatus(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [token, apiUrl]);

  useEffect(() => {
    load();
  }, [load]);

  const claim = async () => {
    setMsg("");
    if (!token) {
      setMsg("Войдите, чтобы забрать награду");
      return;
    }
    try {
      const res = await axios.post(`${apiUrl}/daily-rewards/claim`, {}, { headers: { Authorization: `Bearer ${token}` } });
      setStatus({
        streak: res.data.streak,
        last_claimed_at: res.data.last_claimed_at,
        can_claim_today: false,
        free_unlock_credits: res.data.free_unlock_credits,
        next_streak_if_claim: res.data.streak + 1 > 7 ? 1 : res.data.streak + 1,
      });
      
      if (user) {
        login(
          {
            ...user,
            wallet_balance: res.data.balance,
            free_unlock_credits: res.data.free_unlock_credits,
          },
          token
        );
      }
      
      let successMsg = "";
      if (res.data.free_unlock_granted) {
        successMsg = "🎁 7-й день: бесплатная разблокировка комикса!";
      } else if (res.data.coins_awarded) {
        successMsg = `+${res.data.coins_awarded} монет на баланс`;
      } else {
        successMsg = "Награда получена";
      }
      setMsg(successMsg);
      
      // Закрываем модалку после успешного получения
      setTimeout(() => {
        setShowModal(false);
      }, 2000);
      
      try {
        localStorage.setItem(
          LS_KEY,
          JSON.stringify({
            streak: res.data.streak,
            last_claimed_at: res.data.last_claimed_at,
            free_unlock_credits: res.data.free_unlock_credits,
            synced_at: new Date().toISOString(),
          })
        );
      } catch {
        /* ignore */
      }
    } catch (e) {
      setMsg(e?.response?.data?.message || "Ошибка");
    }
  };

  const closeModal = () => {
    setShowModal(false);
  };

  const streak = status?.streak ?? 0;
  const credits = status?.free_unlock_credits ?? 0;
  const can = Boolean(token && status?.can_claim_today);

  return (
    <>
      <section className={`${styles.wrap} ${compact ? styles.compact : ""}`}>
        <h3 className={styles.title}>Календарь входа</h3>
        <p className={styles.sub}>
          Серия: {streak} {credits > 0 && <>· Бесплатных разблокировок: {credits}</>}
        </p>
        <div className={styles.days}>
          {[1, 2, 3, 4, 5, 6].map((d) => (
            <div key={d} className={`${styles.day} ${streak >= d && streak < 7 ? styles.dayDone : ""}`}>
              <span className={styles.dayNum}>{d}</span>
              <span className={styles.coin}>+{COINS_PREVIEW[d - 1]}</span>
            </div>
          ))}
          <div className={`${styles.day} ${styles.dayGift} ${credits > 0 ? styles.dayDone : streak >= 7 ? styles.dayDone : ""}`}>
            <span className={styles.dayNum}>7</span>
            <span className={styles.coin}>🎁</span>
          </div>
        </div>
        <button type="button" className={styles.claimBtn} disabled={!can} onClick={claim}>
          {can ? "Забрать награду" : token ? "Уже сегодня" : "Войти"}
        </button>
        {msg && <p className={styles.msg}>{msg}</p>}
        <p className={styles.hint}>Пропуск дня сбрасывает серию. Данные дублируются в браузере после синхронизации.</p>
      </section>

      {/* Модальное окно */}
      {showModal && (
        <div className={styles.modalOverlay} onClick={closeModal}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <button className={styles.modalClose} onClick={closeModal}>×</button>
            
            <div className={styles.modalIcon}>🎁</div>
            <h2 className={styles.modalTitle}>Ежедневная награда!</h2>
            <p className={styles.modalText}>
              Вы можете получить награду за {streak + 1}-й день подряд!
            </p>
            
            <div className={styles.modalReward}>
              {streak + 1 === 7 ? (
                <>
                  <span className={styles.rewardIcon}>🎁</span>
                  <span>Бесплатная разблокировка комикса!</span>
                </>
              ) : (
                <>
                  <span className={styles.rewardIcon}>🪙</span>
                  <span>+{COINS_PREVIEW[Math.min(streak, COINS_PREVIEW.length - 1)]} монет</span>
                </>
              )}
            </div>
            
            <div className={styles.modalButtons}>
              <button className={styles.modalClaimBtn} onClick={claim}>
                Забрать награду
              </button>
              <button className={styles.modalLaterBtn} onClick={closeModal}>
                Позже
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}