"use client";

import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import Link from "next/link";
import { MessageSquare, Send, CornerDownRight, ChevronLeft, ChevronRight } from "lucide-react";
import styles from "./CommentsSection.module.css";

const COMMENTS_PER_PAGE = 10;

function normalizeList(payload) {
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload)) return payload;
  return [];
}

export default function CommentsSection({ postId, userId, token, apiUrl, userPosts = [] }) {
  const [comments, setComments] = useState([]);
  const [commentInput, setCommentInput] = useState("");
  const [replyTo, setReplyTo] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [profilePostId, setProfilePostId] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const loadComments = useCallback(async () => {
    setIsLoading(true);
    try {
      let res;
      let data;
      let meta;

      if (postId) {
        res = await axios.get(`${apiUrl}/posts/${postId}/comments`, {
          params: { page: currentPage, per_page: COMMENTS_PER_PAGE }
        });
        data = normalizeList(res.data);
        meta = res.data?.meta || {};
      } else if (userId) {
        res = await axios.get(`${apiUrl}/users/${userId}/comments`, {
          params: { page: currentPage, per_page: COMMENTS_PER_PAGE }
        });
        data = normalizeList(res.data);
        meta = res.data?.meta || {};
      } else {
        data = [];
        meta = {};
      }

      setComments(data);
      setTotalPages(meta?.last_page || Math.ceil((meta?.total || data.length) / COMMENTS_PER_PAGE) || 1);
    } catch {
      setComments([]);
      setTotalPages(1);
    } finally {
      setIsLoading(false);
    }
  }, [apiUrl, postId, userId, currentPage]);

  useEffect(() => {
    loadComments();
  }, [loadComments]);

  useEffect(() => {
    if (!userPosts.length) return;
    setProfilePostId((prev) => prev || String(userPosts[0].id));
  }, [userPosts]);

  const activePostId = postId || profilePostId;

  const sendComment = async () => {
    const text = commentInput.trim();
    if (!text || !token || !activePostId) return;
    try {
      await axios.post(
        `${apiUrl}/posts/${activePostId}/comments`,
        { content: text },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setCommentInput("");
      await loadComments();
    } catch {}
  };

  const sendReply = async (parentComment) => {
    const text = replyText.trim();
    const targetPostId = parentComment.post_id || postId || profilePostId;
    if (!text || !token || !targetPostId) return;
    try {
      await axios.post(
        `${apiUrl}/posts/${targetPostId}/comments`,
        { content: text, parent_id: parentComment.id },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setReplyText("");
      setReplyTo(null);
      await loadComments();
    } catch {}
  };

  const replyChainLabel = (comment) => {
    const authorName = comment.user?.name || "Пользователь";
    const targetName = comment.parent?.user?.name;
    if (targetName) return `${authorName} > ${targetName}`;
    return authorName;
  };

  const renderComment = (comment, depth = 0) => (
    <div key={comment.id} className={styles.commentWrapper} style={{ marginLeft: depth > 0 ? depth * 20 : 0 }}>
      <div className={styles.commentItem}>
        <div className={styles.commentHeader}>
          <div className={styles.commentMeta}>
            <Link href={`/profile/${comment.user?.id}`} className={styles.commentUser}>
              {replyChainLabel(comment)}
            </Link>
            {comment.post && (
              <Link href={`/comic/${comment.post_id || comment.post?.id}`} className={styles.commentPost}>
                {comment.post.title}
              </Link>
            )}
          </div>
          <span className={styles.commentDate}>
            {new Date(comment.created_at).toLocaleDateString("ru-RU")}
          </span>
        </div>
        <p className={styles.commentContent}>{comment.content}</p>

        {token && activePostId && (
          <button
            type="button"
            className={styles.replyBtn}
            onClick={() => setReplyTo(replyTo === comment.id ? null : comment.id)}
          >
            <CornerDownRight size={14} /> Ответить
          </button>
        )}

        {replyTo === comment.id && (
          <div className={styles.replyInput}>
            <input
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Ваш ответ..."
              className={styles.input}
              onKeyDown={(e) => e.key === "Enter" && sendReply(comment)}
            />
            <button type="button" onClick={() => sendReply(comment)} className={styles.sendBtn}>
              <Send size={14} />
            </button>
          </div>
        )}
      </div>

      {comment.replies?.length > 0 &&
        comment.replies.map((reply) => renderComment(reply, depth + 1))}
    </div>
  );

  const totalCount = comments.reduce((acc, c) => acc + 1 + (c.replies?.length || 0), 0);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  if (isLoading) return <div className={styles.loading}>Загрузка комментариев...</div>;

  const rootClass = `${styles.comments}${userId && !postId ? ` ${styles.profileVariant}` : ""}`;

  return (
    <div className={rootClass}>
      <h2 className={styles.title}>
        <MessageSquare size={18} /> Комментарии ({totalCount || comments.length})
      </h2>

      {(postId || userId) && (
        <div className={styles.commentForm}>
          {userId && !postId && userPosts.length > 0 && (
            <select
              className={styles.postSelect}
              value={profilePostId}
              onChange={(e) => setProfilePostId(e.target.value)}
            >
              {userPosts.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </select>
          )}
          <div className={styles.commentInput}>
            <input
              type="text"
              placeholder={token ? "Написать комментарий..." : "Войдите, чтобы комментировать"}
              value={commentInput}
              onChange={(e) => setCommentInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendComment()}
              disabled={!token}
              className={styles.input}
            />
            <button
              type="button"
              onClick={sendComment}
              disabled={!token || !commentInput.trim() || !activePostId}
              className={styles.sendBtn}
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      )}

      {comments.length === 0 ? (
        <p className={styles.empty}>Пока нет комментариев</p>
      ) : (
        <>
          <div className={styles.list}>
            {comments.map((comment) => renderComment(comment))}
          </div>
          {totalPages > 1 && (
            <div className={styles.pagination}>
              <button
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
    </div>
  );
}