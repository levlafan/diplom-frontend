// components/AchievementsCarousel.jsx
"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import AchievementCard from "./AchievementCard";
import { ALL_ACHIEVEMENTS } from "../src/utils/achievements";
import styles from "./AchievementsCarousel.module.css";

export default function AchievementsCarousel({ userAchievements }) {
  const [scrollPosition, setScrollPosition] = useState(0);
  const [maxScroll, setMaxScroll] = useState(0);
  const containerRef = useRef(null);

  // Если userAchievements пуст или не массив, выходим
  if (!userAchievements || !Array.isArray(userAchievements)) {
    return (
      <div className={styles.empty}>
        <p>Пока нет полученных достижений</p>
        <p className={styles.emptyHint}>Продолжайте читать и создавать комиксы!</p>
      </div>
    );
  }

  // Получаем ID/type достижений, которые есть у пользователя
  const userAchievementIds = new Set(
    userAchievements.map(a => a.id || a.type)
  );

  // Находим ПОЛНЫЕ данные достижений из ALL_ACHIEVEMENTS, которые получены пользователем
  const unlockedAchievements = ALL_ACHIEVEMENTS.filter(ach => 
    userAchievementIds.has(ach.id)
  );

  console.log("Полученные достижения в карусели:", unlockedAchievements.length);
  console.log("ID полученных:", [...userAchievementIds]);

  useEffect(() => {
    if (containerRef.current) {
      const max = containerRef.current.scrollWidth - containerRef.current.clientWidth;
      setMaxScroll(max);
    }
  }, [unlockedAchievements]);

  const scroll = (direction) => {
    if (containerRef.current) {
      const scrollAmount = 300;
      const newPosition = direction === "left" 
        ? scrollPosition - scrollAmount 
        : scrollPosition + scrollAmount;
      
      containerRef.current.scrollTo({
        left: newPosition,
        behavior: "smooth"
      });
      setScrollPosition(newPosition);
    }
  };

  const handleScroll = () => {
    if (containerRef.current) {
      setScrollPosition(containerRef.current.scrollLeft);
    }
  };

  if (unlockedAchievements.length === 0) {
    return (
      <div className={styles.empty}>
        <p>Пока нет полученных достижений</p>
        <p className={styles.emptyHint}>Продолжайте читать и создавать комиксы!</p>
      </div>
    );
  }

  return (
    <div className={styles.carouselWrapper}>
      {scrollPosition > 0 && (
        <button className={`${styles.navBtn} ${styles.navLeft}`} onClick={() => scroll("left")}>
          <ChevronLeft size={20} />
        </button>
      )}
      
      <div 
        ref={containerRef}
        className={styles.carouselContainer}
        onScroll={handleScroll}
      >
        {unlockedAchievements.map((ach, index) => (
          <div key={ach.id || index} className={styles.slide}>
            <AchievementCard 
              achievement={ach} 
              unlocked={true}
            />
          </div>
        ))}
      </div>
      
      {scrollPosition < maxScroll - 10 && unlockedAchievements.length > 3 && (
        <button className={`${styles.navBtn} ${styles.navRight}`} onClick={() => scroll("right")}>
          <ChevronRight size={20} />
        </button>
      )}
    </div>
  );
}