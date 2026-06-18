"use client";

import { Suspense, useEffect, useMemo, useState, useCallback } from "react";
import PostCard from "../../components/PostCard";
import ComicsFilter from "../../components/ComicsFilter";
import { filterFeedPosts } from "../../src/utils/postFilters";
import { ChevronLeft, ChevronRight } from "lucide-react";
import styles from "./page.module.css";

function normalizePosts(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
}

const POSTS_PER_PAGE = 8;

export default function FeedPage() {
  return (
    <Suspense
      fallback={
        <main className={styles.page}>
          <div className={styles.container}>
            <p>Загрузка каталога...</p>
          </div>
        </main>
      }
    >
      <FeedPageInner />
    </Suspense>
  );
}

function FeedPageInner() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedGenre, setSelectedGenre] = useState("");
  const [selectedTags, setSelectedTags] = useState([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [isFilterExpanded, setIsFilterExpanded] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  
  // Новые фильтры
  const [minRating, setMinRating] = useState(0);
  const [minChapters, setMinChapters] = useState(0);
  const [priceType, setPriceType] = useState("all");

  useEffect(() => {
    fetch(`${apiUrl}/posts`, { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => setPosts(normalizePosts(data)))
      .catch(() => setPosts([]))
      .finally(() => setIsLoading(false));
  }, [apiUrl]);

  const resetFilters = () => {
    setSearchTerm("");
    setSelectedGenre("");
    setSelectedTags([]);
    setStatusFilter("");
    setMinRating(0);
    setMinChapters(0);
    setPriceType("all");
    setSortBy("newest");
    setCurrentPage(1);
  };

  // Фильтрация и сортировка всех постов
  const filteredAndSortedPosts = useMemo(() => {
    let rows = filterFeedPosts(posts, {
      searchTerm,
      selectedGenre,
      selectedTags,
      statusFilter,
    });

    if (minRating > 0) {
      rows = rows.filter((post) => (post.avg_rating || 0) >= minRating);
    }

    if (minChapters > 0) {
      const chaptersCount = (post) => post.postChapters?.length || post.chapters_count || 0;
      rows = rows.filter((post) => chaptersCount(post) >= minChapters);
    }

    if (priceType === "free") {
      rows = rows.filter((post) => {
        const isPaid = post.is_paid === true || post.is_paid === 1;
        const hasPrice = (post.price || 0) > 0;
        return !isPaid && !hasPrice;
      });
    } else if (priceType === "paid") {
      rows = rows.filter((post) => {
        const isPaid = post.is_paid === true || post.is_paid === 1;
        const hasPrice = (post.price || 0) > 0;
        return isPaid || hasPrice;
      });
    }

    return [...rows].sort((a, b) => {
      if (sortBy === "newest") return new Date(b.created_at) - new Date(a.created_at);
      if (sortBy === "oldest") return new Date(a.created_at) - new Date(b.created_at);
      if (sortBy === "rating") return (b.avg_rating || 0) - (a.avg_rating || 0);
      if (sortBy === "title") return (a.title || "").localeCompare(b.title || "", "ru");
      return 0;
    });
  }, [posts, searchTerm, selectedGenre, selectedTags, statusFilter, sortBy, minRating, minChapters, priceType]);

  // Пагинация
  const totalPages = Math.ceil(filteredAndSortedPosts.length / POSTS_PER_PAGE);
  const paginatedPosts = filteredAndSortedPosts.slice(
    (currentPage - 1) * POSTS_PER_PAGE,
    currentPage * POSTS_PER_PAGE
  );

  // Сброс страницы при изменении фильтров
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedGenre, selectedTags, statusFilter, sortBy, minRating, minChapters, priceType]);

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <ComicsFilter
          variant="feed"
          posts={posts}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          selectedGenre={selectedGenre}
          onGenreChange={(genre) => {
            setSelectedGenre(genre);
            setSelectedTags([]);
          }}
          selectedTags={selectedTags}
          onTagsChange={setSelectedTags}
          statusFilter={statusFilter}
          onStatusChange={setStatusFilter}
          minRating={minRating}
          onMinRatingChange={setMinRating}
          minChapters={minChapters}
          onMinChaptersChange={setMinChapters}
          priceType={priceType}
          onPriceTypeChange={setPriceType}
          onResetFilters={resetFilters}
          isExpanded={isFilterExpanded}
          onToggleExpand={() => setIsFilterExpanded(!isFilterExpanded)}
        />

        <div className={styles.sortRow}>
          <label className={styles.sortLabel}>
            Сортировка
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="newest">Сначала новые</option>
              <option value="oldest">Сначала старые</option>
              <option value="rating">По рейтингу</option>
              <option value="title">По названию</option>
            </select>
          </label>
          <div className={styles.resultCount}>
            Найдено: {filteredAndSortedPosts.length}
          </div>
        </div>

        {isLoading ? (
          <div className={styles.loading}>
            <div className={styles.spinner} />
            <p>Загружаем каталог...</p>
          </div>
        ) : paginatedPosts.length === 0 ? (
          <div className={styles.empty}>
            <p>Ничего не найдено</p>
            <button onClick={resetFilters} className={styles.resetBtn}>
              Сбросить фильтры
            </button>
          </div>
        ) : (
          <>
            <div className={styles.grid}>
              {paginatedPosts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>

            {totalPages > 1 && (
              <div className={styles.pagination}>
                <button
                  type="button"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={styles.pageButton}
                >
                  <ChevronLeft size={18} />
                </button>
                
                <div className={styles.pageNumbers}>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    
                    return (
                      <button
                        key={pageNum}
                        type="button"
                        onClick={() => handlePageChange(pageNum)}
                        className={`${styles.pageNumber} ${currentPage === pageNum ? styles.pageNumberActive : ""}`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>

                <button
                  type="button"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className={styles.pageButton}
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}