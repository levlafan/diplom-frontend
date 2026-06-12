// ComicsFilter.js - обновлённая версия с раскрывающимся блоком

"use client";

import { useMemo, useState, useEffect } from "react";
import { Search, ChevronDown, ChevronUp } from "lucide-react";
import {
  COMIC_GENRES,
  collectFeedTagChips,
  collectProfileTagChips,
} from "../src/utils/postFilters";
import styles from "./ComicsFilter.module.css";

export default function ComicsFilter({
  variant = "feed",
  posts = [],
  profileId,
  searchTerm,
  onSearchChange,
  selectedGenre,
  onGenreChange,
  selectedTags,
  onTagsChange,
  statusFilter,
  onStatusChange,
  minRating = 0,
  onMinRatingChange,
  minChapters = 0,
  onMinChaptersChange,
  priceType = "all",
  onPriceTypeChange,
  onResetFilters,
  isExpanded = false,
  onToggleExpand,
}) {
  const tagChips = useMemo(() => {
    if (variant === "profile" && profileId) {
      return collectProfileTagChips(posts, profileId, selectedGenre);
    }
    return collectFeedTagChips(posts, selectedGenre);
  }, [variant, posts, profileId, selectedGenre]);

  const toggleTag = (tag) => {
    onTagsChange(
      selectedTags.includes(tag)
        ? selectedTags.filter((t) => t !== tag)
        : [...selectedTags, tag]
    );
  };

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      if (typeof window !== 'undefined') {
        setIsMobile(window.innerWidth <= 768);
      }
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleResetFilters = () => {
    if (onResetFilters) {
      onResetFilters();
    }
  };

  const hasActiveExtraFilters = minRating > 0 || minChapters > 0 || priceType !== "all";

  return (
    <div className={styles.filter}>
      <div className={styles.topPanel}>
        <div className={styles.searchRow}>
          <Search size={18} className={styles.searchIcon} aria-hidden />
          <input
            type="search"
            className={styles.searchInput}
            placeholder="Поиск по названию, автору, жанру и всем тегам..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

        <div className={styles.topControlsRow}>
          <label className={styles.genreSelect}>
            <span>Жанр</span>
            <div className={styles.selectWrap}>
              <select value={selectedGenre} onChange={(e) => onGenreChange(e.target.value)}>
                <option value="">Все жанры</option>
                {COMIC_GENRES.map((genre) => (
                  <option key={genre} value={genre}>
                    {genre}
                  </option>
                ))}
              </select>
              <ChevronDown size={16} className={styles.selectIcon} aria-hidden />
            </div>
          </label>

          {variant === "feed" && onStatusChange && (
            <label className={styles.genreSelect}>
              <span>Статус</span>
              <div className={styles.selectWrap}>
                <select value={statusFilter} onChange={(e) => onStatusChange(e.target.value)}>
                  <option value="">Все статусы</option>
                  <option value="ongoing">В процессе</option>
                  <option value="completed">Завершён</option>
                  <option value="dropped">Заброшен</option>
                  <option value="frozen">Заморожен</option>
                </select>
                <ChevronDown size={16} className={styles.selectIcon} aria-hidden />
              </div>
            </label>
          )}
        </div>

        {/* Кнопка раскрытия дополнительных фильтров */}
        {onToggleExpand && (
          <button type="button" className={styles.expandBtn} onClick={onToggleExpand}>
            <span>
              {isExpanded ? "Скрыть дополнительные фильтры" : "Показать дополнительные фильтры"}
              {hasActiveExtraFilters && !isExpanded && " ✓"}
            </span>
            {isExpanded ? (
              <ChevronUp size={16} className={styles.expandIcon} />
            ) : (
              <ChevronDown size={16} className={styles.expandIcon} />
            )}
          </button>
        )}
      </div>

      {/* Раскрывающийся блок */}
      {(isExpanded || !onToggleExpand) && (
        <div className={styles.expandableContent}>
          <div className={styles.filtersRow}>
            {onMinRatingChange && (
              <div className={styles.filterGroup}>
                <span className={styles.filterLabel}>Рейтинг: от {minRating}</span>
                <div className={styles.rangeWrapper}>
                  <input
                    type="range"
                    className={styles.rangeInput}
                    min="0"
                    max="5"
                    step="0.5"
                    value={minRating}
                    onChange={(e) => onMinRatingChange(parseFloat(e.target.value))}
                  />
                </div>
              </div>
            )}

            {onMinChaptersChange && (
              <div className={styles.filterGroup}>
                <span className={styles.filterLabel}>Глав: от {minChapters}</span>
                <div className={styles.rangeWrapper}>
                  <input
                    type="range"
                    className={styles.rangeInput}
                    min="0"
                    max="50"
                    step="1"
                    value={minChapters}
                    onChange={(e) => onMinChaptersChange(parseInt(e.target.value))}
                  />
                </div>
              </div>
            )}

            {onPriceTypeChange && (
              <div className={styles.filterGroup}>
                <span className={styles.filterLabel}>Доступ</span>
                <div className={styles.checkboxGroup}>
                  <label className={styles.checkboxLabel}>
                    <input
                      type="radio"
                      name="priceType"
                      checked={priceType === "all"}
                      onChange={() => onPriceTypeChange("all")}
                    />
                    Все
                  </label>
                  <label className={styles.checkboxLabel}>
                    <input
                      type="radio"
                      name="priceType"
                      checked={priceType === "free"}
                      onChange={() => onPriceTypeChange("free")}
                    />
                    Бесплатные
                  </label>
                  <label className={styles.checkboxLabel}>
                    <input
                      type="radio"
                      name="priceType"
                      checked={priceType === "paid"}
                      onChange={() => onPriceTypeChange("paid")}
                    />
                    Платные
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* Кнопка сброса всех фильтров */}
          {onResetFilters && (
            <button type="button" className={styles.resetFiltersBtn} onClick={handleResetFilters}>
              Сбросить все фильтры
            </button>
          )}

          {/* Теги — десктопная версия */}
          {!isMobile && tagChips.length > 0 && (
            <div className={styles.tagSection}>
              <span className={styles.tagLabel}>
                {variant === "feed" ? "Теги" : "Теги"}
              </span>
              <div className={styles.tagList}>
                {tagChips.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    className={`${styles.tagBtn} ${selectedTags.includes(tag) ? styles.tagActive : ""}`}
                    onClick={() => toggleTag(tag)}
                  >
                    {tag}
                  </button>
                ))}
              </div>
              {selectedTags.length > 0 && (
                <button type="button" className={styles.clearTags} onClick={() => onTagsChange([])}>
                  Сбросить теги
                </button>
              )}
            </div>
          )}

          {/* Теги — мобильная версия (выпадающий список) */}
          {isMobile && tagChips.length > 0 && (
            <div className={styles.tagSection}>
              <select
                className={styles.tagDropdown}
                value={selectedTags.length > 0 ? selectedTags[0] : ""}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value) {
                    onTagsChange([value]);
                  } else {
                    onTagsChange([]);
                  }
                }}
              >
                <option value="">Все теги</option>
                {tagChips.map((tag) => (
                  <option key={tag} value={tag}>
                    {tag}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}
    </div>
  );
}