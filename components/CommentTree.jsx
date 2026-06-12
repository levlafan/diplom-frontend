"use client";

import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import Link from "next/link";
import { MessageSquare, CornerDownRight, ChevronLeft, ChevronRight, Trash2 } from "lucide-react";
import styles from "./CommentTree.module.css";

const COMMENTS_PER_PAGE = 5;

function normalizeList(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
}

function buildTree(flatList) {
  const map = {};
  const roots = [];
  
  flatList.forEach((item) => {
    map[item.id] = { ...item, replies: [] };
  });
  
  flatList.forEach((item) => {
    if (item.parent_id && map[item.parent_id]) {
      map[item.parent_id].replies.push(map[item.id]);
    } else {
      roots.push(map[item.id]);
    }
  });
  
  return roots;
}

export default function CommentTree({
  postId,
  token,
  apiUrl,
  endpoint = "posts",
  title = "Комментарии",
  placeholder = "Написать комментарий...",
  currentUserId = null, // Добавляем пропс для ID текущего пользователя
}) {
  const [allComments, setAllComments] = useState([]);
  const [comments, setComments] = useState([]);
  const [commentInput, setCommentInput] = useState("");
  const [replyTo, setReplyTo] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const loadComments = useCallback(async () => {
    if (!postId) return;
    setIsLoading(true);
    try {
      const res = await axios.get(`${apiUrl}/${endpoint}/${postId}/comments`);
      const data = normalizeList(res.data);
      setAllComments(data);
      
      const total = data.length;
      const start = (currentPage - 1) * COMMENTS_PER_PAGE;
      const end = start + COMMENTS_PER_PAGE;
      const paginated = data.slice(start, end);
      
      setComments(paginated);
      setTotalPages(Math.ceil(total / COMMENTS_PER_PAGE) || 1);
    } catch {
      setAllComments([]);
      setComments([]);
      setTotalPages(1);
    } finally {
      setIsLoading(false);
    }
  }, [apiUrl, postId, endpoint, currentPage]);

  useEffect(() => {
    loadComments();
  }, [loadComments]);

  const sendComment = async (parentId = null) => {
    const text = (parentId ? replyText : commentInput).trim();
    if (!text || !token || !postId) return;
    setIsSending(true);
    try {
      await axios.post(
        `${apiUrl}/${endpoint}/${postId}/comments`,
        { content: text, ...(parentId ? { parent_id: parentId } : {}) },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (parentId) {
        setReplyText("");
        setReplyTo(null);
      } else {
        setCommentInput("");
      }
      await loadComments();
    } catch {
      /* ignore */
    } finally {
      setIsSending(false);
    }
  };

  const deleteComment = async (commentId) => {
    if (!token || !postId) return;
    
    const confirmed = confirm("Вы уверены, что хотите удалить этот комментарий?");
    if (!confirmed) return;
    
    setIsDeleting(true);
    try {
      await axios.delete(`${apiUrl}/${endpoint}/${postId}/comments/${commentId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      await loadComments();
    } catch (error) {
      console.error("Ошибка при удалении комментария:", error);
      alert("Не удалось удалить комментарий");
    } finally {
      setIsDeleting(false);
    }
  };

  const replyChainLabel = (comment) => {
    const authorName = comment.user?.name || "Пользователь";
    const targetName = comment.parent?.user?.name;
    if (targetName) return `${authorName} > ${targetName}`;
    return authorName;
  };

  const countComments = (items) =>
    items.reduce((acc, c) => acc + 1 + (c.replies?.length ? countComments(c.replies) : 0), 0);

  const canDeleteComment = (comment) => {
    // Пользователь может удалить свой комментарий
    return token && currentUserId && comment.user?.id === currentUserId;
  };

  const renderComment = (comment, depth = 0) => (
    <div
      key={comment.id}
      className={styles.commentWrapper}
      style={{ marginLeft: depth > 0 ? Math.min(depth * 20, 80) : 0 }}
    >
      <article className={styles.commentItem}>
        <header className={styles.commentHeader}>
          <Link href={`/profile/${comment.user?.id}`} className={styles.commentUser}>
            {replyChainLabel(comment)}
          </Link>
          <div className={styles.commentMeta}>
            <time className={styles.commentDate}>
              {new Date(comment.created_at).toLocaleString("ru-RU")}
            </time>
            {canDeleteComment(comment) && (
              <button
                type="button"
                className={styles.deleteBtn}
                onClick={() => deleteComment(comment.id)}
                disabled={isDeleting}
                title="Удалить комментарий"
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
        </header>
        <p className={styles.commentContent}>{comment.content}</p>

        {token && (
          <button
            type="button"
            className={styles.replyBtn}
            onClick={() => setReplyTo(replyTo === comment.id ? null : comment.id)}
          >
            <CornerDownRight size={14} /> Ответить
          </button>
        )}

        {replyTo === comment.id && (
          <div className={styles.replyForm}>
            <textarea
              className={styles.textarea}
              rows={2}
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Ваш ответ..."
            />
            <button
              type="button"
              className={styles.submitBtn}
              disabled={isSending || !replyText.trim()}
              onClick={() => sendComment(comment.id)}
            >
              Отправить
            </button>
          </div>
        )}
      </article>

      {comment.replies?.length > 0 && (
        <div className={styles.replies}>
          {comment.replies.map((reply) => renderComment(reply, depth + 1))}
        </div>
      )}
    </div>
  );

  const total = countComments(comments);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  if (isLoading) {
    return <p className={styles.loading}>Загрузка комментариев...</p>;
  }

  return (
    <section className={styles.section}>
      <h2 className={styles.title}>
        <MessageSquare size={20} /> {title} ({total})
      </h2>

      <form
        className={styles.form}
        onSubmit={(e) => {
          e.preventDefault();
          sendComment();
        }}
      >
        <textarea
          className={styles.textarea}
          rows={3}
          placeholder={token ? placeholder : "Войдите, чтобы оставить комментарий"}
          value={commentInput}
          onChange={(e) => setCommentInput(e.target.value)}
          disabled={!token}
        />
        <button type="submit" className={styles.submitBtn} disabled={!token || isSending || !commentInput.trim()}>
          Отправить
        </button>
      </form>

      {comments.length === 0 ? (
        <p className={styles.empty}>Пока нет комментариев — будьте первым.</p>
      ) : (
        <>
          <div className={styles.list}>{comments.map((c) => renderComment(c))}</div>
          {totalPages > 1 && (
            <div className={styles.pagination}>
              <button
                type="button"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className={styles.pageButton}
              >
                <ChevronLeft size={16} />
              </button>
              <span className={styles.pageInfo}>
                {currentPage} / {totalPages}
              </span>
              <button
                type="button"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={styles.pageButton}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </>
      )}
    </section>
  );
}