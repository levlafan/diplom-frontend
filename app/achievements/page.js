// app/achievements/page.js
"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../../src/context/AuthContext";
import { ALL_ACHIEVEMENTS, ACHIEVEMENT_CATEGORIES, RARITY_CONFIG } from "../../src/utils/achievements";
import AchievementCard from "../../components/AchievementCard";
import { BookOpen, PenTool, Users, Star } from "lucide-react";
import styles from "./page.module.css";

const categoryIcons = {
  reader: BookOpen,
  creator: PenTool,
  social: Users,
  special: Star,
};

export default function AchievementsPage() {
  const { user, token } = useAuth();
  const [userAchievements, setUserAchievements] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedRarity, setSelectedRarity] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

  useEffect(() => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }
    
    axios.get(`${apiUrl}/users/${user.id}/achievements`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    })
      .then(res => {
        console.log("API ответ:", res.data);
        
        let achievements = res.data;
        
        // Нормализуем данные
        if (achievements?.data) {
          achievements = achievements.data;
        }
        
        if (Array.isArray(achievements)) {
          setUserAchievements(achievements);
        } else {
          setUserAchievements([]);
        }
      })
      .catch(err => {
        console.error("Ошибка:", err);
        setUserAchievements([]);
      })
      .finally(() => setIsLoading(false));
  }, [user?.id, token, apiUrl]);

  // Получаем ID/type достижений пользователя
  const userAchievementIds = new Set(
    userAchievements.map(a => a.id || a.type)
  );

  console.log("ID достижений пользователя:", [...userAchievementIds]);

  const filteredAchievements = ALL_ACHIEVEMENTS.filter(ach => {
    if (selectedCategory !== "all" && ach.type !== selectedCategory) return false;
    if (selectedRarity !== "all" && ach.rarity !== selectedRarity) return false;
    return true;
  });

  const unlockedCount = ALL_ACHIEVEMENTS.filter(ach => userAchievementIds.has(ach.id)).length;
  const totalCount = ALL_ACHIEVEMENTS.length;

  if (isLoading) {
    return (
      <main className={styles.page}>
        <div className={styles.container}>
          <p>Загрузка достижений...</p>
        </div>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>Достижения</h1>
          <p className={styles.stats}>
            Получено: {unlockedCount} / {totalCount}
          </p>
          <div className={styles.progressBar}>
            <div 
              className={styles.progressFill} 
              style={{ width: `${(unlockedCount / totalCount) * 100}%` }}
            />
          </div>
        </div>

        <div className={styles.filters}>
          <div className={styles.categoryFilters}>
            <button
              className={`${styles.filterBtn} ${selectedCategory === "all" ? styles.active : ""}`}
              onClick={() => setSelectedCategory("all")}
            >
              Все
            </button>
            {Object.entries(ACHIEVEMENT_CATEGORIES).map(([key, { label }]) => {
              const Icon = categoryIcons[key];
              return (
                <button
                  key={key}
                  className={`${styles.filterBtn} ${selectedCategory === key ? styles.active : ""}`}
                  onClick={() => setSelectedCategory(key)}
                >
                  {Icon && <Icon size={14} />}
                  {label}
                </button>
              );
            })}
          </div>
          
          <div className={styles.rarityFilters}>
            <button
              className={`${styles.rarityBtn} ${selectedRarity === "all" ? styles.active : ""}`}
              onClick={() => setSelectedRarity("all")}
            >
              Все редкости
            </button>
            {Object.entries(RARITY_CONFIG).map(([key, { label, color }]) => (
              <button
                key={key}
                className={`${styles.rarityBtn} ${selectedRarity === key ? styles.active : ""}`}
                style={{ borderColor: color }}
                onClick={() => setSelectedRarity(key)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.grid}>
          {filteredAchievements.map(ach => (
            <AchievementCard
              key={ach.id}
              achievement={ach}
              unlocked={userAchievementIds.has(ach.id)}
            />
          ))}
        </div>
      </div>
    </main>
  );
}