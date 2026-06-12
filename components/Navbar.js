"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import axios from "axios";
import NotificationBadge from "./NotificationBadge";
import { useAuth } from "../src/context/AuthContext";
import { useTheme } from "../src/context/ThemeContext";
import { useProtectedAction } from "../src/utils/useProtectedAction";
import { Home, BookOpen, Library, Menu, X, Sun, Moon, Monitor, Plus, Wallet, Layout, Coins, Shield, Search, User } from "lucide-react";
import styles from "./Navbar.module.css";

export default function Navbar() {
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isActionsOpen, setIsActionsOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const actionsRef = useRef(null);
  const searchRef = useRef(null);
  const searchTimeoutRef = useRef(null);
  
  const { user, token, login, logout, isHydrated, notifications, unreadNotifications, markNotificationsRead } = useAuth();
  const { mode, effective, cycleMode } = useTheme();
  const { requireAuth } = useProtectedAction();

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

  useEffect(() => {
    if (!isHydrated || !token) return;
    axios.get(`${apiUrl}/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then((response) => login(response.data, token))
      .catch(() => logout());
  }, [isHydrated, token, login, logout, apiUrl]);

  // Закрываем выпадающее меню при клике вне его
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (isActionsOpen && actionsRef.current && !actionsRef.current.contains(e.target)) {
        setIsActionsOpen(false);
      }
      if (isSearchOpen && searchRef.current && !searchRef.current.contains(e.target)) {
        setIsSearchOpen(false);
        setSearchQuery("");
        setSearchResults([]);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [isActionsOpen, isSearchOpen]);

  // Поиск пользователей
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (!searchQuery.trim() || !isSearchOpen) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    searchTimeoutRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await axios.get(`${apiUrl}/users`, {
          params: { search: searchQuery }
        });
        const users = Array.isArray(res.data) ? res.data : [];
        // Исключаем текущего пользователя из результатов
        const filtered = users.filter(u => u.id !== user?.id);
        setSearchResults(filtered.slice(0, 5));
      } catch (error) {
        console.error("Ошибка поиска:", error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery, isSearchOpen, apiUrl, user?.id]);

  async function handleLogout() {
    if (token) {
      try { 
        await axios.post(`${apiUrl}/auth/logout`, {}, { headers: { Authorization: `Bearer ${token}` } }); 
      } catch (error) {
        console.error("Ошибка при выходе:", error);
      }
    }
    
    localStorage.removeItem('eiry_token');
    localStorage.removeItem('eiry_user');
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    
    logout();
    window.location.href = "/home";
  }

  // Закрываем мобильное меню при клике вне его
  useEffect(() => {
    const handleClickOutsideMobile = (e) => {
      if (isMenuOpen && !e.target.closest(`.${styles.navLinksMobile}`) && !e.target.closest(`.${styles.burgerButton}`)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener("click", handleClickOutsideMobile);
    return () => document.removeEventListener("click", handleClickOutsideMobile);
  }, [isMenuOpen]);

  // Блокируем скролл при открытом меню
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isMenuOpen]);

  const themeTitle =
    mode === "auto"
      ? `Тема: авто (${effective === "dark" ? "ночь" : "день"}) — после 20:00 тёмная, до 7:00 светлая`
      : mode === "light"
        ? "Тема: светлая"
        : "Тема: тёмная";

  if (!isHydrated) return null;

  const isAdmin = user?.role === 'admin' || user?.is_admin === true;

  return (
    <>
      <header className={`${styles.navbar} ${effective === "light" ? styles.navbarLight : ""}`}>
        <div className={styles.inner}>
          <Link href="/home" className={styles.logo}>
            <span className={styles.logoText}>ЭЙРИ</span>
          </Link>

          <nav className={styles.navLinks}>
            <Link href="/home" className={styles.navLink}>
              <Home size={16} /> Главная
            </Link>
            <Link href="/feed" className={styles.navLink}>
              <BookOpen size={16} /> Каталог
            </Link>
            <Link href="/create-comic" className={styles.navLink}>
                  <Plus size={16} /> Создать комикс
                </Link>
            {isAdmin && (
              <Link href="/admin" className={styles.navLink}>
                <Shield size={16} /> Админка
              </Link>
            )}
          </nav>

          <div className={styles.authArea}>
            {/* Кнопка поиска */}
            <div className={styles.searchContainer} ref={searchRef}>
              <button 
                type="button" 
                className={styles.searchButton}
                onClick={() => setIsSearchOpen(!isSearchOpen)}
              >
                <Search size={18} />
              </button>
              
              {isSearchOpen && (
                <div className={styles.searchDropdown}>
                  <input
                    type="text"
                    className={styles.searchInput}
                    placeholder="Поиск пользователей..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    autoFocus
                  />
                  <div className={styles.searchResults}>
                    {isSearching && (
                      <div className={styles.searchLoading}>Поиск...</div>
                    )}
                    {!isSearching && searchQuery && searchResults.length === 0 && (
                      <div className={styles.searchEmpty}>Пользователи не найдены</div>
                    )}
                    {searchResults.map((result) => (
                      <Link
                        key={result.id}
                        href={`/profile/${result.id}`}
                        className={styles.searchResultItem}
                        onClick={() => {
                          setIsSearchOpen(false);
                          setSearchQuery("");
                          setSearchResults([]);
                        }}
                      >
                        <div className={styles.searchResultAvatar}>
                          {result.avatar ? (
                            <img src={result.avatar} alt="" />
                          ) : (
                            <User size={16} />
                          )}
                        </div>
                        <div className={styles.searchResultInfo}>
                          <span className={styles.searchResultName}>{result.name}</span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <button type="button" className={styles.themeBtnDesktop} onClick={cycleMode} title={themeTitle}>
              {mode === "auto" ? <Monitor size={18} /> : mode === "light" ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            
            {user ? (
              <>
                <div className={styles.actionsDropdown} ref={actionsRef}>
                  <button 
                    type="button" 
                    className={styles.actionsButton} 
                    onClick={() => setIsActionsOpen(!isActionsOpen)}
                  >
                    <Wallet size={20} />
                  </button>
                  {isActionsOpen && (
                    <div className={styles.dropdownMenu}>
                      <button onClick={() => { setIsActionsOpen(false); router.push("/wallet"); }}>
                        <Wallet size={16} /> Пополнить кошелёк
                      </button>
                      <button onClick={() => { setIsActionsOpen(false); router.push("/slider-buy"); }}>
                        <Layout size={16} /> Разместить в слайдере
                      </button>
                    </div>
                  )}
                </div>
                
                <NotificationBadge userId={user?.id} notifications={notifications} unreadCount={unreadNotifications} onToggle={() => {}} onOpen={markNotificationsRead} />
                <Link className={styles.userName} href={`/profile/${user.id}`}>{user.name}</Link>
                <Link href="/wallet" className={styles.walletDesktop}>
                  <Coins size={16} className={styles.coinIcon} />
                  {Number(user.wallet_balance ?? 0).toFixed(0)}
                </Link>
                <button type="button" className={styles.authButton} onClick={handleLogout}>Выйти</button>
              </>
            ) : (
              <>
                <Link href="/login" className={styles.authLink}>Логин</Link>
                <Link href="/register" className={styles.authButton}>Регистрация</Link>
              </>
            )}
            
            <button 
              className={styles.burgerButton} 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Меню"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        <div className={`${styles.navLinksMobile} ${isMenuOpen ? styles.navLinksMobileOpen : ""}`}>
          <div className={styles.mobileHeader}>
            <button className={styles.closeButton} onClick={() => setIsMenuOpen(false)}>
              <X size={24} /> 
            </button>
          </div>
          
          <Link href="/home" className={styles.navLinkMobile} onClick={() => setIsMenuOpen(false)}>
            <Home size={16} /> Главная
          </Link>
          <Link href="/feed" className={styles.navLinkMobile} onClick={() => setIsMenuOpen(false)}>
            <BookOpen size={16} /> Каталог
          </Link>
          {user && (
            <>
              <Link href={`/profile/${user.id}?tab=library`} className={styles.navLinkMobile} onClick={() => setIsMenuOpen(false)}>
                <Library size={16} /> Библиотека
              </Link>
              <Link href="/create-comic" className={styles.navLinkMobile} onClick={() => setIsMenuOpen(false)}>
                <Plus size={16} /> Создать комикс
              </Link>
              <Link href="/slider-buy" className={styles.navLinkMobile} onClick={() => setIsMenuOpen(false)}>
                <Layout size={16} /> Слайдер
              </Link>
              <div className={styles.mobileDivider}></div>
              <Link href={`/profile/${user.id}`} className={styles.navLinkMobile} onClick={() => setIsMenuOpen(false)}>
                {user.name}
              </Link>
              <Link href="/wallet" className={styles.navLinkMobile} onClick={() => setIsMenuOpen(false)}>
                <Coins size={16} className={styles.coinIcon} />
                Кошелёк: {Number(user.wallet_balance ?? 0).toFixed(0)} 
              </Link>
              <button className={styles.logoutBtn} onClick={() => { setIsMenuOpen(false); handleLogout(); }}>
                Выйти
              </button>
            </>
          )}
          {!user && (
            <>
              <Link href="/login" className={styles.navLinkMobile} onClick={() => setIsMenuOpen(false)}>
                Логин
              </Link>
              <Link href="/register" className={styles.navLinkMobile} onClick={() => setIsMenuOpen(false)}>
                Регистрация
              </Link>
            </>
          )}
        </div>

        <div 
          className={`${styles.overlay} ${isMenuOpen ? styles.overlayOpen : ""}`} 
          onClick={() => setIsMenuOpen(false)}
        />
      </header>
    </>
  );
}