"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { Star } from "lucide-react";
import styles from "./StarRating.module.css";

export default function StarRating({ postId, initialRating = 0, initialCount = 0, token, onRated }) {
  const [rating, setRating] = useState(Number(initialRating) || 0);
  const [count, setCount] = useState(Number(initialCount) || 0);
  const [hover, setHover] = useState(0);
  const [userRating, setUserRating] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setRating(Number(initialRating) || 0);
    setCount(Number(initialCount) || 0);
  }, [initialRating, initialCount]);

  const rate = async (value) => {
    if (!token) return;
    setIsSubmitting(true);
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
    try {
      const res = await axios.post(
        `${apiUrl}/posts/${postId}/rate`,
        { rating: value },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setRating(Number(res.data.avg_rating) || 0);
      setCount(Number(res.data.ratings_count) || 0);
      setUserRating(value);
      onRated?.(res.data);
    } catch {
      /* ignore */
    } finally {
      setIsSubmitting(false);
    }
  };

  const displayValue = hover || userRating || Math.round(rating);

  return (
    <div className={styles.wrap}>
      <p className={styles.label}>Оцените комикс</p>
      <div className={styles.stars} onMouseLeave={() => setHover(0)}>
        {[1, 2, 3, 4, 5].map((star) => {
          const filled = star <= displayValue;
          return (
            <button
              key={star}
              type="button"
              className={`${styles.starBtn} ${filled ? styles.starFilled : ""}`}
              disabled={!token || isSubmitting}
              title={token ? `Оценить на ${star}` : "Войдите, чтобы оценить"}
              onClick={() => rate(star)}
              onMouseEnter={() => token && setHover(star)}
            >
              <Star size={28} fill={filled ? "currentColor" : "none"} strokeWidth={1.5} />
            </button>
          );
        })}
      </div>
      <p className={styles.meta}>
        <strong>{Number(rating).toFixed(1)}</strong>
        <span> / 5</span>
        <span className={styles.dot}>·</span>
        <span>{count} {count === 1 ? "оценка" : count >= 2 && count <= 4 ? "оценки" : "оценок"}</span>
      </p>
      {!token && <p className={styles.hint}>Войдите, чтобы поставить оценку</p>}
    </div>
  );
}
