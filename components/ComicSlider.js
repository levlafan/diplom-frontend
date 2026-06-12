"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { resolveStorageUrl } from "../src/utils/media";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";
import styles from "./ComicSlider.module.css";

export default function HeroSlider({ posts = [], spots = [] }) {
  // Только оплаченные — берём post из spot
  const paidSpots = spots
  .filter(s => s?.is_active && s?.post)
  .map(s => s.post)
  .filter(Boolean);

// Убираем дубликаты по id
const uniqueComics = [];
const seenIds = new Set();
for (const comic of paidSpots) {
  if (!seenIds.has(comic.id)) {
    seenIds.add(comic.id);
    uniqueComics.push(comic);
  }
}

const comics = uniqueComics.slice(0, 8);



  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const intervalRef = useRef(null);

  const startInterval = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setCurrent(prev => (prev + 1) % comics.length);
    }, 5000);
  };

  useEffect(() => {
    if (comics.length === 0) return;
    startInterval();
    return () => clearInterval(intervalRef.current);
  }, [comics.length]);

  useEffect(() => {
    if (paused) clearInterval(intervalRef.current);
    else startInterval();
    return () => clearInterval(intervalRef.current);
  }, [paused]);

  if (comics.length === 0) {
    return (
      <div className={styles.slider}>
        <div className={styles.emptySlider}>
          <h2>Место в слайдере</h2>
          <p>Купи место для своего комикса!</p>
          <Link href="/wallet" className={styles.buyBtn}>Купить место</Link>
        </div>
      </div>
    );
  }

  const comic = comics[current];

  return (
    <div 
      className={styles.slider}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {comics.length > 1 && (
        <>
          <button className={styles.navLeft} onClick={() => setCurrent(c => (c - 1 + comics.length) % comics.length)}>
            <ChevronLeft size={28} />
          </button>
          <button className={styles.navRight} onClick={() => setCurrent(c => (c + 1) % comics.length)}>
            <ChevronRight size={28} />
          </button>
        </>
      )}

      <div className={styles.slide}>
        <div className={styles.imageWrap}>
          <Image
            src={resolveStorageUrl(comic.cover_path)}
            alt={comic.title}
            fill
            className={styles.image}
            sizes="(max-width: 768px) 100vw, 600px"
            priority
            unoptimized
          />
        </div>

        <div className={styles.info}>
          <div className={styles.tags}>
            {(comic.tags || []).slice(0, 2).map(tag => (
              <span key={tag} className={styles.tag}>{tag}</span>
            ))}
          </div>
          <h1 className={styles.title}>{comic.title}</h1>

          <div className={styles.rating}>
            {[1,2,3,4,5].map(star => (
              <Star
                key={star}
                size={16}
                fill={star <= Math.round(comic.avg_rating || 0) ? "var(--accent)" : "none"}
                color={star <= Math.round(comic.avg_rating || 0) ? "var(--accent)" : "#666"}
              />
            ))}
            <span className={styles.ratingNum}>
              {Number(comic.avg_rating || 0).toFixed(1)}/5.0
            </span>
          </div>

          <p className={styles.description}>
            {comic.content || "Описание отсутствует."}
          </p>

          <div className={styles.actions}>
            <Link href={`/comic/${comic.id}`} className={styles.readBtn}>
              Читать сейчас
            </Link>
          </div>
        </div>
      </div>

      <div className={styles.dots}>
        {comics.map((_, i) => (
          <button
            key={i}
            className={`${styles.dot} ${i === current ? styles.dotActive : ""}`}
            onClick={() => setCurrent(i)}
          />
        ))}
      </div>
    </div>
  );
}