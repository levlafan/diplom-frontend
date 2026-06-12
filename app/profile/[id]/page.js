"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import axios from "axios";
import { useAuth } from "../../../src/context/AuthContext";
import PostCard from "../../../components/PostCard";
import { useProtectedAction } from "../../../src/utils/useProtectedAction";
import ProfileSettingsModal from "../../../components/ProfileSettingsModal";
import CommentsSection from "../../../components/CommentsSection";
import DailyRewardCalendar from "../../../components/DailyRewardCalendar";
import AchievementsCarousel from "../../../components/AchievementsCarousel";
import { filterProfilePosts } from "../../../src/utils/postFilters";
import { resolveStorageUrl } from "../../../src/utils/media";
import { ALL_ACHIEVEMENTS } from "../../../src/utils/achievements";
import {
  BookOpen, CheckCircle, Clock, Bookmark, Settings,
  Heart, Library, CheckCircle2, MessageSquare,
  Trophy, Star, Zap, Award, Flame, Crown,
  ChevronLeft, ChevronRight, Users, X, PenTool,
} from "lucide-react";
import styles from "./page.module.css";

const LIBRARY_COLLECTIONS = {
  reading: { label: "Читаю", icon: BookOpen, emptyText: "Нет комиксов в чтении" },
  completed: { label: "Прочитано", icon: CheckCircle, emptyText: "Нет прочитанных комиксов" },
  planned: { label: "В планах", icon: Clock, emptyText: "Нет запланированных комиксов" },
  favorites: { label: "Избранное", icon: Bookmark, emptyText: "Нет избранных комиксов" },
};

const ITEMS_PER_PAGE = 10;
const ACTIVITY_PER_PAGE = 5;

function normalizePosts(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
}

