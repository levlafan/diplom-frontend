"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import axios from "axios";
import JSZip from "jszip";
import imageCompression from "browser-image-compression";
import { useAuth } from "../src/context/AuthContext";
import { useProtectedAction } from "../src/utils/useProtectedAction";
import CoAuthorModal from "./CoAuthorModal";
import styles from "./UploadForm.module.css";

const GENRES_COMIC = ["Экшн", "Романтика", "Фэнтези", "Научпоп", "Комедия", "Драма", "Хоррор", "Детектив", "Приключения", "Киберпанк", "Мистика", "Повседневность"];
const SUGGESTED_TAGS = ["Веб-комикс", "Манга", "Графический роман", "Стрип", "Лонгрид", "В процессе", "Завершён", "Бесплатно", "По подписке"];

export default function UploadForm({ onSuccess }) {
  const router = useRouter();
  const { token, isHydrated } = useAuth();
  const { requireAuth } = useProtectedAction();

  const coverInputRef = useRef(null);
  const zipInputRef = useRef(null);

  const [title, setTitle] = useState("");
  const [comicStatus, setComicStatus] = useState("ongoing");
  const [genres, setGenres] = useState([]);
  const [coverImage, setCoverImage] = useState(null);
  const [zipFile, setZipFile] = useState(null);
  const [pages, setPages] = useState([]);
  const [status, setStatus] = useState("");
  const [progress, setProgress] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [coAuthorIds, setCoAuthorIds] = useState([]);
  const [isCoAuthorModalOpen, setIsCoAuthorModalOpen] = useState(false);
  const [description, setDescription] = useState("");

  const [customTags, setCustomTags] = useState([]);
  const [tagInput, setTagInput] = useState("");
  const [chapterCount, setChapterCount] = useState(1);
  const [presetPick, setPresetPick] = useState([]);
  const [apiPresets, setApiPresets] = useState([]);
  const [price, setPrice] = useState("0");
  const [isPaid, setIsPaid] = useState(false);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

  useEffect(() => {
    fetch(`${apiUrl}/catalog/taxonomy`)
      .then((r) => r.json())
      .then((d) => setApiPresets(Array.isArray(d.preset_tags) ? d.preset_tags : []))
      .catch(() => setApiPresets([]));
  }, [apiUrl]);

  const coverPreview = useMemo(() => {
    if (!coverImage) return "";
    return URL.createObjectURL(coverImage);
  }, [coverImage]);

  useEffect(() => {
    return () => {
      pages.forEach((p) => { if (p?.previewUrl) URL.revokeObjectURL(p.previewUrl); });
      if (coverPreview) URL.revokeObjectURL(coverPreview);
    };
  }, []);

  async function compressToWebp(file, baseName = "image") {
    if (!file) return null;
    try {
      const compressed = await imageCompression(file, { maxSizeMB: 1, maxWidthOrHeight: 1920, useWebWorker: true, fileType: "image/webp", initialQuality: 0.8 });
      return new File([compressed], `${String(baseName).replace(/[^\w\-]+/g, "_").slice(0, 80) || "image"}.webp`, { type: "image/webp" });
    } catch { return file; }
  }

  function toggleGenre(genre) { setGenres((prev) => prev.includes(genre) ? prev.filter((g) => g !== genre) : [...prev, genre]); }

  async function handleZipFile(file) {
    if (!file?.name?.toLowerCase().endsWith(".zip")) { setStatus("Требуется ZIP-файл."); return; }
    setStatus("Распаковка ZIP и сжатие страниц...");
    const loadedZip = await JSZip.loadAsync(file);
    const entries = Object.values(loadedZip.files).filter((e) => !e.dir && /\.(jpg|jpeg|png|webp|gif)$/i.test(e.name)).map((e) => e.name);
    if (!entries.length) { setStatus("Нет изображений."); return; }
    pages.forEach((p) => { if (p?.previewUrl) URL.revokeObjectURL(p.previewUrl); });
    const outZip = new JSZip();
    const outPages = [];
    for (let i = 0; i < entries.length; i++) {
      const blob = await loadedZip.file(entries[i]).async("blob");
      const webp = await compressToWebp(new File([blob], entries[i], { type: blob.type }), entries[i].replace(/\.[^.]+$/, ""));
      outZip.file(`${String(i + 1).padStart(3, "0")}_${webp.name}`, webp);
      outPages.push({ name: `${String(i + 1).padStart(3, "0")}_${webp.name}`, previewUrl: URL.createObjectURL(webp) });
    }
    const zipped = await outZip.generateAsync({ type: "blob", compression: "DEFLATE", compressionOptions: { level: 6 } });
    setZipFile(new File([zipped], `${file.name.replace(/\.zip$/i, "")}_compressed.zip`, { type: "application/zip" }));
    setPages(outPages);
    setStatus(`ZIP готов: ${Math.round(zipped.size / 1024)} KB`);
  }

  function movePage(index, direction) {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= pages.length) return;
    setPages((prev) => { const next = [...prev]; [next[index], next[nextIndex]] = [next[nextIndex], next[index]]; return next; });
  }

  async function submit(event) {
    event.preventDefault();
    if (!isHydrated) return;
    if (!token) { router.push("/register"); return; }
    if (!title.trim()) { setStatus("Название обязательно."); return; }
    if (!zipFile) { setStatus("ZIP-файл обязателен."); return; }

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
    const formData = new FormData();
    formData.append("title", title.trim());
    formData.append("type", "comic");
    formData.append("comic_status", comicStatus);
    formData.append("content", description.trim());
    
    // Все теги (жанры + свои)
    const allTags = [...genres, ...customTags, ...presetPick];
    allTags.forEach((tag) => formData.append("tags[]", tag));
    
    coAuthorIds.forEach((id) => formData.append("co_author_ids[]", String(id)));
    pages.forEach((p) => formData.append("page_order[]", p.name));
    if (coverImage) formData.append("cover_image", coverImage);
    formData.append("zip_file", zipFile);
    formData.append("expected_chapters", chapterCount);
    formData.append("price", String(Number(price) || 0));
    formData.append("is_paid", isPaid ? "1" : "0");

    try {
      setIsSubmitting(true); setProgress(0); setStatus("Публикация...");
      await axios.post(`${apiUrl}/posts`, formData, {
        headers: { Authorization: `Bearer ${token}` },
        onUploadProgress: (evt) => { if (evt.total) setProgress(Math.round((evt.loaded / evt.total) * 100)); },
      });
      setStatus("Успешно! Опубликовано."); setProgress(100);
      if (onSuccess) onSuccess();
      window.location.href = "/feed";
    } catch (error) {
      setStatus(error?.response?.data?.message || "Ошибка публикации.");
    } finally { setIsSubmitting(false); }
  }

  function addCustomTag() {
    const tag = tagInput.trim();
    if (!tag || customTags.includes(tag) || genres.includes(tag)) {
      setTagInput("");
      return;
    }
    setCustomTags(prev => [...prev, tag]);
    setTagInput("");
  }

  function removeCustomTag(tag) {
    setCustomTags((prev) => prev.filter((t) => t !== tag));
  }

  function togglePreset(tag) {
    setPresetPick((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
  }

  const combinedPresets = useMemo(() => [...new Set([...SUGGESTED_TAGS, ...apiPresets])], [apiPresets]);

  return (
    <form className={styles.form} onSubmit={submit}>
      <label className={styles.field}>
        <span>Название</span>
        <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required />
      </label>

      <label className={styles.field}>
        <span>Описание</span>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          placeholder="О чём ваш комикс..."
          className={styles.textarea}
        />
      </label>
      <div className={styles.genreBlock}>
        <span>Готовые теги</span>
        <div className={styles.genreTags}>
          {combinedPresets.map((tag) => (
            <button key={tag} type="button" className={presetPick.includes(tag) ? styles.genreTagActive : styles.genreTag} onClick={() => togglePreset(tag)}>
              {tag}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.field}>
        <span>Монетизация</span>
        <label className={styles.inlineCheck}>
          <input type="checkbox" checked={isPaid} onChange={(e) => setIsPaid(e.target.checked)} />
          Платный комикс (доступ целиком за цену)
        </label>
        <label>
          Цена ()
          <input type="number" min={0} step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} />
        </label>
      </div>

      <div className={styles.field}>
        <span>Статус комикса</span>
        <select value={comicStatus} onChange={(e) => setComicStatus(e.target.value)}>
          <option value="ongoing">В процессе</option>
          <option value="completed">Завершён</option>
          <option value="dropped">Заброшен</option>
          <option value="frozen">Заморожен</option>
        </select>
      </div>

      <div className={styles.genreBlock}>
        <span>Жанры</span>
        <div className={styles.genreTags}>
          {GENRES_COMIC.map((genre) => (
            <button key={genre} type="button" className={genres.includes(genre) ? styles.genreTagActive : styles.genreTag} onClick={() => toggleGenre(genre)}>{genre}</button>
          ))}
        </div>
      </div>
        
        {/* После жанров добавить: */}
<div className={styles.field}>
  <span>Свои теги</span>
  <div className={styles.tagInputRow}>
    <input 
      value={tagInput} 
      onChange={(e) => setTagInput(e.target.value)} 
      onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCustomTag())}
      placeholder="Введите тег и нажмите Enter"
    />
    <button type="button" onClick={addCustomTag}>+</button>
  </div>
  {customTags.length > 0 && (
    <div className={styles.customTags}>
      {customTags.map(tag => (
        <span key={tag} className={styles.customTag}>
          {tag} <button onClick={() => removeCustomTag(tag)}>×</button>
        </span>
      ))}
    </div>
  )}
</div>
      <div className={styles.coAuthorRow}>
        <button type="button" className={styles.coAuthorButton} onClick={requireAuth(() => setIsCoAuthorModalOpen(true))}>+ Добавить соавтора</button>
        {coAuthorIds.length > 0 && <p>Выбрано соавторов: {coAuthorIds.length}</p>}
      </div>

      <div className={styles.grid}>
        <label className={styles.uploadBox}>
          <span>Обложка (необязательно)</span>
          <input ref={coverInputRef} type="file" accept="image/*" onChange={async (e) => { const file = e.target.files?.[0] || null; if (!file) { setCoverImage(null); return; } setCoverImage(await compressToWebp(file, "cover")); }} />
          {coverPreview ? <Image src={coverPreview} alt="Превью" className={styles.preview} width={120} height={120} unoptimized /> : <p>Не выбрана</p>}
        </label>
        <label className={styles.uploadBox} onDragOver={(e) => e.preventDefault()} onDrop={async (e) => { e.preventDefault(); await handleZipFile(e.dataTransfer.files?.[0]); }}>
          <span>ZIP со страницами</span>
          <input ref={zipInputRef} type="file" accept=".zip" onChange={async (e) => await handleZipFile(e.target.files?.[0])} />
          <p>{zipFile ? zipFile.name : "Перетащите ZIP"}</p>
        </label>
      </div>

      {pages.length > 0 && (
        <div className={styles.pageList}>
          <h3>Порядок страниц</h3>
          <div className={styles.pageGrid}>
            {pages.map((page, idx) => (
              <div key={`${page.name}-${idx}`} className={styles.pageTile}>
                <Image src={page.previewUrl} alt={page.name} width={80} height={120} className={styles.pageThumb} unoptimized />
                <p className={styles.pageCaption} title={page.name}>{page.name}</p>
                <div className={styles.pageActions}>
                  <button type="button" onClick={() => movePage(idx, -1)}>↑</button>
                  <button type="button" onClick={() => movePage(idx, 1)}>↓</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className={styles.progressTrack}><div className={styles.progressFill} style={{ width: `${progress}%` }} /></div>
      <p className={styles.status}>{status}</p>

      <button className={styles.submitButton} type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Публикация..." : "Опубликовать"}
      </button>

      <CoAuthorModal isOpen={isCoAuthorModalOpen} selectedIds={coAuthorIds} onClose={() => setIsCoAuthorModalOpen(false)} onApply={(ids) => { setCoAuthorIds(ids); setIsCoAuthorModalOpen(false); }} />
    </form>
  );
}