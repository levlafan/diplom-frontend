"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { Bookmark, BookOpen, CheckCircle, Clock } from "lucide-react";
import { useAuth } from "../src/context/AuthContext";
import styles from "./LibraryButton.module.css";

const COLLECTIONS = {
  reading: { label: "Читаю", icon: BookOpen, color: "var(--text-main)" },
  completed: { label: "Прочитано", icon: CheckCircle, color: "var(--text-main)" },
  planned: { label: "В планах", icon: Clock, color: "var(--text-main)" },
  favorites: { label: "Избранное", icon: Bookmark, color: "var(--text-main)" },
};

export default function LibraryButton({ post }) {
  const { user } = useAuth();
  const [currentCollection, setCurrentCollection] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [library, setLibrary] = useState({});

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

  useEffect(() => {
    if (!user?.id) return;
    axios
      .get(`${apiUrl}/users/${user.id}/library`)
      .then((res) => {
        const lib = res.data.library || {};
        setLibrary(lib);
        const found = Object.keys(lib).find((key) =>
          lib[key].some((item) => item.id === post.id)
        );
        setCurrentCollection(found || null);
      })
      .catch(() => {});
  }, [post.id, user?.id]);

  const addToCollection = async (collection) => {
    if (!user?.id) {
      window.location.href = "/login";
      return;
    }

    const updatedLibrary = { ...library };

    Object.keys(updatedLibrary).forEach((key) => {
      updatedLibrary[key] = updatedLibrary[key].filter((item) => item.id !== post.id);
    });

    if (currentCollection === collection) {
      setCurrentCollection(null);
    } else {
      if (!updatedLibrary[collection]) updatedLibrary[collection] = [];
      updatedLibrary[collection].push({
        id: post.id,
        title: post.title,
        cover_path: post.cover_path,
        user: post.user,
        added_at: Date.now(),
      });
      setCurrentCollection(collection);
    }

    setLibrary(updatedLibrary);

    try {
      const token = localStorage.getItem("eiry_token");
      await axios.post(
        `${apiUrl}/auth/library`,
        { library: updatedLibrary },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      window.dispatchEvent(new Event("library-updated"));
    } catch (e) {
      console.error("Ошибка сохранения", e);
    }

    setIsOpen(false);
  };

  const CurrentIcon = currentCollection ? COLLECTIONS[currentCollection].icon : Bookmark;

  return (
    <div className={styles.container}>
      <button
        className={styles.mainButton}
        onClick={() => setIsOpen(!isOpen)}
        style={{
          borderColor: currentCollection ? "var(--brand-lime)" : "var(--border-soft)",
          color: currentCollection ? "var(--text-main)" : "var(--text-muted)",
        }}
      >
        <CurrentIcon size={18} />
        <span>
          {currentCollection ? COLLECTIONS[currentCollection].label : "В библиотеку"}
        </span>
      </button>

      {isOpen && (
        <div className={styles.dropdown}>
          {Object.entries(COLLECTIONS).map(([key, { label, icon: Icon, color }]) => (
            <button
              key={key}
              className={`${styles.option} ${currentCollection === key ? styles.active : ""}`}
              onClick={() => addToCollection(key)}
            >
              <Icon size={16} color={color} />
              <span>{label}</span>
              {currentCollection === key && <span className={styles.check}>✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}