// components/PostCard.jsx — простая карточка
"use client";

import Image from "next/image";
import Link from "next/link";
import { resolveStorageUrl } from "../src/utils/media";
import { getCoAuthorIds } from "../src/utils/postFilters";
import styles from "./PostCard.module.css";

export default function PostCard({ post, showProgress, profileUserId }) {
  const coverSrc = resolveStorageUrl(post.cover_path);
  const authorName = post?.user?.name || "Неизвестный автор";
  const authorId = post?.user?.id;
  const chapterCount = Number(post?.chapters_count) > 0 ? post.chapters_count : Array.isArray(post?.images) ? post.images.length : 0;

  const progressKey = typeof window !== "undefined" ? `eiry_reader_progress_${post.id}` : null;
  const progress = progressKey ? JSON.parse(localStorage.getItem(progressKey) || "null") : null;
  const readPercent =
    progress && progress.page > 1 && post.images?.length
      ? Math.round((progress.page / post.images.length) * 100)
      : 0;

  const isCoAuthorWork =
    profileUserId &&
    Number(post.user_id) !== Number(profileUserId) &&
    getCoAuthorIds(post).includes(Number(profileUserId));

  return (
    <Link href={`/comic/${post.id}`} className={styles.card}>
      <div className={styles.coverWrap}>
        <Image src={coverSrc} alt={post.title} fill className={styles.cover} sizes="(max-width: 768px) 100vw, 33vw" />
        {isCoAuthorWork && <span className={styles.coAuthorBadge}>Соавтор</span>}
        {post.is_paid && <span className={styles.paidBadge}>Платно</span>}
      </div>

      {readPercent > 0 && (
        <div className={styles.progressBar}>
          <div className={styles.progressFill} style={{ width: `${readPercent}%` }} />
          <span>{readPercent}%</span>
        </div>
      )}

      <div className={styles.info}>
        <h3 className={styles.title}>{post.title}</h3>
        <p className={styles.author} title={authorName}>
  {authorId ? (
    <span className={styles.authorName} onClick={(e) => {
      e.preventDefault();
      e.stopPropagation();
      window.location.href = `/profile/${authorId}`;
    }}>{authorName}</span>
  ) : authorName}
</p>
          <div className={styles.meta}>
            <span>{"★"} {Number(post.avg_rating || 0).toFixed(1)}</span>
            <span>{chapterCount} гл.</span>
          </div>
      </div>
    </Link>
  );
}