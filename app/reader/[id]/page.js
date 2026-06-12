"use client";

import { useCallback, useEffect, useRef, useState, Suspense } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Image from "next/image";
import axios from "axios";
import { resolveStorageUrl } from "../../../src/utils/media";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Sun, Moon, ZoomIn, ZoomOut, X } from "lucide-react";
import { useAuth } from "../../../src/context/AuthContext";
import styles from "./page.module.css";

export default function ReaderPage() {
  return (
    <Suspense fallback={<main className={styles.page}><section className={styles.container}>Загрузка...</section></main>}>
      <ReaderPageInner />
    </Suspense>
  );
}

function ReaderPageInner() {
  const params = useParams();
  const searchParams = useSearchParams();
  const { token, user, login } = useAuth();
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

  const [postMeta, setPostMeta] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [chapterNum, setChapterNum] = useState(() => Math.max(1, Number(searchParams.get("chapter") || 1)));
  const [readerPayload, setReaderPayload] = useState(null);
  const [mode, setMode] = useState("horizontal");
  const [theme, setTheme] = useState("dark");
  const [zoom, setZoom] = useState(100);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loadError, setLoadError] = useState("");

  const webtoonRef = useRef(null);

  const headers = token ? { Authorization: `Bearer ${token}` } : {};

  useEffect(() => {
    const ch = Math.max(1, Number(searchParams.get("chapter") || 1));
    setChapterNum(ch);
  }, [searchParams]);

  useEffect(() => {
    axios
      .get(`${apiUrl}/posts/${params.id}`)
      .then((res) => setPostMeta(res.data))
      .catch(() => setPostMeta(null));
    axios
      .get(`${apiUrl}/posts/${params.id}/chapters`)
      .then((res) => setChapters(res.data.chapters || []))
      .catch(() => setChapters([]));
  }, [params.id, apiUrl]);

  const loadReader = useCallback(async () => {
    setLoadError("");
    try {
      const res = await axios.get(`${apiUrl}/posts/${params.id}/reader?chapter=${chapterNum}`, { headers });
      setReaderPayload(res.data);
      setCurrentIndex(0);
    } catch (e) {
      setLoadError("Не удалось загрузить главу");
      setReaderPayload(null);
    }
  }, [apiUrl, params.id, chapterNum, token]);

  useEffect(() => {
    loadReader();
  }, [loadReader]);

  const pages = readerPayload?.locked ? [] : readerPayload?.pages || [];
  const locked = readerPayload?.locked;

  // Сохраняем прогресс в localStorage И отправляем на сервер
  const saveProgress = useCallback(async (page) => {
    if (!postMeta?.id || locked || !pages.length) return;
    
    // Сохраняем в localStorage
    localStorage.setItem(
      `eiry_reader_progress_${postMeta.id}`,
      JSON.stringify({ chapter: chapterNum, page: page + 1, mode })
    );
    
    // Отправляем на сервер
    if (!token) return;
    try {
      await axios.post(
        `${apiUrl}/chapter-reads`,
        { 
          post_id: postMeta.id, 
          chapter_number: chapterNum,
          page: page + 1
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch {
      /* ignore */
    }
  }, [apiUrl, chapterNum, postMeta?.id, token, locked, pages.length]);

  // Сохраняем при изменении страницы
  useEffect(() => {
    if (currentIndex === 0) return;
    saveProgress(currentIndex);
  }, [currentIndex, saveProgress]);

  // Сохраняем при завершении главы
  const recordChapterRead = useCallback(async () => {
    if (!token || !postMeta?.id || locked) return;
    try {
      await axios.post(
        `${apiUrl}/chapter-reads`,
        { post_id: postMeta.id, chapter_number: chapterNum },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch {
      /* ignore */
    }
  }, [apiUrl, chapterNum, postMeta?.id, token, locked]);

  // Отмечаем главу прочитанной при достижении конца
  useEffect(() => {
    if (mode !== "horizontal" || locked || !pages.length) return;
    if (currentIndex === pages.length - 1) {
      recordChapterRead();
    }
  }, [currentIndex, mode, pages.length, locked, recordChapterRead]);

  // Для webtoon режима
  useEffect(() => {
    if (mode !== "webtoon" || locked || !pages.length || !webtoonRef.current) return;
    const el = webtoonRef.current;
    let done = false;
    const onScroll = () => {
      if (done) return;
      const { scrollTop, scrollHeight, clientHeight } = el;
      if (scrollHeight - scrollTop - clientHeight < 120) {
        done = true;
        recordChapterRead();
      }
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [mode, locked, pages.length, recordChapterRead]);

  // Клавиши навигации
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (mode === "webtoon" || locked) return;
      switch (event.key) {
        case "ArrowLeft":
        case "a":
        case "A":
          setCurrentIndex((prev) => Math.max(0, prev - 1));
          break;
        case "ArrowRight":
        case "d":
        case "D":
          setCurrentIndex((prev) => Math.min(pages.length - 1, prev + 1));
          break;
        case "Home":
          setCurrentIndex(0);
          break;
        case "End":
          setCurrentIndex(Math.max(0, pages.length - 1));
          break;
        default:
          break;
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mode, pages.length, locked]);

  async function purchase(useFreeUnlock) {
    if (!token) {
      window.location.href = "/login";
      return;
    }
    try {
      if (readerPayload?.need === "purchase_full") {
        await axios.post(
          `${apiUrl}/wallet/purchase-post`,
          { post_id: Number(params.id), use_free_unlock: useFreeUnlock ? true : undefined },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } else if (readerPayload?.need === "purchase_chapter") {
        await axios.post(
          `${apiUrl}/wallet/purchase-chapter`,
          { post_id: Number(params.id), chapter_number: readerPayload.chapter_number },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }
      const me = await axios.get(`${apiUrl}/auth/me`, { headers: { Authorization: `Bearer ${token}` } });
      if (user) login(me.data, token);
      await loadReader();
    } catch (e) {
      alert(e?.response?.data?.message || e?.response?.data?.errors?.wallet?.[0] || "Ошибка оплаты");
    }
  }

  const goChapter = (delta) => {
    const list = [...chapters].sort((a, b) => a.number - b.number);
    const idx = list.findIndex((c) => c.number === chapterNum);
    const next = list[idx + delta];
    if (!next) return;
    setChapterNum(next.number);
    window.history.replaceState(null, "", `/reader/${params.id}?chapter=${next.number}`);
  };

  const canFreeUnlock =
    readerPayload?.need === "purchase_full" && token && Number(user?.free_unlock_credits || 0) > 0;

  if (!postMeta && !loadError) {
    return (
      <main className={styles.page}>
        <section className={styles.container}>Загрузка...</section>
      </main>
    );
  }

  return (
    <main className={`${styles.page} ${styles[theme]}`}>
      <div className={styles.toolbar}>
        <Link href={`/comic/${params.id}`} className={styles.backBtn}>
          <X size={20} />
        </Link>
        <h1 className={styles.title}>{postMeta?.title || "Комикс"}</h1>
        <div className={styles.chapterPick}>
          <button type="button" className={styles.btn} onClick={() => goChapter(-1)} disabled={!chapters.length}>
            ◀ глава
          </button>
          <select
            className={styles.chapterSelect}
            value={chapterNum}
            onChange={(e) => {
              const n = Number(e.target.value);
              setChapterNum(n);
              window.history.replaceState(null, "", `/reader/${params.id}?chapter=${n}`);
            }}
          >
            {[...chapters]
              .sort((a, b) => a.number - b.number)
              .map((c) => (
                <option key={c.id || c.number} value={c.number}>
                  {c.title || `Глава ${c.number}`}
                </option>
              ))}
          </select>
          <button type="button" className={styles.btn} onClick={() => goChapter(1)} disabled={!chapters.length}>
            глава ▶
          </button>
        </div>
        <div className={styles.controls}>
          <button type="button" onClick={() => setMode("horizontal")} className={`${styles.btn} ${mode === "horizontal" ? styles.btnActive : ""}`}>
            Горизонтально
          </button>
          <button type="button" onClick={() => setMode("webtoon")} className={`${styles.btn} ${mode === "webtoon" ? styles.btnActive : ""}`}>
            Вертикально
          </button>
          <button type="button" onClick={() => setZoom((z) => Math.max(50, z - 10))} className={styles.btn}>
            <ZoomOut size={18} />
          </button>
          <span className={styles.zoomLabel}>{zoom}%</span>
          <button type="button" onClick={() => setZoom((z) => Math.min(200, z + 10))} className={styles.btn}>
            <ZoomIn size={18} />
          </button>
        </div>
      </div>

      {loadError && (
        <section className={styles.container}>
          <p>{loadError}</p>
        </section>
      )}

      {locked && readerPayload && (
        <section className={styles.paywall}>
          <h2>Платная глава</h2>
          <p>
            {readerPayload.post?.title}: {readerPayload.chapter_title || `Глава ${readerPayload.chapter_number}`}
          </p>
          <p className={styles.price}>Стоимость доступа: {Number(readerPayload.price || 0).toFixed(2)} </p>
          {canFreeUnlock && (
            <button type="button" className={styles.payBtnFree} onClick={() => purchase(true)}>
              Использовать бесплатную разблокировку ({user?.free_unlock_credits})
            </button>
          )}
          <button type="button" className={styles.payBtn} onClick={() => purchase(false)}>
            {token ? "Оплатить с кошелька" : "Войти и оплатить"}
          </button>
          <Link href="/wallet" className={styles.walletLink}>
            Пополнить кошелёк
          </Link>
        </section>
      )}

      {!locked && mode === "horizontal" && pages.length > 0 && (
        <div className={styles.reader}>
          <button type="button" onClick={() => setCurrentIndex((p) => Math.max(0, p - 1))} disabled={currentIndex === 0} className={styles.navBtn}>
            <ChevronLeft size={32} />
          </button>
          <div className={styles.pageWrap}>
            <Image
              src={resolveStorageUrl(pages[currentIndex])}
              alt={`Страница ${currentIndex + 1}`}
              width={980 * (zoom / 100)}
              height={1380 * (zoom / 100)}
              className={styles.image}
              unoptimized
              style={{ transform: `scale(${zoom / 100})`, transformOrigin: "top center" }}
            />
            <div className={styles.pageNum}>
              {currentIndex + 1} / {pages.length} · глава {chapterNum}
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              if (currentIndex < pages.length - 1) {
                setCurrentIndex((p) => p + 1);
                return;
              }
              const list = [...chapters].sort((a, b) => a.number - b.number);
              const idx = list.findIndex((c) => c.number === chapterNum);
              if (idx >= 0 && idx < list.length - 1) {
                const next = list[idx + 1];
                setChapterNum(next.number);
                window.history.replaceState(null, "", `/reader/${params.id}?chapter=${next.number}`);
              }
            }}
            disabled={(() => {
              const list = [...chapters].sort((a, b) => a.number - b.number);
              const lastCh = list.length ? list[list.length - 1].number === chapterNum : true;
              return currentIndex >= pages.length - 1 && lastCh;
            })()}
            className={styles.navBtn}
          >
            <ChevronRight size={32} />
          </button>
        </div>
      )}

      {!locked && mode === "webtoon" && pages.length > 0 && (
        <div className={styles.webtoon} ref={webtoonRef}>
          {pages.map((item, idx) => (
            <Image
              key={`${item}-${idx}`}
              src={resolveStorageUrl(item)}
              alt={`Страница ${idx + 1}`}
              width={980 * (zoom / 100)}
              height={1380 * (zoom / 100)}
              className={styles.image}
              unoptimized
              style={{ transform: `scale(${zoom / 100})`, transformOrigin: "top center" }}
            />
          ))}
        </div>
      )}
    </main>
  );
}