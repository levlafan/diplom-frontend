"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import axios from "axios";
import JSZip from "jszip";
import imageCompression from "browser-image-compression";
import { useAuth } from "../../../src/context/AuthContext";
import { resolveStorageUrl } from "../../../src/utils/media";
import LibraryButton from "../../../components/LibraryButton";
import ReportModal from "../../../components/ReportModal";
import StarRating from "../../../components/StarRating";
import CommentTree from "../../../components/CommentTree";
import { Settings, Plus, Trash2, Flag, Lock, Edit3 } from "lucide-react";
import styles from "./page.module.css";

export default function ComicDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { token, user } = useAuth();
  const [post, setPost] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [chapters, setChapters] = useState([]);
  const [showChapterForm, setShowChapterForm] = useState(false);
  const [chapterZip, setChapterZip] = useState(null);
  const [chapterTitle, setChapterTitle] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [showManageMenu, setShowManageMenu] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [chapterSort, setChapterSort] = useState("asc");
  const [coAuthors, setCoAuthors] = useState([]);
  const [priceEdit, setPriceEdit] = useState("0");
  const [isPaidEdit, setIsPaidEdit] = useState(false);
  const [showStatusEdit, setShowStatusEdit] = useState(false);
  const [editStatus, setEditStatus] = useState("ongoing");
  
  // Для предпросмотра страниц
  const [chapterPages, setChapterPages] = useState([]);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const previewUrlsRef = useRef([]);

  const isOwner = user?.id && post?.user_id && +user.id === +post.user_id;
  const isCoauthor = Array.isArray(post?.co_author_ids) && post.co_author_ids.includes(Number(user?.id));
  const canManage = isOwner || isCoauthor;

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

  const STATUS_OPTIONS = [
    { value: "ongoing", label: "В процессе" },
    { value: "completed", label: "Завершён" },
    { value: "dropped", label: "Заброшен" },
    { value: "frozen", label: "Заморожен" }
  ];

  const getStatusLabel = (status) => {
    const option = STATUS_OPTIONS.find(opt => opt.value === status);
    return option ? option.label : status;
  };

  // Компрессия в WebP
  async function compressToWebp(file, baseName = "image") {
    if (!file) return null;
    try {
      const compressed = await imageCompression(file, { 
        maxSizeMB: 1, 
        maxWidthOrHeight: 1920, 
        useWebWorker: true, 
        fileType: "image/webp", 
        initialQuality: 0.8 
      });
      return new File(
        [compressed], 
        `${String(baseName).replace(/[^\w\-]+/g, "_").slice(0, 80) || "image"}.webp`, 
        { type: "image/webp" }
      );
    } catch { 
      return file; 
    }
  }

  // Обработка ZIP для предпросмотра
  async function handleChapterZipPreview(file) {
    if (!file?.name?.toLowerCase().endsWith(".zip")) {
      alert("Требуется ZIP-файл.");
      return;
    }

    try {
      const loadedZip = await JSZip.loadAsync(file);
      const entries = Object.values(loadedZip.files)
        .filter((e) => !e.dir && /\.(jpg|jpeg|png|webp|gif)$/i.test(e.name))
        .map((e) => e.name);

      if (!entries.length) {
        alert("Нет изображений в архиве.");
        return;
      }

      const outPages = [];
      for (let i = 0; i < entries.length; i++) {
        const blob = await loadedZip.file(entries[i]).async("blob");
        const webp = await compressToWebp(
          new File([blob], entries[i], { type: blob.type }), 
          entries[i].replace(/\.[^.]+$/, "")
        );
        const fileName = `${String(i + 1).padStart(3, "0")}_${webp.name}`;
        outPages.push({
          name: fileName,
          previewUrl: URL.createObjectURL(webp)
        });
      }

      // Сохраняем URL для очистки
      previewUrlsRef.current = outPages.map(p => p.previewUrl);
      setChapterPages(outPages);
      setCurrentPageIndex(0);
    } catch (error) {
      console.error("Ошибка обработки ZIP:", error);
      alert("Ошибка при обработке ZIP-файла");
    }
  }

  // Перемещение страницы в предпросмотре (МЕНЯЕТ МЕСТАМИ)
  function moveChapterPage(index, direction) {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= chapterPages.length) return;
    
    setChapterPages((prev) => {
      const next = [...prev];
      // Меняем местами два элемента
      [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
      return next;
    });
    
    // Обновляем текущий индекс на новый
    setCurrentPageIndex(nextIndex);
  }

  // Очищаем URL только при размонтировании компонента
  useEffect(() => {
    return () => {
      previewUrlsRef.current.forEach((url) => {
        if (url) URL.revokeObjectURL(url);
      });
      previewUrlsRef.current = [];
    };
  }, []);

  useEffect(() => {
    if (!post?.co_author_ids?.length) return;
    const ids = post.co_author_ids.join(",");
    if (ids) {
      axios
        .get(`${apiUrl}/users?ids=${ids}`)
        .then((res) => setCoAuthors(Array.isArray(res.data) ? res.data : []))
        .catch(() => setCoAuthors([]));
    }
  }, [post?.co_author_ids, apiUrl]);

  useEffect(() => {
    axios
      .get(`${apiUrl}/posts/${params.id}`)
      .then((res) => {
        const found = res.data;
        if (found && typeof found.co_author_ids === "string") {
          try {
            found.co_author_ids = JSON.parse(found.co_author_ids);
          } catch {
            found.co_author_ids = [];
          }
        }
        setPost(found || null);
        setPriceEdit(String(found?.price ?? "0"));
        setIsPaidEdit(Boolean(found?.is_paid));
        setEditStatus(found?.comic_status || "ongoing");
      })
      .finally(() => setIsLoading(false));
  }, [params.id, apiUrl]);

  useEffect(() => {
    axios
      .get(`${apiUrl}/posts/${params.id}/chapters`)
      .then((res) => setChapters(res.data.chapters || []))
      .catch(() => setChapters([]));
  }, [params.id, apiUrl]);

  const handleAddChapter = async (e) => {
    e.preventDefault();
    if (!chapterZip || !token) return;
    const fd = new FormData();
    fd.append("zip_file", chapterZip);
    if (chapterTitle.trim()) fd.append("chapter_title", chapterTitle.trim());
    setIsUploading(true);
    try {
      const res = await axios.post(`${apiUrl}/posts/${params.id}/chapters`, fd, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setChapters(res.data.chapters || []);
      setChapterZip(null);
      setChapterTitle("");
      setChapterPages([]);
      setCurrentPageIndex(0);
      previewUrlsRef.current = [];
      setShowChapterForm(false);
    } catch (err) {
      alert(err?.response?.data?.message || "Ошибка");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteComic = async () => {
    if (!confirm("Удалить комикс?")) return;
    await axios.delete(`${apiUrl}/posts/${post.id}`, { headers: { Authorization: `Bearer ${token}` } });
    router.push("/");
  };

  const handleDeleteChapter = async (num) => {
    if (!confirm(`Удалить главу ${num}?`)) return;
    const res = await axios.delete(`${apiUrl}/posts/${post.id}/chapters/${num}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    setChapters(res.data.chapters || []);
  };

  const saveMonetization = async () => {
    if (!token || !post) return;
    try {
      const res = await axios.patch(
        `${apiUrl}/posts/${post.id}`,
        { price: Number(priceEdit) || 0, is_paid: isPaidEdit },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setPost(res.data);
    } catch (e) {
      alert(e?.response?.data?.message || "Ошибка сохранения");
    }
  };

  const saveStatus = async () => {
    if (!token || !post) return;
    try {
      const res = await axios.patch(
        `${apiUrl}/posts/${post.id}`,
        { comic_status: editStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setPost(res.data);
      setShowStatusEdit(false);
    } catch (e) {
      alert(e?.response?.data?.message || "Ошибка сохранения статуса");
    }
  };

  const toggleChapterPaid = async (chapterNumber, nextVal) => {
    if (!token || !post) return;
    try {
      const res = await axios.patch(
        `${apiUrl}/posts/${post.id}/chapters/${chapterNumber}`,
        { is_paid: nextVal },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setChapters((prev) => prev.map((c) => (c.number === chapterNumber ? { ...c, ...res.data } : c)));
    } catch (e) {
      alert(e?.response?.data?.message || "Ошибка");
    }
  };

  const progress =
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem(`eiry_reader_progress_${post?.id}`) || "null")
      : null;

  if (isLoading) {
    return (
      <main className={styles.page}>
        <section className={styles.container}>Загрузка...</section>
      </main>
    );
  }

  if (!post) {
    return (
      <main className={styles.page}>
        <section className={styles.container}>Комикс не найден.</section>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <section className={styles.container}>
        <div className={styles.hero}>
          <div className={styles.coverWrap}>
            <Image src={resolveStorageUrl(post.cover_path)} alt={post.title} fill className={styles.cover} unoptimized />
          </div>
          <div className={styles.info}>
            <div className={styles.info1}>
              <div className={styles.titleRow}>
                <h1>{post.title}</h1>
                <div className={styles.statusBadge}>
                  {getStatusLabel(post.comic_status)}
                </div>
                {canManage && !showStatusEdit && (
                  <button
                    type="button"
                    className={styles.editStatusBtn}
                    onClick={() => setShowStatusEdit(true)}
                    title="Изменить статус"
                  >
                    <Edit3 size={14} />
                  </button>
                )}
              </div>

              {canManage && showStatusEdit && (
                <div className={styles.statusEditForm}>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    className={styles.statusSelect}
                  >
                    {STATUS_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                  <div className={styles.statusEditActions}>
                    <button type="button" onClick={saveStatus} className={styles.saveStatusBtn}>
                      Сохранить
                    </button>
                    <button type="button" onClick={() => setShowStatusEdit(false)} className={styles.cancelStatusBtn}>
                      Отмена
                    </button>
                  </div>
                </div>
              )}

              <p className={styles.author}>
                автор{" "}
                <Link href={`/profile/${post.user?.id || post.user_id}`}>{post.user?.name || "Неизвестный"}</Link>
                {coAuthors.length > 0 && (
                  <>
                    {" "}
                    и{" "}
                    {coAuthors.map((a, i) => (
                      <span key={a.id}>
                        <Link href={`/profile/${a.id}`}>{a.name}</Link>
                        {i < coAuthors.length - 1 && ", "}
                      </span>
                    ))}
                  </>
                )}
              </p>
              <p className={styles.description}>{post.content || "Нет описания."}</p>
              <div className={styles.tags}>
                {(post.tags || []).map((t) => (
                  <span key={t}>#{t}</span>
                ))}
              </div>
              {(post.is_paid || Number(post.price) > 0) && (
                <p className={styles.priceLine}>
                  {post.is_paid ? "Платный комикс" : "Есть платные главы"} — от {Number(post.price || 0).toFixed(2)}
                </p>
              )}
            </div>

            <div className={styles.actions}>
              <LibraryButton post={post} />
              <button type="button" onClick={() => router.push(`/reader/${post.id}?chapter=${progress?.chapter || 1}`)}>
                {progress?.chapter ? "Продолжить" : "Начать читать"}
              </button>
              <button className={styles.reportBtn} type="button" onClick={() => setShowReport(true)}>
                <Flag size={16} />
              </button>
              {canManage && (
                <div className={styles.manageMenu}>
                  <button type="button" onClick={() => setShowManageMenu(!showManageMenu)}>
                    <Settings size={18} />
                  </button>
                  {showManageMenu && (
                    <div className={styles.manageDropdown}>
                      <button
                        type="button"
                        onClick={() => {
                          setShowChapterForm(true);
                          setShowManageMenu(false);
                        }}
                      >
                        <Plus size={16} /> Добавить главу
                      </button>
                      <button type="button" onClick={handleDeleteComic}>
                        <Trash2 size={16} /> Удалить комикс
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ФОРМА ДОБАВЛЕНИЯ ГЛАВЫ С ПРЕДПРОСМОТРОМ СТРАНИЦ */}
        {canManage && showChapterForm && (
          <form onSubmit={handleAddChapter} className={styles.authorForm}>
            <h3 className={styles.formTitle}>Добавить новую главу</h3>
            
            <label className={styles.formLabel}>
              <span>Номер или Название главы</span>
              <input
                type="text"
                className={styles.inputField}
                placeholder="Например: Глава 5 или Экстра"
                value={chapterTitle}
                onChange={(e) => setChapterTitle(e.target.value)}
              />
            </label>

            <label className={styles.formLabel}>
              <span>Архив с изображениями (ZIP)</span>
              <input
                type="file"
                accept=".zip"
                className={styles.fileField}
                onChange={async (e) => {
                  const file = e.target.files?.[0] || null;
                  if (file) {
                    setChapterZip(file);
                    await handleChapterZipPreview(file);
                  } else {
                    setChapterZip(null);
                    setChapterPages([]);
                    setCurrentPageIndex(0);
                    previewUrlsRef.current = [];
                  }
                }}
                required
              />
            </label>

            {/* Предпросмотр страниц */}
            {chapterPages.length > 0 && (
              <div className={styles.chapterPreview}>
                <h4>Предпросмотр страниц ({chapterPages.length})</h4>
                
                <div className={styles.chapterPreviewContainer}>
                  
                  <div className={styles.chapterPreviewImage}>
                    <Image
                      src={chapterPages[currentPageIndex].previewUrl}
                      alt={`Страница ${currentPageIndex + 1}`}
                      width={200}
                      height={280}
                      className={styles.chapterPreviewImg}
                      unoptimized
                    />
                    <p className={styles.chapterPreviewCount}>
                      {currentPageIndex + 1} / {chapterPages.length}
                    </p>
                    <div className={styles.chapterPreviewActions}>
                      <button
                        type="button"
                        onClick={() => moveChapterPage(currentPageIndex, -1)}
                        disabled={currentPageIndex === 0}
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        onClick={() => moveChapterPage(currentPageIndex, 1)}
                        disabled={currentPageIndex === chapterPages.length - 1}
                      >
                        ↓
                      </button>
                    </div>
                  </div>
                  
                </div>

                {/* Миниатюры всех страниц */}
                <div className={styles.chapterThumbnails}>
                  {chapterPages.map((page, idx) => (
                    <button
                      key={page.name || idx}
                      type="button"
                      className={`${styles.chapterThumbnail} ${idx === currentPageIndex ? styles.chapterThumbnailActive : ""}`}
                      onClick={() => setCurrentPageIndex(idx)}
                    >
                      <Image
                        src={page.previewUrl}
                        alt={`Страница ${idx + 1}`}
                        width={40}
                        height={56}
                        className={styles.chapterThumbImg}
                        unoptimized
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className={styles.formActions}>
              <button type="submit" disabled={isUploading}>
                {isUploading ? "Загрузка..." : "Загрузить главу"}
              </button>
              <button 
                type="button" 
                className={styles.cancelBtn} 
                onClick={() => {
                  setShowChapterForm(false);
                  setChapterPages([]);
                  setCurrentPageIndex(0);
                  setChapterZip(null);
                  previewUrlsRef.current = [];
                }}
              >
                Отмена
              </button>
            </div>
          </form>
        )}

        {/* ФОРМА НАСТРОЕК МОНЕТИЗАЦИИ */}
        {canManage && (
          <div className={styles.monetizationForm}>
            <h3 className={styles.formTitle}>Настройки монетизации</h3>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={isPaidEdit}
                onChange={(e) => setIsPaidEdit(e.target.checked)}
              />
              <span>Платный комикс полностью</span>
            </label>
            <label className={styles.formLabel}>
              <span>Минимальная цена</span>
              <input
                type="number"
                className={styles.inputField}
                value={priceEdit}
                onChange={(e) => setPriceEdit(e.target.value)}
              />
            </label>
            <button type="button" className={styles.saveBtn} onClick={saveMonetization}>
              Сохранить изменения
            </button>
          </div>
        )}

        {/* СПИСОК ГЛАВ */}
        <section className={styles.chaptersSection}>
          <div className={styles.chaptersHeader}>
            <h2>Список глав ({chapters.length})</h2>
            <button
              type="button"
              className={styles.sortBtn}
              onClick={() => setChapterSort(chapterSort === "asc" ? "desc" : "asc")}
            >
              Сортировка: {chapterSort === "asc" ? "С начала" : "С конца"}
            </button>
          </div>

          <div className={styles.chapterList}>
            {chapters.length === 0 && <p className={styles.noChapters}>Главы еще не загружены.</p>}
            {[...chapters]
              .sort((a, b) => (chapterSort === "asc" ? a.number - b.number : b.number - a.number))
              .map((ch) => (
                <div key={ch.number} className={styles.chapterRow}>
                  <Link href={`/reader/${post.id}?chapter=${ch.number}`} className={styles.chapterLink}>
                    Глава {ch.number} {ch.title ? `— ${ch.title}` : ""}
                  </Link>

                  {canManage && (
                    <div className={styles.chapterActions}>
                      <button
                        type="button"
                        className={`${styles.togglePaidBtn} ${ch.is_paid ? styles.togglePaidBtnActive : ""}`}
                        onClick={() => toggleChapterPaid(ch.number, !ch.is_paid)}
                      >
                        <Lock size={14} />
                        <span>{ch.is_paid ? "Платно" : "Бесплатно"}</span>
                      </button>
                      <button
                        type="button"
                        className={styles.deleteChapterBtn}
                        onClick={() => handleDeleteChapter(ch.number)}
                      >
                        <Trash2 size={14} />
                        <span>Удалить</span>
                      </button>
                    </div>
                  )}
                </div>
              ))}
          </div>
        </section>

        {/* Модалки репортов и комменты */}
        <ReportModal isOpen={showReport} onClose={() => setShowReport(false)} postId={post.id} />
        <StarRating postId={post.id} token={token} apiUrl={apiUrl} />
        <CommentTree
          postId={post.id}
          token={token}
          apiUrl={apiUrl}
          currentUserId={user?.id}
        />
      </section>
    </main>
  );
}