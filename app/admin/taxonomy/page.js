"use client";

import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { adminHeaders, getApiUrl } from "../../../src/utils/adminApi";
import styles from "./page.module.css";

export default function AdminTaxonomyPage() {
  const [genres, setGenres] = useState([]);
  const [tags, setTags] = useState([]);
  const [genreName, setGenreName] = useState("");
  const [tagName, setTagName] = useState("");
  const [loading, setLoading] = useState(true);
  const [genreLoading, setGenreLoading] = useState(false);
  const [tagLoading, setTagLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      // Загрузка жанров
      const genresRes = await axios.get(`${getApiUrl()}/admin/genres`, {
        headers: adminHeaders(),
      });
      const genresRows = genresRes.data?.data || genresRes.data;
      setGenres(Array.isArray(genresRows) ? genresRows : []);

      // Загрузка тегов
      const tagsRes = await axios.get(`${getApiUrl()}/admin/preset-tags`, {
        headers: adminHeaders(),
      });
      const tagsRows = tagsRes.data?.data || tagsRes.data;
      setTags(Array.isArray(tagsRows) ? tagsRows : []);
    } catch (error) {
      console.error("Ошибка загрузки:", error);
      setGenres([]);
      setTags([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function addGenre() {
    const name = genreName.trim();
    if (!name) return;
    
    setGenreLoading(true);
    try {
      await axios.post(
        `${getApiUrl()}/admin/genres`,
        { name },
        { headers: adminHeaders() }
      );
      setGenreName("");
      await load();
    } catch (error) {
      alert(error?.response?.data?.message || "Ошибка добавления жанра");
    } finally {
      setGenreLoading(false);
    }
  }

  async function delGenre(id, name) {
    if (!confirm(`Удалить жанр "${name}"?`)) return;
    
    try {
      await axios.delete(`${getApiUrl()}/admin/genres/${id}`, {
        headers: adminHeaders(),
      });
      await load();
    } catch (error) {
      alert(error?.response?.data?.message || "Ошибка удаления жанра");
    }
  }

  async function addTag() {
    const name = tagName.trim();
    if (!name) return;
    
    setTagLoading(true);
    try {
      await axios.post(
        `${getApiUrl()}/admin/preset-tags`,
        { name },
        { headers: adminHeaders() }
      );
      setTagName("");
      await load();
    } catch (error) {
      alert(error?.response?.data?.message || "Ошибка добавления тега");
    } finally {
      setTagLoading(false);
    }
  }

  async function delTag(id, name) {
    if (!confirm(`Удалить тег "${name}"?`)) return;
    
    try {
      await axios.delete(`${getApiUrl()}/admin/preset-tags/${id}`, {
        headers: adminHeaders(),
      });
      await load();
    } catch (error) {
      alert(error?.response?.data?.message || "Ошибка удаления тега");
    }
  }

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.empty}>Загрузка данных...</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Жанры и теги</h1>
        <p className={styles.subtitle}>Управление категориями и тегами для комиксов</p>
      </div>

      <div className={styles.taxGrid}>
        {/* Жанры */}
        <section className={styles.taxCard}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>Жанры</h2>
            <span className={styles.cardCount}>{genres.length}</span>
          </div>
          
          <div className={styles.taxAdd}>
            <input
              type="text"
              className={styles.taxInput}
              value={genreName}
              onChange={(e) => setGenreName(e.target.value)}
              placeholder="Новый жанр..."
              onKeyPress={(e) => e.key === "Enter" && addGenre()}
            />
            <button
              type="button"
              className={styles.addBtn}
              onClick={addGenre}
              disabled={genreLoading || !genreName.trim()}
            >
              {genreLoading ? "..." : "+ Добавить"}
            </button>
          </div>
          
          <div className={styles.taxListWrapper}>
            {genres.length === 0 ? (
              <p className={styles.taxEmpty}>Нет жанров</p>
            ) : (
              <ul className={styles.taxList}>
                {genres.map((g) => (
                  <li key={g.id} className={styles.taxItem}>
                    <span className={styles.taxName}>{g.name}</span>
                    <button
                      type="button"
                      className={styles.taxDel}
                      onClick={() => delGenre(g.id, g.name)}
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        {/* Готовые теги */}
        <section className={styles.taxCard}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>Готовые теги</h2>
            <span className={styles.cardCount}>{tags.length}</span>
          </div>
          
          <div className={styles.taxAdd}>
            <input
              type="text"
              className={styles.taxInput}
              value={tagName}
              onChange={(e) => setTagName(e.target.value)}
              placeholder="Новый тег..."
              onKeyPress={(e) => e.key === "Enter" && addTag()}
            />
            <button
              type="button"
              className={styles.addBtn}
              onClick={addTag}
              disabled={tagLoading || !tagName.trim()}
            >
              {tagLoading ? "..." : "+ Добавить"}
            </button>
          </div>
          
          <div className={styles.taxListWrapper}>
            {tags.length === 0 ? (
              <p className={styles.taxEmpty}>Нет тегов</p>
            ) : (
              <ul className={styles.taxList}>
                {tags.map((t) => (
                  <li key={t.id} className={styles.taxItem}>
                    <span className={styles.taxName}>#{t.name}</span>
                    <button
                      type="button"
                      className={styles.taxDel}
                      onClick={() => delTag(t.id, t.name)}
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}