export default function ProfilePage() {
  const params = useParams();
  const { user: currentUser, token } = useAuth();
  const { requireAuth } = useProtectedAction();
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [tab, setTab] = useState("works");
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [following, setFollowing] = useState([]);
  const [isFollowingModalOpen, setIsFollowingModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [userLibrary, setUserLibrary] = useState({});
  const [libraryTab, setLibraryTab] = useState("reading");
  const [achievements, setAchievements] = useState([]);
  const [worksPage, setWorksPage] = useState(1);
  const [libraryPage, setLibraryPage] = useState(1);
  const [activities, setActivities] = useState([]);
  const [activityPage, setActivityPage] = useState(1);
  const [stats, setStats] = useState(null);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

  useEffect(() => {
    if (typeof window === "undefined") return;
    const qs = new URLSearchParams(window.location.search).get("tab");
    if (qs === "library") setTab("library");
    if (qs === "comments") setTab("comments");
  }, [params.id]);

  useEffect(() => {
    axios.get(`${apiUrl}/users`, { params: { search: "" } }).then((res) => {
      const rows = Array.isArray(res.data) ? res.data : [];
      const found = rows.find((item) => String(item.id) === String(params.id)) || null;
      setProfile(found);
      setFollowersCount(Number(found?.followers_count || 0));
      setFollowingCount(Number(found?.following_count || 0));
    });
  }, [params.id, apiUrl]);

  useEffect(() => {
    axios
      .get(`${apiUrl}/posts`, { params: { user_id: params.id } })
      .then((res) => setPosts(normalizePosts(res.data)))
      .catch(() => setPosts([]));
  }, [params.id, apiUrl]);

  useEffect(() => {
    const loadLibrary = () => {
      axios
        .get(`${apiUrl}/users/${params.id}/library`)
        .then((res) => setUserLibrary(res.data.library || {}))
        .catch(() => setUserLibrary({}));
    };
    loadLibrary();
    window.addEventListener("library-updated", loadLibrary);
    return () => window.removeEventListener("library-updated", loadLibrary);
  }, [params.id, apiUrl]);

  useEffect(() => {
    if (!currentUser?.id) return;
    try {
      const ids = JSON.parse(localStorage.getItem(`eiry_following_${currentUser.id}`) || "[]");
      setIsFollowing(ids.includes(Number(params.id)));
    } catch {}
  }, [currentUser?.id, params.id]);

  useEffect(() => {
    axios.get(`${apiUrl}/users/${params.id}/achievements`).then((res) => setAchievements(res.data));
  }, [params.id, apiUrl]);

  useEffect(() => {
    axios.get(`${apiUrl}/users/${params.id}/activity`).then((r) => setActivities(r.data));
  }, [params.id, apiUrl]);

  useEffect(() => {
    axios.get(`${apiUrl}/users/${params.id}/stats`).then((r) => setStats(r.data)).catch(() => setStats(null));
  }, [params.id, apiUrl]);

 useEffect(() => {
  if (!token) return;
  
  axios.get(`${apiUrl}/users/${params.id}/following`, {
    headers: { Authorization: `Bearer ${token}` }
  })
  .then((r) => {
    const data = Array.isArray(r.data) ? r.data : [];
    setFollowing(data);
    setFollowingCount(data.length);
  })
  .catch((err) => {
    console.error('Ошибка загрузки подписок:', err);
    setFollowing([]);
  });
}, [params.id, apiUrl, token]);

  // Периодическое обновление счётчика подписчиков
  useEffect(() => {
    const interval = setInterval(() => {
      axios.get(`${apiUrl}/users`, { params: { search: "" } }).then((res) => {
        const rows = Array.isArray(res.data) ? res.data : [];
        const found = rows.find((item) => String(item.id) === String(params.id)) || null;
        if (found) {
          setFollowersCount(Number(found?.followers_count || 0));
          setFollowingCount(Number(found?.following_count || 0));
        }
      });
    }, 30000);

    return () => clearInterval(interval);
  }, [params.id, apiUrl]);

  async function toggleFollow() {
    if (!currentUser?.id || Number(currentUser.id) === Number(params.id)) return;
    const key = `eiry_following_${currentUser.id}`;
    const ids = JSON.parse(localStorage.getItem(key) || "[]");
    const targetId = Number(params.id);
    const next = isFollowing ? ids.filter((id) => id !== targetId) : [...ids, targetId];
    try {
      const headers = { Authorization: `Bearer ${localStorage.getItem("eiry_token") || ""}` };
      const res = isFollowing
        ? await axios.delete(`${apiUrl}/profiles/${targetId}/follow`, { headers })
        : await axios.post(`${apiUrl}/profiles/${targetId}/follow`, {}, { headers });
      if (typeof res.data?.followers_count === "number") setFollowersCount(res.data.followers_count);
      localStorage.setItem(key, JSON.stringify(next));
      setIsFollowing(!isFollowing);
    } catch {}
  }

  const isSelfProfile = Boolean(currentUser?.id && String(currentUser.id) === String(params.id));
  const avatarUrl = resolveStorageUrl(profile?.avatar);
  const currentLibraryItems = userLibrary[libraryTab] || [];

  const filteredWorks = useMemo(
    () =>
      filterProfilePosts(posts, params.id, {
        searchTerm: "",
        selectedGenre: "",
        selectedTags: [],
      }),
    [posts, params.id]
  );

  const paginatedWorks = filteredWorks.slice(
    (worksPage - 1) * ITEMS_PER_PAGE,
    worksPage * ITEMS_PER_PAGE
  );
  const paginatedLibrary = currentLibraryItems.slice(
    (libraryPage - 1) * ITEMS_PER_PAGE,
    libraryPage * ITEMS_PER_PAGE
  );
  const paginatedActivities = activities.slice(
    (activityPage - 1) * ACTIVITY_PER_PAGE,
    activityPage * ACTIVITY_PER_PAGE
  );

  const totalWorksPages = Math.ceil(filteredWorks.length / ITEMS_PER_PAGE) || 1;
  const totalLibraryPages = Math.ceil(currentLibraryItems.length / ITEMS_PER_PAGE) || 1;
  const totalActivityPages = Math.ceil(activities.length / ACTIVITY_PER_PAGE) || 1;

  const getActivityIcon = (type) => {
    switch (type) {
      case "like": return <Heart size={18} color="#FE4C02" fill="#FE4C02" />;
      case "library_add": return <Library size={18} color="#FE4C02" />;
      case "library_complete": return <CheckCircle2 size={18} color="#10b981" />;
      case "comment": return <MessageSquare size={18} color="#3b82f6" />;
      case "create_comic": return <PenTool size={18} color="#f59e0b" />;
      case "read_chapter": return <BookOpen size={18} color="#8b5cf6" />;
      default: return <Zap size={18} color="#888" />;
    }
  };

  const getActivityText = (activity) => {
    const data = activity.data || {};
    const postId = data.post_id;
    const postTitle = data.post_title || "комикс";
    const chapter = data.chapter;
    const collectionLabel = data.collection_label || data.collection;

    switch (activity.type) {
      case "like":
        return (
          <>
            Лайкнул комикс{" "}
            {postId ? (
              <Link href={`/comic/${postId}`} className={styles.activityLink}>
                {postTitle}
              </Link>
            ) : (
              <span>{postTitle}</span>
            )}
          </>
        );
      case "library_add":
        return (
          <>
            Добавил комикс{" "}
            {postId ? (
              <Link href={`/comic/${postId}`} className={styles.activityLink}>
                {postTitle}
              </Link>
            ) : (
              <span>{postTitle}</span>
            )}{" "}
            в {collectionLabel || "библиотеку"}
          </>
        );
      case "library_complete":
        return (
          <>
            Завершил чтение комикса{" "}
            {postId ? (
              <Link href={`/comic/${postId}`} className={styles.activityLink}>
                {postTitle}
              </Link>
            ) : (
              <span>{postTitle}</span>
            )}
          </>
        );
      case "comment":
        return (
          <>
            Прокомментировал комикс{" "}
            {postId ? (
              <Link href={`/comic/${postId}`} className={styles.activityLink}>
                {postTitle}
              </Link>
            ) : (
              <span>{postTitle}</span>
            )}
          </>
        );
      case "create_comic":
        return (
          <>
            Опубликовал новый комикс{" "}
            {postId ? (
              <Link href={`/comic/${postId}`} className={styles.activityLink}>
                {postTitle}
              </Link>
            ) : (
              <span>{postTitle}</span>
            )}
          </>
        );
      case "read_chapter":
        return (
          <>
            Прочитал {chapter || ""} главу комикса{" "}
            {postId ? (
              <Link href={`/comic/${postId}`} className={styles.activityLink}>
                {postTitle}
              </Link>
            ) : (
              <span>{postTitle}</span>
            )}
          </>
        );
      default:
        return activity.type || "Действие";
    }
  };

  return (
    <main className={styles.page}>
      <div className={styles.profileContainer}>
        <section className={styles.container}>
          <div className={styles.header}>
            <div className={styles.profileInfo}>
              <div className={styles.avatarWrapper}>
                {avatarUrl ? (
                  <Image src={avatarUrl} alt={profile?.name || ""} fill className={styles.profileAvatar} unoptimized />
                ) : (
                  <div className={styles.avatarPlaceholder}>{(profile?.name || "A").charAt(0)}</div>
                )}
              </div>
              <div className={styles.profileDetails}>
                <h1>{profile?.name || "Профиль автора"}</h1>
                <p className={styles.bio}>{profile?.bio || "Информация о себе не заполнена"}</p>
                <div className={styles.statsLinks}>
                  <span>Подписчики: {followersCount}</span>
                  <button 
                    className={styles.statsLinkBtn}
                    onClick={() => setIsFollowingModalOpen(true)}
                  >
                    Подписки: {followingCount}
                  </button>
                </div>
              </div>
            </div>
            <div className={styles.actions}>
              {isSelfProfile && (
                <button type="button" className={styles.iconGear} onClick={() => setIsSettingsOpen(true)}>
                  <Settings size={20} />
                </button>
              )}
              <button type="button" onClick={requireAuth(toggleFollow)} disabled={isSelfProfile}>
                {isSelfProfile ? "Это вы" : isFollowing ? "Вы подписаны" : "Подписаться"}
              </button>
            </div>
          </div>

          {stats && (
            <div className={styles.statsRow}>
              <div className={styles.statCard}><span>{stats.chapters_read}</span><small>глав прочитано</small></div>
              <div className={styles.statCard}><span>{stats.days_on_site}</span><small>дней на сайте</small></div>
              <div className={styles.statCard}><span>{stats.projects_count}</span><small>проектов</small></div>
            </div>
          )}

          {isSelfProfile && (
            <div className={styles.dailyWrap}>
              <DailyRewardCalendar compact />
            </div>
          )}

          <div className={styles.tabs}>
            <button type="button" className={tab === "works" ? styles.tabActive : ""} onClick={() => setTab("works")}>
              Работы
            </button>
            <button type="button" className={tab === "library" ? styles.tabActive : ""} onClick={() => setTab("library")}>
              Библиотека
            </button>
          </div>

          <div className={styles.contentContainer}>
            {tab === "library" ? (
              <div className={styles.librarySection}>
                <div className={styles.libraryTabs}>
                  {Object.entries(LIBRARY_COLLECTIONS).map(([key, { label, icon: Icon }]) => (
                    <button
                      key={key}
                      type="button"
                      className={`${styles.libraryTab} ${libraryTab === key ? styles.libraryTabActive : ""}`}
                      onClick={() => { setLibraryTab(key); setLibraryPage(1); }}
                    >
                      <Icon size={16} />
                      <span>{label}</span>
                      {userLibrary[key]?.length > 0 && (
                        <span className={styles.miniBadge}>{userLibrary[key].length}</span>
                      )}
                    </button>
                  ))}
                </div>
                {paginatedLibrary.length > 0 ? (
                  <div className={styles.grid}>
                    {paginatedLibrary.map((p) => <PostCard key={`lib-${p.id}`} post={p} />)}
                  </div>
                ) : (
                  <div className={styles.emptyState}>
                    <p>{LIBRARY_COLLECTIONS[libraryTab]?.emptyText}</p>
                  </div>
                )}
                {totalLibraryPages > 1 && (
                  <div className={styles.pagination}>
                    <button type="button" onClick={() => setLibraryPage((p) => Math.max(1, p - 1))} disabled={libraryPage === 1}>←</button>
                    <span>{libraryPage}/{totalLibraryPages}</span>
                    <button type="button" onClick={() => setLibraryPage((p) => p + 1)} disabled={libraryPage >= totalLibraryPages}>→</button>
                  </div>
                )}
              </div>
            ) : (
              <>
                {paginatedWorks.length > 0 ? (
                  <div className={styles.worksGrid}>
                    {paginatedWorks.map((p) => (
                      <PostCard key={`work-${p.id}`} post={p} profileUserId={params.id} />
                    ))}
                  </div>
                ) : (
                  <div className={styles.emptyState}>
                    <p>{posts.length > 0 ? "Нет работ" : "Нет работ"}</p>
                  </div>
                )}
                
                {totalWorksPages > 1 && (
                  <div className={styles.pagination}>
                    <button type="button" onClick={() => setWorksPage((p) => Math.max(1, p - 1))} disabled={worksPage === 1}>
                      <ChevronLeft size={16} />
                    </button>
                    <span>{worksPage} / {totalWorksPages}</span>
                    <button type="button" onClick={() => setWorksPage((p) => p + 1)} disabled={worksPage >= totalWorksPages}>
                      <ChevronRight size={16} />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Достижения */}
          <div className={styles.achievements}>
            <div className={styles.achievementsHeader}>
              <h3>Достижения</h3>
              <Link href="/achievements" className={styles.viewAllAchievements}>
                Все достижения →
              </Link>
            </div>
            <AchievementsCarousel 
              userAchievements={achievements}
            />
          </div>
          
          <div className={styles.activityFeed}>
            <h3>Активность</h3>
            <div className={styles.activityList}>
              {paginatedActivities.map((a) => (
                <div key={a.id} className={styles.activityItem}>
                  <div className={styles.activityIcon}>{getActivityIcon(a.type)}</div>
                  <div className={styles.activityContent}>
                    <p className={styles.activityText}>{getActivityText(a)}</p>
                    <span className={styles.activityDate}>
                      {new Date(a.created_at).toLocaleDateString("ru-RU")}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            {totalActivityPages > 1 && (
              <div className={styles.pagination}>
                <button type="button" onClick={() => setActivityPage((p) => Math.max(1, p - 1))} disabled={activityPage === 1}>
                  <ChevronLeft size={16} />
                </button>
                <span>{activityPage} / {totalActivityPages}</span>
                <button type="button" onClick={() => setActivityPage((p) => p + 1)} disabled={activityPage >= totalActivityPages}>
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </div>
        </section>

        {/* Модалка подписок */}
        {isFollowingModalOpen && (
          <div className={styles.modalOverlay} onClick={() => setIsFollowingModalOpen(false)}>
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
              <div className={styles.modalHeader}>
                <h3>Подписки</h3>
                <button className={styles.modalClose} onClick={() => setIsFollowingModalOpen(false)}>
                  <X size={20} />
                </button>
              </div>
              <div className={styles.modalBody}>
                {following.length === 0 ? (
                  <div className={styles.modalEmpty}>
                    <p>Нет подписок</p>
                  </div>
                ) : (
                  <div className={styles.followingList}>
                    {following.map((follow) => (
                      <Link 
                        key={follow.id} 
                        href={`/profile/${follow.id}`} 
                        className={styles.followingItem}
                        onClick={() => setIsFollowingModalOpen(false)}
                      >
                        <div className={styles.followingAvatar}>
                          {follow.avatar ? (
                            <Image src={resolveStorageUrl(follow.avatar)} alt={follow.name} width={40} height={40} unoptimized />
                          ) : (
                            <div className={styles.followingAvatarPlaceholder}>
                              {(follow.name || "U").charAt(0)}
                            </div>
                          )}
                        </div>
                        <span className={styles.followingName}>{follow.name}</span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <ProfileSettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          onSaved={(updatedUser) => {
            setProfile((prev) =>
              prev
                ? {
                    ...prev,
                    name: updatedUser?.name || prev.name,
                    avatar: updatedUser?.avatar || prev.avatar,
                    bio: updatedUser?.bio ?? prev.bio,
                  }
                : prev
            );
          }}
        />
      </div>
    </main>
  );
}